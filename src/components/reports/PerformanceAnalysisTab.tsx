import React, { useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Calendar,
  Zap,
  Flame,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ShoppingBag,
  Award,
} from 'lucide-react';

export const PerformanceAnalysisTab: React.FC = () => {
  const { invoices, returns } = useStore();
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'count'>('sales');

  // Current Month Information
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentMonthName = now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // 1. Current Month Daily Sales Trend (اتجاهات المبيعات اليومية خلال الشهر الحالي)
  const currentMonthDailyData = useMemo(() => {
    const daysMap: Record<number, { day: number; label: string; sales: number; count: number; returns: number }> = {};

    // Initialize all days of current month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateObj = new Date(currentYear, currentMonth, day);
      const dayLabel = `${day} ${dateObj.toLocaleDateString('ar-EG', { month: 'short' })}`;
      daysMap[day] = {
        day,
        label: dayLabel,
        sales: 0,
        count: 0,
        returns: 0,
      };
    }

    // Aggregate Invoices for current month
    invoices.forEach((inv) => {
      const d = new Date(inv.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const dayNum = d.getDate();
        if (daysMap[dayNum]) {
          daysMap[dayNum].sales += inv.grandTotal;
          daysMap[dayNum].count += 1;
        }
      }
    });

    // Aggregate Returns for current month
    returns.forEach((ret) => {
      const d = new Date(ret.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const dayNum = d.getDate();
        if (daysMap[dayNum]) {
          daysMap[dayNum].returns += ret.totalRefundAmount;
        }
      }
    });

    return Object.values(daysMap).map((item) => ({
      ...item,
      netSales: Math.max(0, item.sales - item.returns),
    }));
  }, [invoices, returns, currentYear, currentMonth, daysInCurrentMonth]);

  // 2. Hourly Sales Peak Distribution (توزيع المبيعات حسب ساعات اليوم للتوقع)
  const hourlyPeakData = useMemo(() => {
    const hoursMap: Record<number, { hour: number; label: string; sales: number; count: number }> = {};

    // Standard business hours 9 AM (09:00) to 11 PM (23:00)
    for (let h = 9; h <= 23; h++) {
      const period = h >= 12 ? 'م' : 'ص';
      const formattedHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      hoursMap[h] = {
        hour: h,
        label: `${formattedHour}:00 ${period}`,
        sales: 0,
        count: 0,
      };
    }

    invoices.forEach((inv) => {
      const d = new Date(inv.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const h = d.getHours();
        if (hoursMap[h]) {
          hoursMap[h].sales += inv.grandTotal;
          hoursMap[h].count += 1;
        }
      }
    });

    return Object.values(hoursMap);
  }, [invoices, currentYear, currentMonth]);

  // 3. Day of Week Peak Analysis (توقع أيام الذروة الأسبوعية)
  const dayOfWeekData = useMemo(() => {
    const weekDays = [
      { id: 5, name: 'الجمعة' },
      { id: 6, name: 'السبت' },
      { id: 0, name: 'الأحد' },
      { id: 1, name: 'الإثنين' },
      { id: 2, name: 'الثلاثاء' },
      { id: 3, name: 'الأربعاء' },
      { id: 4, name: 'الخميس' },
    ];

    const dayStatsMap: Record<number, { dayName: string; sales: number; count: number; daysCount: number }> = {};
    weekDays.forEach((wd) => {
      dayStatsMap[wd.id] = { dayName: wd.name, sales: 0, count: 0, daysCount: 0 };
    });

    // Count occurrence of each weekday in current month up to today
    for (let day = 1; day <= now.getDate(); day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dayIndex = d.getDay();
      if (dayStatsMap[dayIndex]) {
        dayStatsMap[dayIndex].daysCount += 1;
      }
    }

    invoices.forEach((inv) => {
      const d = new Date(inv.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const dayIndex = d.getDay();
        if (dayStatsMap[dayIndex]) {
          dayStatsMap[dayIndex].sales += inv.grandTotal;
          dayStatsMap[dayIndex].count += 1;
        }
      }
    });

    return weekDays.map((wd) => {
      const stat = dayStatsMap[wd.id];
      const avgSales = stat.daysCount > 0 ? Math.round(stat.sales / stat.daysCount) : 0;
      return {
        dayName: stat.dayName,
        totalSales: stat.sales,
        avgSales,
        invoiceCount: stat.count,
      };
    });
  }, [invoices, currentYear, currentMonth, now]);

  // Key Peak Metrics
  const peakDay = useMemo(() => {
    if (currentMonthDailyData.length === 0) return null;
    return [...currentMonthDailyData].sort((a, b) => b.sales - a.sales)[0];
  }, [currentMonthDailyData]);

  const peakHour = useMemo(() => {
    if (hourlyPeakData.length === 0) return null;
    return [...hourlyPeakData].sort((a, b) => b.sales - a.sales)[0];
  }, [hourlyPeakData]);

  const peakDayOfWeek = useMemo(() => {
    if (dayOfWeekData.length === 0) return null;
    return [...dayOfWeekData].sort((a, b) => b.avgSales - a.avgSales)[0];
  }, [dayOfWeekData]);

  const totalMonthSales = currentMonthDailyData.reduce((sum, d) => sum + d.sales, 0);
  const activeDaysCount = currentMonthDailyData.filter((d) => d.sales > 0).length || 1;
  const avgDailySales = Math.round(totalMonthSales / activeDaysCount);

  // Custom Tooltip Component
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-normal">الشهر الحالي</span>
          </div>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-slate-300 font-medium">{entry.name}:</span>
              <span className="font-mono font-bold text-amber-300">
                {typeof entry.value === 'number' && entry.name.includes('مبيعات')
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
    <div className="space-y-6">
      {/* Top Peak Analysis Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Peak Day Card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-2xl p-4 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900/80 uppercase tracking-wider">
              أعلى يوم مبيعات في الشهر
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-950/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-slate-950" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black font-mono tracking-tight">
              {peakDay ? peakDay.label : '—'}
            </div>
            <div className="text-xs font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
              {peakDay ? `${peakDay.sales.toLocaleString()} ج.م (${peakDay.count} فاتورة)` : '0 ج.م'}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-900/10 text-[11px] font-bold text-slate-900/90 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>ذروة الأداء اليومي للشهر</span>
          </div>
        </div>

        {/* Peak Hour Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ساعة الذروة العظمى</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 font-mono">
              {peakHour ? peakHour.label : '—'}
            </div>
            <div className="text-xs font-bold font-mono text-amber-700 mt-0.5 tabular-nums">
              {peakHour ? `${peakHour.sales.toLocaleString()} ج.م (${peakHour.count} طلب)` : '0 ج.م'}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>فترة إقبال وإنجاز الصفقات</span>
          </div>
        </div>

        {/* Peak Weekday Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">أقوى يوم بالأسكوع (متوسط)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 font-mono">
              {peakDayOfWeek ? peakDayOfWeek.dayName : '—'}
            </div>
            <div className="text-xs font-bold font-mono text-emerald-700 mt-0.5 tabular-nums">
              {peakDayOfWeek ? `متوسط ${peakDayOfWeek.avgSales.toLocaleString()} ج.م / يوم` : '0 ج.م'}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>يوم التسوق والتواجد الأكبر</span>
          </div>
        </div>

        {/* Daily Average Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">متوسط المبيعات اليومية</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 font-mono tabular-nums">
              {avgDailySales.toLocaleString()} ج.م
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">
              إجمالي الشهر: <span className="font-mono text-slate-800 font-bold">{totalMonthSales.toLocaleString()} ج.م</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-sky-500" />
            <span>شامل {currentMonthName}</span>
          </div>
        </div>
      </div>

      {/* 1. Main Daily Sales Trend Chart for Current Month */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>اتجاهات المبيعات اليومية خلال الشهر الحالي ({currentMonthName})</span>
            </h3>
            <p className="text-xs text-slate-500">
              رسم بياني توضيحي باستخدام مكتبة Recharts يعرض تطور الإيرادات اليومية لتوقع فترات الذروة.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedMetric('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMetric === 'sales'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              قيمة المبيعات (ج.م)
            </button>
            <button
              onClick={() => setSelectedMetric('count')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMetric === 'count'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              عدد الفواتير
            </button>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentMonthDailyData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="monthSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="monthCountGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickMargin={5} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => <span className="text-slate-700 font-bold">{value}</span>}
              />
              {selectedMetric === 'sales' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="إجمالي مبيعات اليوم (ج.م)"
                    stroke="#d97706"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#monthSalesGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="netSales"
                    name="صافي المبيعات بعد المرتجعات (ج.م)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={0.6}
                    fill="url(#monthSalesGrad)"
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="count"
                  name="عدد الفواتير المنفذة"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#monthCountGrad)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Hourly & Day-of-Week Peak Predictions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Peak Hours Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>تحليل ساعات الذروة خلال اليوم</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                توزيع المبيعات عبر ساعات فتح المحل لتوقع أوقات الازدحام وإشغال الكاشير.
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyPeakData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="sales" name="مبيعات الساعة (ج.م)" radius={[6, 6, 0, 0]}>
                  {hourlyPeakData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.sales === (peakHour?.sales || 0) && entry.sales > 0 ? '#f59e0b' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of Week Peak Analysis */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>توقع أيام الذروة الأسبوعية</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                متوسط الإيراد اليومي لكل يوم من أيام الأسبوع لتوقع مواسم الويك إند.
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dayName" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="avgSales" name="متوسط المبيعات (ج.م)" radius={[6, 6, 0, 0]}>
                  {dayOfWeekData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.dayName === peakDayOfWeek?.dayName ? '#10b981' : '#64748b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
