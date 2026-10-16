import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { TreasuryTransaction, TreasuryTransactionType } from '../../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Plus,
  Minus,
  DollarSign,
  Calendar,
  FileText,
  Printer,
  X,
  TrendingUp,
  TrendingDown,
  Building2,
  CheckCircle,
  AlertCircle,
  PieChart,
  Receipt,
  Layers,
} from 'lucide-react';

interface TreasuryAccountsViewProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
}

export const TreasuryAccountsView: React.FC<TreasuryAccountsViewProps> = ({
  onOpenPinModal,
}) => {
  const {
    treasuryTransactions,
    recordTreasuryTransaction,
    expenses,
    supplierTransactions,
    invoices,
    activeShift,
    currentUser,
    permissions,
  } = useStore();

  const isReadOnly = permissions?.readOnly;

  // Search & Type Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'suppliers' | 'expenses'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'deposit' | 'withdrawal'>('deposit');
  const [formData, setFormData] = useState({
    title: '',
    amount: 1000,
    category: 'إيداع رأس مال',
    referenceNumber: '',
    notes: '',
  });

  // Calculate Aggregated Cash Ledger
  const ledgerItems = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      title: string;
      category: string;
      amount: number;
      direction: 'in' | 'out';
      typeLabel: string;
      recordedBy: string;
      notes?: string;
      referenceNumber?: string;
    }> = [];

    // 1. Explicit Treasury Transactions (schedules, deposits, owner draws)
    treasuryTransactions.forEach((t) => {
      const isIn = t.type === 'deposit' || t.type === 'capital_add';
      list.push({
        id: t.id,
        date: t.date,
        title: t.title,
        category: t.category,
        amount: t.amount,
        direction: isIn ? 'in' : 'out',
        typeLabel: isIn ? 'إيداع نقدي الخزينة (+)' : 'سحب نقدي الخزينة (-)',
        recordedBy: t.recordedBy,
        notes: t.notes,
        referenceNumber: t.referenceNumber,
      });
    });

    // 2. Expenses
    expenses.forEach((e) => {
      list.push({
        id: e.id,
        date: e.date,
        title: `مصروف: ${e.title}`,
        category: e.categoryLabel || 'مصروفات نثريات',
        amount: e.amount,
        direction: 'out',
        typeLabel: 'مصروفات نثريات (-)',
        recordedBy: e.recordedBy,
        notes: e.notes,
      });
    });

    // 3. Supplier Payments (Cash)
    supplierTransactions
      .filter((s) => s.type === 'payment_made' && s.paymentMethod === 'cash')
      .forEach((s) => {
        list.push({
          id: s.id,
          date: s.date,
          title: `سداد للمورد: ${s.supplierName}`,
          category: 'سداد موردين',
          amount: s.amount,
          direction: 'out',
          typeLabel: 'سداد موردين (-)',
          recordedBy: s.recordedBy,
          notes: s.notes,
          referenceNumber: s.referenceNumber,
        });
      });

    // 4. Sales Cash Inflows
    invoices
      .filter((inv) => inv.paymentMethod === 'cash' || inv.paymentMethod === 'split')
      .forEach((inv) => {
        const cashAmount = inv.paymentMethod === 'cash' ? inv.grandTotal : inv.cashPaid || 0;
        if (cashAmount > 0) {
          list.push({
            id: inv.id,
            date: inv.date,
            title: `تحصيل فاتورة مبيعات رقم ${inv.invoiceNumber}`,
            category: 'مبيعات كاشير',
            amount: cashAmount,
            direction: 'in',
            typeLabel: 'مبيعات نقدية (+)',
            recordedBy: inv.cashierName || 'كاشير',
            notes: `العميل: ${inv.customerName}`,
            referenceNumber: inv.invoiceNumber,
          });
        }
      });

    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [treasuryTransactions, expenses, supplierTransactions, invoices]);

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    return ledgerItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.referenceNumber && item.referenceNumber.toLowerCase().includes(q)) ||
        item.recordedBy.toLowerCase().includes(q);

      let matchType = true;
      if (typeFilter === 'deposits') matchType = item.direction === 'in';
      if (typeFilter === 'withdrawals') matchType = item.direction === 'out' && item.category !== 'سداد موردين' && !item.title.startsWith('مصروف');
      if (typeFilter === 'suppliers') matchType = item.category === 'سداد موردين';
      if (typeFilter === 'expenses') matchType = item.title.startsWith('مصروف') || item.category.includes('مصروف');

      return matchSearch && matchType;
    });
  }, [ledgerItems, searchQuery, typeFilter]);

  // Overall Financial Calculations
  const totalInflows = useMemo(() => {
    return ledgerItems.filter((i) => i.direction === 'in').reduce((sum, i) => sum + i.amount, 0);
  }, [ledgerItems]);

  const totalOutflows = useMemo(() => {
    return ledgerItems.filter((i) => i.direction === 'out').reduce((sum, i) => sum + i.amount, 0);
  }, [ledgerItems]);

  const netTreasuryCash = totalInflows - totalOutflows;

  // Handlers for Deposit / Withdrawal Modals
  const handleOpenModal = (mode: 'deposit' | 'withdrawal') => {
    setModalMode(mode);
    setFormData({
      title: mode === 'deposit' ? 'إيداع رأس مال إضافي' : 'سحب نقدي - مسحوبات شخصية',
      amount: mode === 'deposit' ? 10000 : 2000,
      category: mode === 'deposit' ? 'إيداع رأس مال' : 'مسحوبات شركاء',
      referenceNumber: `${mode === 'deposit' ? 'DEP' : 'WTH'}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: '',
    });
    setShowModal(true);
  };

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.amount <= 0) return;

    const applyAction = () => {
      recordTreasuryTransaction({
        type: modalMode === 'deposit' ? 'deposit' : 'withdrawal',
        title: formData.title,
        amount: formData.amount,
        category: formData.category,
        notes: formData.notes,
        referenceNumber: formData.referenceNumber,
      });
      setShowModal(false);
    };

    if (modalMode === 'withdrawal' && currentUser.role !== 'manager') {
      onOpenPinModal(`تأكيد سحب نقدي بقيمة ${formData.amount.toLocaleString()} ج.م`, applyAction);
    } else {
      applyAction();
    }
  };

  // Print Statement Summary
  const handlePrintTreasuryReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير حركات الخزينة والسيولة النقدية - اخين AKHEN</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; color: #0f172a; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; }
            .metrics { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .in { color: #166534; font-weight: bold; }
            .out { color: #991b1b; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">اخين AKHEN - كشف حركات الخزينة ودفتر الأستاذ النقدي</div>
            <div style="font-size: 12px; color: #64748b;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>
          <div class="metrics">
            <div><strong>إجمالي التدفقات المقبوضة (+):</strong> ${totalInflows.toLocaleString()} ج.م</div>
            <div><strong>إجمالي السحوبات والمدفوعات (-):</strong> ${totalOutflows.toLocaleString()} ج.م</div>
            <div><strong>صافي السيولة النقدية بالخزينة:</strong> ${netTreasuryCash.toLocaleString()} ج.م</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>عنوان الحركة</th>
                <th>التصنيف</th>
                <th>التدفق النقدي</th>
                <th>المبلغ (ج.م)</th>
                <th>الملاحظات / المرجع</th>
                <th>بواسطة</th>
              </tr>
            </thead>
            <tbody>
              ${ledgerItems
                .map(
                  (item) => `
                <tr>
                  <td>${new Date(item.date).toLocaleDateString('ar-EG')} ${new Date(item.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>${item.title}</td>
                  <td>${item.category}</td>
                  <td class="${item.direction === 'in' ? 'in' : 'out'}">${item.direction === 'in' ? 'إيداع (+)' : 'سحب (-)'}</td>
                  <td class="${item.direction === 'in' ? 'in' : 'out'}">${item.amount.toLocaleString()}</td>
                  <td>${item.notes || item.referenceNumber || '—'}</td>
                  <td>${item.recordedBy}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-5">
      {/* Top Treasury Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Treasury Cash */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md border border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-300 font-medium block">صافي الخزينة الحالية</span>
            <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block tabular-nums">
              {netTreasuryCash.toLocaleString()} ج.م
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center font-bold">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Total Inflows */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800 font-medium block">إجمالي المقبوضات والنقدية (+)</span >
            <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block tabular-nums">
              {totalInflows.toLocaleString()} ج.م
            </span>
          </div>
          <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Outflows */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/30 to-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-800 font-medium block">إجمالي السحوبات والمدفوعات (-)</span>
            <span className="text-2xl font-bold font-mono text-rose-700 mt-1 block tabular-nums">
              {totalOutflows.toLocaleString()} ج.م
            </span>
          </div>
          <div className="w-11 h-11 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center font-bold">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Active Shift fund */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">عهدية الدرج بالوردية</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block tabular-nums">
              {activeShift ? activeShift.expectedCash.toLocaleString() : 0} ج.م
            </span>
          </div>
          <div className="w-11 h-11 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Header & Quick Action Buttons */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span>إدارة الحسابات ودفتر قيود الخزينة (Ledger)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تسجيل الإيداعات والنقدية، السحوبات المالية، ومتابعة جميع المقبوضات والمدفوعات
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              {/* Deposit Button */}
              <button
                onClick={() => handleOpenModal('deposit')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إيداع نقدي جديد</span>
              </button>

              {/* Withdrawal Button */}
              <button
                onClick={() => handleOpenModal('withdrawal')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Minus className="w-4 h-4" />
                <span>سحب نقدي جديد</span>
              </button>
            </>
          )}

          <button
            onClick={handlePrintTreasuryReport}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="طباعة دفتر الخزينة"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن عنوان الحركة، رقم المرجع، الملاحظات..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({ledgerItems.length})
          </button>
          <button
            onClick={() => setTypeFilter('deposits')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'deposits'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            إيداعات ومبيعات (+)
          </button>
          <button
            onClick={() => setTypeFilter('withdrawals')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'withdrawals'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سحوبات ومسحوبات (-)
          </button>
          <button
            onClick={() => setTypeFilter('suppliers')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'suppliers'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سداد موردين
          </button>
          <button
            onClick={() => setTypeFilter('expenses')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'expenses'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مصروفات ونثريات
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3.5">تاريخ الحركة</th>
                <th className="p-3.5">عنوان الحركة / التفاصيل</th>
                <th className="p-3.5">التصنيف</th>
                <th className="p-3.5">نوع الحركة</th>
                <th className="p-3.5">المبلغ (ج.م)</th>
                <th className="p-3.5">الملاحظات / المرجع</th>
                <th className="p-3.5">المسجل بواسطة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا توجد حركات مالية مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(item.date).toLocaleDateString('ar-EG')}{' '}
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{item.title}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[11px] font-semibold border border-slate-200">
                        {item.category}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {item.direction === 'in' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                          <span>مقابوضات / إيداع (+)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                          <span>مدفوعات / سحب (-)</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`font-mono font-bold text-sm tabular-nums ${
                          item.direction === 'in' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {item.direction === 'in' ? '+' : '-'}{item.amount.toLocaleString()} ج.م
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600">
                      <div>{item.notes || '—'}</div>
                      {item.referenceNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          مرجع: {item.referenceNumber}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-600 font-semibold">{item.recordedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit / Withdrawal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {modalMode === 'deposit' ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-rose-600" />
                )}
                <span>
                  {modalMode === 'deposit' ? 'تسجيل إيداع نقدي جديد في الخزينة' : 'تسجيل سحب نقدي من الخزينة'}
                </span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">عنوان العملية *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={modalMode === 'deposit' ? 'إيداع سيولة من البنك' : 'سحب مسحوبات شخصية شركاء'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">المبلغ (ج.م) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">تصنيف الحركة</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    {modalMode === 'deposit' ? (
                      <>
                        <option value="إيداع رأس مال">إيداع رأس مال</option>
                        <option value="تعزيز سيولة">تعزيز سيولة نقدية</option>
                        <option value="إيرادات أخرى">إيرادات أخرى</option>
                        <option value="تحويل بنكي">تحويل من البنك</option>
                      </>
                    ) : (
                      <>
                        <option value="مسحوبات شركاء">مسحوبات شركاء / إدارة</option>
                        <option value="سداد مصاريف طارئة">سداد مصاريف طارئة</option>
                        <option value="تحويل بنكي خارجي">إيداع بالبنك خارجي</option>
                        <option value="سحوبات استثنائية">سحوبات استثنائية</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">رقم المرجع / الإيصال</label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ملاحظات توضيحية</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="سبب السحب/الإيداع وتفاصيل العملية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-xs ${
                    modalMode === 'deposit'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {modalMode === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
