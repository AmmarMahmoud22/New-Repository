import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { InstallmentContract, InstallmentScheduleItem } from '../../types';
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Banknote,
  Share2,
  Copy,
  Receipt,
  Phone,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface InstallmentManagerProps {
  initialTotal?: number;
  initialItemsSummary?: string;
}

export const InstallmentManager: React.FC<InstallmentManagerProps> = ({
  initialTotal = 0,
  initialItemsSummary = '',
}) => {
  const {
    installments,
    createInstallmentContract,
    collectInstallmentPayment,
    activeShift,
    hasPermission,
    permissions,
  } = useStore();

  const isReadOnly = permissions?.readOnly;

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(initialTotal > 0);
  const [expandedContractId, setExpandedContractId] = useState<string | null>(
    installments[0]?.id || null
  );

  // New Contract Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(initialTotal || 6000);
  const [downPayment, setDownPayment] = useState<number>(initialTotal ? Math.round(initialTotal * 0.25) : 1500);
  const [termMonths, setTermMonths] = useState<number>(4);
  const [itemsSummary, setItemsSummary] = useState(initialItemsSummary || 'بدلة رجالي تركي كاملة + قميص أكسفورد مصري');
  const [notes, setNotes] = useState('');

  // Collect Payment Modal State
  const [collectingTarget, setCollectingTarget] = useState<{
    contract: InstallmentContract;
    scheduleItem: InstallmentScheduleItem;
  } | null>(null);
  const [collectPaymentMethod, setCollectPaymentMethod] = useState<'cash' | 'card'>('card');
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  // WhatsApp Reminder Modal State
  const [reminderTarget, setReminderTarget] = useState<{
    contract: InstallmentContract;
    nextItem?: InstallmentScheduleItem;
    message: string;
  } | null>(null);
  const [copiedReminder, setCopiedReminder] = useState(false);

  // Calculation for new contract preview
  const remainingCalculated = Math.max(0, totalAmount - downPayment);
  const monthlyCalculated = termMonths > 0 ? Math.round((remainingCalculated / termMonths) * 100) / 100 : 0;

  // Overview Stats
  const totalContractedAmount = installments.reduce((sum, c) => sum + c.totalPurchaseAmount, 0);
  const totalRemainingAmount = installments.reduce((sum, c) => {
    const paidSum = c.downPayment + c.schedule.filter((s) => s.isPaid).reduce((s, it) => s + (it.paidAmount || it.amount), 0);
    return sum + Math.max(0, c.totalPurchaseAmount - paidSum);
  }, 0);
  const totalCollectedAmount = totalContractedAmount - totalRemainingAmount;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || totalAmount <= 0) return;

    createInstallmentContract({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      nationalId: nationalId.trim(),
      totalAmount,
      downPayment,
      termMonths,
      itemsSummary,
      notes,
    });

    setShowCreateModal(false);
    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setNationalId('');
    setTotalAmount(6000);
    setDownPayment(1500);
    setTermMonths(4);
    setItemsSummary('');
    setNotes('');
  };

  const handleOpenCollect = (
    contract: InstallmentContract,
    scheduleItem: InstallmentScheduleItem
  ) => {
    setCollectingTarget({ contract, scheduleItem });
  };

  const handleConfirmCollect = () => {
    if (!collectingTarget) return;

    const res = collectInstallmentPayment(
      collectingTarget.contract.id,
      collectingTarget.scheduleItem.monthIndex,
      collectingTarget.scheduleItem.amount,
      collectPaymentMethod
    );

    if (res.success) {
      setLastReceipt(res.receiptNumber);
      setTimeout(() => {
        setCollectingTarget(null);
        setLastReceipt(null);
      }, 1500);
    }
  };

  const handleOpenReminder = (contract: InstallmentContract) => {
    const nextItem = contract.schedule.find((s) => !s.isPaid);
    const paidSum =
      contract.downPayment +
      contract.schedule.filter((s) => s.isPaid).reduce((sum, it) => sum + (it.paidAmount || it.amount), 0);
    const currentRemaining = Math.max(0, contract.totalPurchaseAmount - paidSum);

    const dueDateFormatted = nextItem
      ? new Date(nextItem.dueDate).toLocaleDateString('ar-EG')
      : 'لا يوجد قسط مستحق';

    const message =
      `السلام عليكم ورحمة الله وبركاته، عميلنا الكريم: *${contract.customerName}* 👔✨\n\n` +
      `تحية طيبة من *اخين AKHEN* للأزياء والملابس.\n` +
      `نود تذكير سيادتكم بموعد استحقاق القسط الشهري رقم (${nextItem ? nextItem.monthIndex : '-'}) لعقد المشتريات (#${contract.contractNumber}):\n` +
      `--------------------------------\n` +
      `💵 *قيمة القسط المستحق:* *${nextItem ? nextItem.amount.toLocaleString() : '0'} ج.م*\n` +
      `📅 *تاريخ الاستحقاق:* ${dueDateFormatted}\n` +
      `📊 المتبقي الإجمالي بعد هذا القسط: ${(currentRemaining - (nextItem?.amount || 0)).toLocaleString()} ج.م\n` +
      `💳 طرق السداد: يمكنكم السداد بالمعرض كاش / فيزا أو عبر المحافظ الإلكترونية وإنستاباي.\n` +
      `--------------------------------\n` +
      `شاكرين ومقدرين حسن تعاونكم والتزامكم الدائم! 🤍`;

    setReminderTarget({
      contract,
      nextItem,
      message,
    });
  };

  const filteredContracts = installments.filter(
    (c) =>
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerPhone.includes(searchQuery) ||
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 flex items-center justify-between font-medium">
            <span>إجمالي عقود التقسيط</span>
            <CalendarDays className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {installments.length} <span className="text-xs text-slate-500 font-sans">عقود</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            بقيمة {totalContractedAmount.toLocaleString()} ج.م
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 flex items-center justify-between font-medium">
            <span>المبالغ المحصلة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
            {totalCollectedAmount.toLocaleString()}{' '}
            <span className="text-xs text-slate-500 font-sans">ج.م</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            نسبة التحصيل:{' '}
            {totalContractedAmount > 0
              ? Math.round((totalCollectedAmount / totalContractedAmount) * 100)
              : 0}
            %
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 flex items-center justify-between font-medium">
            <span>المبالغ المتبقية للتحصيل</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold text-sky-600 font-mono tabular-nums">
            {totalRemainingAmount.toLocaleString()}{' '}
            <span className="text-xs text-slate-500 font-sans">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">تُحصل شهرياً حسب الجداول المعتمدة</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-500 mb-1 flex items-center justify-between font-medium">
            <span>تسجيل عقد جديد</span>
            <Plus className="w-4 h-4 text-amber-500" />
          </div>
          {!isReadOnly ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل عقد تقسيط جديد</span>
            </button>
          ) : (
            <span className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 text-center font-semibold">
              مشاهدة فقط
            </span>
          )}
        </div>
      </div>

      {/* Contracts Listing & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-500" />
            <span>سجل عقود التقسيط وجداول السداد الشهرية</span>
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالعميل أو الهاتف أو العقد..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* List of Contracts */}
        <div className="space-y-3">
          {filteredContracts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              لا توجد عقود تقسيط مطابقة للبحث.
            </div>
          ) : (
            filteredContracts.map((contract) => {
              const isExpanded = expandedContractId === contract.id;
              const paidSum =
                contract.downPayment +
                contract.schedule
                  .filter((s) => s.isPaid)
                  .reduce((sum, it) => sum + (it.paidAmount || it.amount), 0);
              const remaining = Math.max(0, contract.totalPurchaseAmount - paidSum);
              const isAllPaid = remaining === 0;

              return (
                <div
                  key={contract.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-all shadow-xs"
                >
                  {/* Contract Header Row */}
                  <div
                    onClick={() =>
                      setExpandedContractId(isExpanded ? null : contract.id)
                    }
                    className="p-4 cursor-pointer hover:bg-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-mono">
                        {contract.schedule.filter((s) => s.isPaid).length}/
                        {contract.termMonths}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {contract.customerName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                            {contract.contractNumber}
                          </span>
                          {isAllPaid ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                              مكتمل ومسدد بالكامل
                            </span>
                          ) : (
                            <span className="text-[10px] bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full font-medium">
                              نشط (سارٍ)
                            </span>
                          )}
                        </div>

                        <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                          <span>هاتف: {contract.customerPhone}</span>
                          <span>·</span>
                          <span>الرقم القومي: {contract.nationalId}</span>
                          <span>·</span>
                          <span>المشتريات: {contract.itemsSummary}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex items-center justify-between md:justify-end gap-5">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">إجمالي العقد:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {(contract.totalPurchaseAmount ?? 0).toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">المدفوع:</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {paidSum.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">المتبقي:</span>
                        <span className="font-mono font-bold text-amber-600">
                          {remaining.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReminder(contract);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="صياغة وإرسال رسالة تذكير أنيقة عبر واتساب"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>تذكير واتساب</span>
                        </button>

                        <div className="text-slate-400 p-1">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Schedule Items */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 p-4 bg-white space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          جدول الأقساط الشهرية ({contract.termMonths} شهور):
                        </span>
                        <span className="text-[11px] text-slate-500">
                          الدفعة المقدمة المسددة: {contract.downPayment.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        {contract.schedule.map((item) => (
                          <div
                            key={item.monthIndex}
                            className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                              item.isPaid
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">
                                  قسط شهر {item.monthIndex}
                                </span>
                                {item.isPaid ? (
                                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                    مسدد ✓
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 font-medium">
                                    مستحق
                                  </span>
                                )}
                              </div>

                              <div className="font-mono font-bold text-base text-amber-600">
                                {item.amount.toLocaleString()} ج.م
                              </div>

                              <div className="text-[11px] text-slate-500">
                                الاستحقاق: {new Date(item.dueDate).toLocaleDateString('ar-EG')}
                              </div>

                              {item.isPaid && (
                                <div className="text-[10px] text-emerald-700 mt-1 border-t border-emerald-200 pt-1">
                                  <div>سند: {item.receiptNumber}</div>
                                  <div>سُدد في: {new Date(item.paidDate!).toLocaleDateString('ar-EG')}</div>
                                </div>
                              )}
                            </div>

                            {!item.isPaid && !isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleOpenCollect(contract, item)}
                                className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>تحصيل القسط</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create New Installment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-500" />
                <span>تسجيل وجدولة عقد تقسيط ملابس جديد</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">اسم العميل بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: حسام الدين محمود"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">رقم الهاتف (واتساب) *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">الرقم القومي (14 رقم) *</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="29XXXXXXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Financials & Term */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">المبلغ الإجمالي (ج.م) *</label>
                  <input
                    type="number"
                    min="500"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">المقدم المدفوع (ج.م) *</label>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    required
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">عدد الشهور (2 - 24) *</label>
                  <input
                    type="number"
                    min="2"
                    max="24"
                    required
                    value={termMonths}
                    onChange={(e) => setTermMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Monthly Calculation Summary */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-600 block text-[10px]">المبلغ المتبقي للتقسيط:</span>
                  <span className="text-slate-900 font-bold font-mono text-sm tabular-nums">
                    {remainingCalculated.toLocaleString()} ج.م
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">قيمة القسط الشهري:</span>
                  <span className="text-amber-700 font-bold font-mono text-sm tabular-nums">
                    {monthlyCalculated.toLocaleString()} ج.م / شهر
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">وصف المشتريات والقطع</label>
                <textarea
                  rows={2}
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  placeholder="بدلة كحلي مقاس 52 + قميصين قطن مصري..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  اعتماد العقد والجدولة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Installment Payment Modal */}
      {collectingTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>تحصيل قسط شهري</span>
            </h3>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">العميل:</span>
                <span className="font-bold text-slate-900">{collectingTarget.contract.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">رقم القسط:</span>
                <span className="text-amber-700 font-bold">شهر #{collectingTarget.scheduleItem.monthIndex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المبلغ المطلوب:</span>
                <span className="text-emerald-700 font-mono font-bold text-sm">
                  {collectingTarget.scheduleItem.amount.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1.5">طريقة التحصيل:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCollectPaymentMethod('cash')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    collectPaymentMethod === 'cash'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Banknote className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">كاش (نقد بالدرج)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCollectPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    collectPaymentMethod === 'card'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">فيزا / بطاقة بنكية</span>
                </button>
              </div>
            </div>

            {lastReceipt ? (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-300 p-3 rounded-xl text-center text-xs font-bold">
                ✓ تم السداد بنجاح! سند القبض: {lastReceipt}
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCollectingTarget(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCollect}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  تأكيد استلام المبلغ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Reminder Modal */}
      {reminderTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                <span>رسالة تذكير أنيقة وجاهزة للإرسال عبر WhatsApp</span>
              </h3>
              <button
                onClick={() => setReminderTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {reminderTarget.message}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reminderTarget.message);
                  setCopiedReminder(true);
                  setTimeout(() => setCopiedReminder(false), 2000);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-200"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedReminder ? 'تم النسخ!' : 'نسخ نص الرسالة'}</span>
              </button>

              <button
                onClick={() => {
                  const phone = reminderTarget.contract.customerPhone.replace(/[^0-9]/g, '');
                  const cleanPhone = phone.startsWith('0') ? '20' + phone.substring(1) : phone;
                  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    reminderTarget.message
                  )}`;
                  window.open(url, '_blank');
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>فتح محادثة واتساب الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
