import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Shift, ExpenseCategory } from '../../types';
import {
  Wallet,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  AlertCircle,
  CheckCircle,
  Plus,
  Printer,
  Sparkles,
  HelpCircle,
  FileText,
  DollarSign,
  Coffee,
  Wrench,
  Package,
} from 'lucide-react';

interface ShiftTreasuryViewProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
}

export const ShiftTreasuryView: React.FC<ShiftTreasuryViewProps> = ({
  onOpenPinModal,
}) => {
  const {
    activeShift,
    shiftHistory,
    expenses,
    logExpense,
    closeActiveShift,
    openNewShift,
    currentUser,
    hasPermission,
    permissions,
  } = useStore();

  const isReadOnly = permissions?.readOnly;

  // Handover state
  const [countedCash, setCountedCash] = useState<number>(activeShift?.expectedCash || 2000);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [closedSummary, setClosedSummary] = useState<{
    discrepancy: number;
    status: 'surplus' | 'deficit' | 'balanced';
  } | null>(null);

  // New Shift state
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [openingFund, setOpeningFund] = useState<number>(2000);
  const [openShiftNotes, setOpenShiftNotes] = useState('شيفت جديد');

  // Expense Form State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('hospitality');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(100);
  const [expenseNotes, setExpenseNotes] = useState('');

  // Calculations for active shift
  const currentDiscrepancy = activeShift ? countedCash - activeShift.expectedCash : 0;

  const handleConfirmHandover = () => {
    onOpenPinModal('إغلاق وتسليم الوردية والجرد المالي (PIN المدير)', () => {
      const res = closeActiveShift(countedCash, handoverNotes);
      setClosedSummary(res);
      setShowHandoverModal(false);
    });
  };

  const handleConfirmOpenShift = () => {
    openNewShift(openingFund, openShiftNotes);
    setShowOpenShiftModal(false);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || expenseAmount <= 0) return;

    logExpense(expenseCategory, expenseTitle.trim(), expenseAmount, expenseNotes.trim());
    setShowExpenseModal(false);
    setExpenseTitle('');
    setExpenseAmount(100);
    setExpenseNotes('');
  };

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'hospitality':
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-sky-400" />;
      case 'supplies':
        return <Package className="w-4 h-4 text-emerald-400" />;
      default:
        return <Receipt className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              الشيفتات والمركز المالي والخزينة (Shift & Treasury Handover)
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            متابعة دقيقة للنقدية الفعلية داخل الدرج، جرد تسليم الوردية، احتساب الفوارق
            (عجز أو زيادة)، وتسجيل المصروفات النثرية مع الخصم الفوري بالجنيه المصري.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {activeShift ? (
              <>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>تسجيل مصروف جانبي</span>
                </button>

                <button
                  onClick={() => {
                    setCountedCash(activeShift.expectedCash);
                    setShowHandoverModal(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Clock className="w-4 h-4" />
                  <span>إغلاق وتسليم الوردية</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowOpenShiftModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>فتح وردية جديدة واستلام العهدة</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active Shift Financial Metrics */}
      {activeShift ? (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>الوردية الحالية المفتوحة (#{activeShift.shiftNumber})</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                      نشطة
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    استلمها: {activeShift.openedBy} في{' '}
                    {new Date(activeShift.openedAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    - {new Date(activeShift.openedAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>

              <div className="text-right sm:text-left">
                <span className="text-xs text-slate-500 block">النقدية الفعلية المحسوبة بالدرج:</span>
                <span className="text-xl font-bold font-mono text-emerald-600 tabular-nums">
                  {activeShift.expectedCash.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            {/* Financial Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">العهدة الافتتاحية:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {(activeShift.openingCashFund ?? 0).toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">مبيعات نقدية (كاش):</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  +{(activeShift.summary?.totalCashSales ?? 0).toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">مبيعات فيزا / شبكة:</span>
                <span className="font-mono font-bold text-sky-600 text-sm">
                  +{(activeShift.summary?.totalCardSales ?? 0).toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">مقدمات وأقساط محصلة:</span>
                <span className="font-mono font-bold text-amber-600 text-sm">
                  +{((activeShift.summary?.totalInstallmentDown ?? 0) + (activeShift.summary?.totalInstallmentCollected ?? 0)).toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">المصروفات النثرية:</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  -{(activeShift.summary?.totalExpenses ?? 0).toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">عدد الفواتير المنفذة:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {activeShift.summary.invoiceCount} فاتورة
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">الوردية مغلقة حالياً</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            قم بفتح وردية جديدة واستلام العهدة النقدية في الدرج لتفعيل الكاشير وتسجيل المبيعات.
          </p>
          {!isReadOnly && (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              فتح وردية جديدة الآن
            </button>
          )}
        </div>
      )}

      {/* Expenses Log Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              سجل المصروفات النثرية والجانبية (مخصومة فورياً من الدرج)
            </h3>
          </div>

          {activeShift && !isReadOnly && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
            >
              + إضافة مصروف
            </button>
          )}
        </div>

        {expenses.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            لم يتم تسجيل أي مصروفات نثرية خلال هذا الشيفت.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-2 px-3">الوقت</th>
                  <th className="py-2 px-3">البند والنوع</th>
                  <th className="py-2 px-3">الوصف والبيان</th>
                  <th className="py-2 px-3">المسؤول</th>
                  <th className="py-2 px-3 text-left">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {new Date(exp.date).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center gap-1.5">
                      {getCategoryIcon(exp.category)}
                      <span>{exp.categoryLabel}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {exp.title} {exp.notes ? `(${exp.notes})` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{exp.recordedBy}</td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold text-rose-600 tabular-nums">
                      -{exp.amount.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closed Shifts History (Z-Reports) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>سجل الورديات السابقة وتقارير الإغلاق (Z-Reports)</span>
        </h3>

        {shiftHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            لا توجد ورديات مغلقة مسجلة حتى الآن.
          </div>
        ) : (
          <div className="space-y-3">
            {shiftHistory.map((s) => (
              <div
                key={s.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">الوردية #{s.shiftNumber}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                      مغلقة
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        (s.discrepancy || 0) === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : (s.discrepancy || 0) > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {(s.discrepancy || 0) === 0
                        ? 'مطابق تماماً ✓'
                        : (s.discrepancy || 0) > 0
                        ? `زيادة: +${s.discrepancy?.toLocaleString()} ج.م`
                        : `عجز: ${s.discrepancy?.toLocaleString()} ج.م`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    فتحها: {s.openedBy} ({new Date(s.openedAt).toLocaleDateString('ar-EG')}) ·
                    أغلقها: {s.closedBy || 'المدير'} (
                    {s.closedAt ? new Date(s.closedAt).toLocaleTimeString('ar-EG') : ''})
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">النقد المتوقع:</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {(s.expectedCash ?? 0).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">النقد الفعلي المسلّم:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {s.countedCash?.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Handover & Cash Reconciliation Modal */}
      {showHandoverModal && activeShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>جرد وإغلاق الوردية وتسليم الخزينة</span>
            </h3>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">النقد المتوقع بالنظام:</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeShift.expectedCash.toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المصروفات المخصومة:</span>
                <span className="font-mono text-rose-600 font-semibold">
                  -{activeShift.summary.totalExpenses.toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">إجمالي الفواتير:</span>
                <span className="font-mono text-slate-800">
                  {activeShift.summary.invoiceCount} فواتير
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 block mb-1 font-bold">
                الجرد الفعلي للكاش بالدرج (ج.م) *
              </label>
              <input
                type="number"
                value={countedCash}
                onChange={(e) => setCountedCash(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Discrepancy Live Box */}
            <div
              className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                currentDiscrepancy === 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : currentDiscrepancy > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <span>نتيجة المطابقة المالية:</span>
              <span className="font-bold text-sm">
                {currentDiscrepancy === 0
                  ? 'مطابق تماماً (٠ ج.م)'
                  : currentDiscrepancy > 0
                  ? `زيادة بمقدار +${currentDiscrepancy.toLocaleString()} ج.م`
                  : `عجز بمقدار ${currentDiscrepancy.toLocaleString()} ج.م`}
              </span>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">ملاحظات تسليم الوردية:</label>
              <textarea
                rows={2}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="تم تسليم الكاش لمدير الفرع ومطابقة الفواتير..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHandoverModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmHandover}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                تأكيد الإغلاق والتسليم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open New Shift Modal */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>فتح وردية واستلام عهدة نقدية</span>
            </h3>

            <div>
              <label className="text-xs text-slate-700 block mb-1 font-bold">
                العهدة الافتتاحية المستلمة في الدرج (ج.م) *
              </label>
              <input
                type="number"
                min="0"
                value={openingFund}
                onChange={(e) => setOpeningFund(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 block mb-1 font-bold">بيان أو ملاحظات:</label>
              <input
                type="text"
                value={openShiftNotes}
                onChange={(e) => setOpenShiftNotes(e.target.value)}
                placeholder="شيفت مسائي..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOpenShiftModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmOpenShift}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                بدء الوردية الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-600" />
              <span>تسجيل مصروف جانبي من الخزينة</span>
            </h3>

            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-700 block mb-1 font-bold">بند المصروف:</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-medium"
                >
                  <option value="hospitality">ضيافة واستقبال عملاء</option>
                  <option value="maintenance">صيانة وإصلاحات المعرض</option>
                  <option value="supplies">أكياس وتغليف ومطبوعات</option>
                  <option value="bills">فواتير وخدمات لوجستية</option>
                  <option value="misc">نثريات طارئة</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-700 block mb-1 font-bold">البيان / الوصف *</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="مثال: شراء شاي وسكر ومياه لعملاء المحل"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 block mb-1 font-bold">المبلغ المصروف (ج.م) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  خصم من الدرج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
