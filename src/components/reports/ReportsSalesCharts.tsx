import React, { useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  BarChart2,
  PieChart as PieChartIcon,
  CreditCard,
  DollarSign,
  Layers,
} from 'lucide-react';

export const ReportsSalesCharts: React.FC = () => {
  const { invoices, returns } = useStore();
  const [chartMode, setChartMode] = useState<'daily' | 'monthly' | 'payment'>('daily');

  // 1. Daily Sales Trend Data (Last 14 Days)
  const dailyData = useMemo(() => {
    const daysMap: Record<string, { dateStr: string; label: string; sales: number; count: number; returns: number }> = {};
    
    // Generate last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const arDayLabel = d.toLocaleDateString('ar-EG', { weekday: 'short', month: 'numeric', day: 'numeric' });
      
      daysMap[isoDate] = {
        dateStr: isoDate,
        label: arDayLabel,
        sales: 0,
        count: 0,
        returns: 0,
      };
    }

    invoices.forEach((inv) => {
      const invDate = inv.date.slice(0, 10);
      if (daysMap[invDate]) {
        daysMap[invDate].sales += inv.grandTotal;
        daysMap[invDate].count += 1;
      }
    });

    returns.forEach((ret) => {
      const retDate = ret.date.slice(0, 10);
      if (daysMap[retDate]) {
        daysMap[retDate].returns += ret.totalRefundAmount;
      }
    });

    return Object.values(daysMap).map((item) => ({
      ...item,
      netSales: Math.max(0, item.sales - item.returns),
    }));
  }, [invoices, returns]);

  // 2. Monthly Sales Trend Data (Last 6 Months)
  const monthlyData = useMemo(() => {
    const monthsMap: Record<string, { monthKey: string; label: string; sales: number; count: number; returns: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const arMonthLabel = d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

      monthsMap[yearMonth] = {
        monthKey: yearMonth,
        label: arMonthLabel,
        sales: 0,
        count: 0,
        returns: 0,
      };
    }

    invoices.forEach((inv) => {
      const yearMonth = inv.date.slice(0, 7);
      if (monthsMap[yearMonth]) {
        monthsMap[yearMonth].sales += inv.grandTotal;
        monthsMap[yearMonth].count += 1;
      }
    });

    returns.forEach((ret) => {
      const yearMonth = ret.date.slice(0, 7);
      if (monthsMap[yearMonth]) {
        monthsMap[yearMonth].returns += ret.totalRefundAmount;
      }
    });

    return Object.values(monthsMap).map((item) => ({
      ...item,
      netSales: Math.max(0, item.sales - item.returns),
    }));
  }, [invoices, returns]);

  // 3. Payment Method Distribution
  const paymentData = useMemo(() => {
    const methods = {
      cash: { name: 'نقدي (كاش)', amount: 0, color: '#10b981' },
      card: 'بطاقة (فيزا)',
      split: 'مزدوج (كاش + فيزا)',
      installment: 'تقسيط شهري',
    };

    let cashTotal = 0;
    let cardTotal = 0;
    let splitTotal = 0;
    let installmentTotal = 0;

    invoices.forEach((inv) => {
      if (inv.paymentMethod === 'cash') cashTotal += inv.grandTotal;
      else if (inv.paymentMethod === 'card') cardTotal += inv.grandTotal;
      else if (inv.paymentMethod === 'split') splitTotal += inv.grandTotal;
      else if (inv.paymentMethod === 'installment') installmentTotal += inv.grandTotal;
    });

    return [
      { name: 'نقدي (كاش)', value: cashTotal, color: '#10b981' },
      { name: 'بطاقة إلكترونية (فيزا)', value: cardTotal, color: '#3b82f6' },
      { name: 'دفع مزدوج (كاش + فيزا)', value: splitTotal, color: '#f59e0b' },
      { name: 'تقسيط شهري', value: installmentTotal, color: '#8b5cf6' },
    ].filter((item) => item.value > 0);
  }, [invoices]);

  // Custom Tooltip Formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1.5 font-sans">
          <div className="font-bold text-amber-800 border-b border-slate-100 pb-1">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span style={{ color: entry.color }} className="font-semibold">
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {typeof entry.value === 'number'
                  ? `${entry.value.toLocaleString()} ج.م`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              الرسوم البيانية المباشرة لمؤشرات المبيعات (Recharts Analytics)
            </h3>
            <p className="text-[11px] text-slate-500">
              متابعة اتجاهات المبيعات اليومية والشهرية وتوزيع وسائل الدفع بالرسوم التفاعلية.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setChartMode('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              chartMode === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>الاتجاه اليومي (14 يوم)</span>
          </button>

          <button
            onClick={() => setChartMode('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              chartMode === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>المبيعات الشهرية (6 شهور)</span>
          </button>

          <button
            onClick={() => setChartMode('payment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              chartMode === 'payment'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>توزيع طرق الدفع</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-72 w-full pt-2">
        {chartMode === 'daily' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickMargin={5} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => <span className="text-slate-700 font-semibold">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="sales"
                name="إجمالي المبيعات (ج.م)"
                stroke="#d97706"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salesGrad)"
              />
              <Area
                type="monotone"
                dataKey="netSales"
                name="صافي المبيعات بعد المرتجعات (ج.م)"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#netGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartMode === 'monthly' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickMargin={5} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => <span className="text-slate-700 font-semibold">{value}</span>}
              />
              <Bar dataKey="sales" name="إجمالي المبيعات الشهرية (ج.م)" fill="#2563eb" radius={[6, 6, 0, 0]} />
              <Bar dataKey="netSales" name="صافي المبيعات (ج.م)" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartMode === 'payment' && (
          <div className="h-full flex flex-col md:flex-row items-center justify-around gap-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '11px', color: '#1e293b' }}
                  formatter={(value, entry: any) => (
                    <span className="text-slate-800 font-semibold mr-2">
                      {value}: <span className="font-mono text-amber-700 font-bold">{entry.payload.value.toLocaleString()} ج.م</span>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
