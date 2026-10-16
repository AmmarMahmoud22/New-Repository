import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Clock,
  Wallet,
  CheckCircle2,
  Calendar,
  Store,
  Sparkles,
  Award,
  ArrowLeft,
  X,
  CreditCard,
  Tag,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface DailyDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const DailyDashboardModal: React.FC<DailyDashboardModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { invoices, customers, currentUser, activeShift, employees, products } = useStore();

  if (!isOpen) return null;

  // Calculate Today's Metrics
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDateFormatted = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Today Invoices
  const todayInvoices = invoices.filter((inv) => inv.date.startsWith(todayStr));
  const todaySalesTotal = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const todayInvoicesCount = todayInvoices.length;
  const avgInvoiceValue = todayInvoicesCount > 0 ? Math.round(todaySalesTotal / todayInvoicesCount) : 0;

  // Today New Customers
  const todayNewCustomers = customers.filter((cust) => cust.createdAt && cust.createdAt.startsWith(todayStr));
  const todayNewCustomersCount = todayNewCustomers.length;

  // Today Salesman Performance
  const todaySalesBySalesman: Record<string, number> = {};
  todayInvoices.forEach((inv) => {
    const sName = inv.salesmanName || 'غير محدد';
    todaySalesBySalesman[sName] = (todaySalesBySalesman[sName] || 0) + inv.grandTotal;
  });

  const topSalesmanEntry = Object.entries(todaySalesBySalesman).sort((a, b) => b[1] - a[1])[0];

  // Payment Breakdown Today
  let todayCash = 0;
  let todayCard = 0;
  todayInvoices.forEach((inv) => {
    if (inv.paymentMethod === 'cash') todayCash += inv.grandTotal;
    else if (inv.paymentMethod === 'card') todayCard += inv.grandTotal;
    else if (inv.paymentMethod === 'split') {
      todayCash += inv.cashPaid || 0;
      todayCard += inv.cardPaid || 0;
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden relative my-auto">
        {/* Glow Header Accent */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors z-10"
          title="إغلاق اللوحة"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Welcome & Brand Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[11px] text-amber-700 font-bold uppercase tracking-widest">
                  AKHEN POS DAILY EXECUTIVE DASHBOARD
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>مرحباً بك، {currentUser.name}</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </h2>

              <p className="text-xs text-slate-500 flex items-center gap-2 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{todayDateFormatted}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-700 font-bold">اخين AKHEN للأزياء والملابس</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-slate-100 border border-slate-200 text-slate-800 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>
                  {currentUser.role === 'manager'
                    ? 'مدير الفرع'
                    : currentUser.role === 'cashier'
                    ? 'كاشير رئيسي'
                    : 'بائع'}
                </span>
              </span>
            </div>
          </div>

          {/* Core Daily KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Total Sales */}
            <div className="bg-amber-50/60 border border-amber-200 p-5 rounded-2xl relative overflow-hidden shadow-xs group hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">إجمالي مبيعات اليوم</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-black text-amber-900 font-mono tracking-tight tabular-nums">
                  {todaySalesTotal.toLocaleString()}{' '}
                  <span className="text-xs text-amber-800 font-sans">ج.م</span>
                </div>
                <div className="text-[11px] text-amber-800 mt-1 flex items-center gap-1 font-medium">
                  <span>متوسط الفاتورة:</span>
                  <span className="font-mono text-slate-900 font-bold">{avgInvoiceValue.toLocaleString()} ج.م</span>
                </div>
              </div>
            </div>

            {/* Card 2: Invoices Count */}
            <div className="bg-sky-50/60 border border-sky-200 p-5 rounded-2xl relative overflow-hidden shadow-xs group hover:border-sky-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900">عدد فواتير اليوم</span>
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-black text-sky-900 font-mono tracking-tight">
                  {todayInvoicesCount}{' '}
                  <span className="text-xs text-sky-800 font-sans">فاتورة</span>
                </div>
                <div className="text-[11px] text-sky-800 mt-1 flex items-center gap-1 font-medium">
                  <span>إجمالي الفواتير الكلي:</span>
                  <span className="font-mono text-slate-900 font-bold">{invoices.length}</span>
                </div>
              </div>
            </div>

            {/* Card 3: New Customers */}
            <div className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-2xl relative overflow-hidden shadow-xs group hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">العملاء الجدد اليوم</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-900 font-mono tracking-tight">
                  {todayNewCustomersCount}{' '}
                  <span className="text-xs text-emerald-800 font-sans">عميل جديد</span>
                </div>
                <div className="text-[11px] text-emerald-800 mt-1 flex items-center gap-1 font-medium">
                  <span>إجمالي قاعدة العملاء:</span>
                  <span className="font-mono text-slate-900 font-bold">{customers.length} عميل</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Secondary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shift Status Widget */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="text-slate-700 font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>حالة الوردية والخزينة المباشرة:</span>
                </span>
                {activeShift ? (
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                    وردية #{activeShift.shiftNumber} (مفتوحة)
                  </span>
                ) : (
                  <span className="text-[11px] bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full font-bold">
                    الوردية مغلقة
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] text-slate-500">نقدية الكاش بالدرج:</div>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">
                    {activeShift ? `${activeShift.expectedCash.toLocaleString()} ج.م` : '0 ج.م'}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] text-slate-500">تحصيل الفيزا اليوم:</div>
                  <div className="font-mono font-bold text-sky-700 mt-0.5">
                    {todayCard.toLocaleString()} ج.م
                  </div>
                </div>
              </div>
            </div>

            {/* Top Salesman Widget */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="text-slate-700 font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>أعلى الموظفين مبيعاً اليوم:</span>
                </span>
                <span className="text-[11px] text-amber-800 font-mono font-bold">
                  {topSalesmanEntry ? `${topSalesmanEntry[1].toLocaleString()} ج.م` : 'لا توجد عمليات بعد'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs">
                    {topSalesmanEntry ? topSalesmanEntry[0].slice(0, 1) : '—'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {topSalesmanEntry ? topSalesmanEntry[0] : 'في انتظار أول عملية بيع اليوم'}
                    </div>
                    <div className="text-[10px] text-slate-500">توب بائع الفرع لهذا اليوم</div>
                  </div>
                </div>

                <div className="text-left font-mono text-xs font-bold text-emerald-700">
                  {topSalesmanEntry ? '👑 المتصدر' : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Footer Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-600 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>جاهز لبدء عمليات البيع واستقبال العملاء في الفرع؟</span>
            </p>

            <button
              onClick={() => {
                onClose();
                if (onNavigateTab) onNavigateTab('pos');
              }}
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all"
            >
              <span>الدخول إلى شاشة الكاشير والمخزون</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
