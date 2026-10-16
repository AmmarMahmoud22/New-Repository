import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export const SalesChart: React.FC = () => {
  const { invoices } = useStore();

  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const salesByDay = invoices.reduce((acc, inv) => {
      const date = inv.date.split('T')[0];
      acc[date] = (acc[date] || 0) + inv.grandTotal;
      return acc;
    }, {} as Record<string, number>);

    return last7Days.map((day) => ({
      day,
      sales: salesByDay[day] || 0,
    }));
  }, [invoices]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-900">
          تطور المبيعات اليومية (آخر 7 أيام)
        </h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="day"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(val) => val.slice(5)}
            />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
