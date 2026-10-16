import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Invoice, ReturnRecord } from '../../types';
import {
  RotateCcw,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Package,
  ArrowRight,
  Plus,
  Minus,
  Banknote,
  CreditCard,
  Receipt,
  User,
  Calendar,
  ShieldAlert,
} from 'lucide-react';

interface PosReturnModalProps {
  onClose: () => void;
  onOpenPinModal?: (actionTitle: string, onSuccess: () => void) => void;
}

export const PosReturnModal: React.FC<PosReturnModalProps> = ({
  onClose,
  onOpenPinModal,
}) => {
  const { invoices, processReturn, currentUser } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Return items selection: map of productId -> quantityToReturn
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState<string>('المقاس غير مناسب');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card'>('cash');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedReturn, setCompletedReturn] = useState<ReturnRecord | null>(null);

  // Filter invoices for search
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices.slice(0, 8); // show recent 8
    const q = searchQuery.toLowerCase().trim();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerPhone.includes(q)
    );
  }, [invoices, searchQuery]);

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setErrorMessage(null);
    // Initialize quantities to 0
    const initialQty: Record<string, number> = {};
    inv.items.forEach((item) => {
      initialQty[item.product.id] = 0;
    });
    setReturnQuantities(initialQty);
  };

  const handleUpdateQty = (productId: string, maxQty: number, delta: number) => {
    setReturnQuantities((prev) => {
      const current = prev[productId] || 0;
      const updated = Math.min(maxQty, Math.max(0, current + delta));
      return { ...prev, [productId]: updated };
    });
  };

  // Calculate return grand total preview
  const returnCalculation = useMemo(() => {
    if (!selectedInvoice) return { totalQty: 0, totalRefund: 0 };

    let totalQty = 0;
    let totalRefund = 0;

    selectedInvoice.items.forEach((item) => {
      const qtyToReturn = returnQuantities[item.product.id] || 0;
      if (qtyToReturn > 0) {
        totalQty += qtyToReturn;
        const itemSubtotal = item.unitPrice * qtyToReturn;
        const invoiceSubtotal = selectedInvoice.subtotal || 1;
        const discountRatio = selectedInvoice.discountTotal
          ? selectedInvoice.discountTotal / invoiceSubtotal
          : 0;
        const itemAfterDiscount = itemSubtotal * (1 - discountRatio);
        const taxRate = selectedInvoice.taxRate || 0.14;
        const itemGrandTotal = Math.round(itemAfterDiscount * (1 + taxRate) * 100) / 100;
        totalRefund += itemGrandTotal;
      }
    });

    return {
      totalQty,
      totalRefund: Math.round(totalRefund * 100) / 100,
    };
  }, [selectedInvoice, returnQuantities]);

  const handleExecuteReturn = () => {
    if (!selectedInvoice) return;

    if (returnCalculation.totalQty <= 0) {
      setErrorMessage('يرجى تحديد كمية قطعة واحدة على الأقل لإرجاعها.');
      return;
    }

    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    const runProcess = () => {
      const result = processReturn({
        invoiceId: selectedInvoice.id,
        itemsToReturn,
        reason: returnReason,
        refundMethod,
      });

      if (result.success && result.returnRecord) {
        setCompletedReturn(result.returnRecord);
      } else {
        setErrorMessage(result.error || 'فشلت عملية المرتجع.');
      }
    };

    if (currentUser.role !== 'manager' && onOpenPinModal) {
      onOpenPinModal(
        `إجراء مرتجع فاتورة #${selectedInvoice.invoiceNumber} بقيمة ${returnCalculation.totalRefund.toLocaleString()} ج.م (تأكيد المدير)`,
        runProcess
      );
    } else {
      runProcess();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                تسجيل مرتجع واسترداد منتجات (POS Refund System)
              </h3>
              <p className="text-xs text-slate-500">
                استرجاع تلقائي لأصناف الملابس، إعادة التعديل الفوري للمخزون وخزينة الوردية.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* State 1: Completed Return Success Screen */}
        {completedReturn ? (
          <div className="space-y-4 py-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">تم تنفيذ المرتجع بنجاح!</h4>
              <p className="text-xs text-emerald-800 font-mono font-bold">
                رقم المرتجع: #{completedReturn.returnNumber} | الفاتورة الأصلية: #{completedReturn.originalInvoiceNumber}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2 font-bold text-slate-900">
                <span>إجمالي المبلغ المسترد للعميل:</span>
                <span className="text-rose-700 font-mono text-sm">
                  {completedReturn.totalRefundAmount.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>طريقة الاسترداد:</span>
                <span className="font-semibold text-slate-900">
                  {completedReturn.paymentMethod === 'cash' ? 'نقداً من خزينة الوردية (كاش)' : 'استرداد فيزا/بطاقة'}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>سبب الإرجاع:</span>
                <span className="text-amber-800 font-semibold">{completedReturn.reason}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>مسؤول العملية:</span>
                <span className="text-slate-800 font-semibold">{completedReturn.processedBy}</span>
              </div>

              <div className="pt-2">
                <span className="text-slate-600 font-medium block mb-1">الأصناف المسترجعة للرصيد بالمخزن:</span>
                <ul className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                  {completedReturn.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between text-slate-800 font-semibold">
                      <span>• {item.productName} (عدد {item.quantity})</span>
                      <span className="text-emerald-700 font-bold">+{item.totalAmount.toLocaleString()} ج.م</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              إغلاق ومتابعة المبيعات
            </button>
          </div>
        ) : !selectedInvoice ? (
          /* State 2: Invoice Selection & Search */
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم الفاتورة (INV-...), اسم العميل، أو رقم الهاتف..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-600 font-bold block">
                اختر الفاتورة المطلوبة لإجراء المرتجع ({filteredInvoices.length}):
              </label>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {filteredInvoices.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">
                    لم يتم العثور على فواتير مطابقة للبحث.
                  </div>
                ) : (
                  filteredInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => handleSelectInvoice(inv)}
                      className="bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all hover:bg-white shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs font-mono text-amber-700">
                            #{inv.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(inv.date).toLocaleDateString('ar-EG')}
                          </span>
                          {inv.status === 'returned' && (
                            <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded font-bold">
                              مرتجع بالكامل
                            </span>
                          )}
                          {inv.status === 'partially_returned' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-bold">
                              مرتجع جزئياً
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-3 font-medium">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{inv.customerName || 'عميل نقدي'}</span>
                          </span>
                          <span>•</span>
                          <span>البائع: {inv.salesmanName}</span>
                        </div>
                      </div>

                      <div className="text-left font-mono">
                        <div className="text-xs font-bold text-slate-900">
                          {inv.grandTotal.toLocaleString()} ج.م
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {inv.items.length} أصناف
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* State 3: Selected Invoice Item Return Quantities Picker */
          <div className="space-y-4">
            {/* Invoice Info Bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-medium">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-bold"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>تغيير الفاتورة</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono font-bold text-slate-900">#{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="text-slate-600">
                  العميل: <span className="text-slate-900 font-bold">{selectedInvoice.customerName}</span> | البائع: {selectedInvoice.salesmanName}
                </div>
              </div>

              <div className="text-left font-mono">
                <div className="text-slate-500 text-[10px]">إجمالي الفاتورة الأصلية</div>
                <div className="font-bold text-amber-700 text-sm">{selectedInvoice.grandTotal.toLocaleString()} ج.م</div>
              </div>
            </div>

            {/* Items Picker List */}
            <div className="space-y-2">
              <label className="text-xs text-slate-700 font-bold block">
                حدد كمية القطع المراد إرجاعها لكل صنف:
              </label>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {selectedInvoice.items.map((item) => {
                  const qtyToReturn = returnQuantities[item.product.id] || 0;

                  return (
                    <div
                      key={item.product.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        qtyToReturn > 0
                          ? 'bg-rose-50 border-rose-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                          <span>المقاس: {item.product.size}</span>
                          <span>•</span>
                          <span className="font-mono">{item.unitPrice.toLocaleString()} ج.م / قطعة</span>
                          <span>•</span>
                          <span className="text-slate-700 font-semibold">المباع: {item.quantity} قطعة</span>
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2 bg-white border border-slate-300 px-2 py-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, item.quantity, -1)}
                          className="text-slate-600 hover:text-slate-900 p-1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-xs text-slate-900 w-6 text-center">
                          {qtyToReturn}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, item.quantity, 1)}
                          className="text-slate-600 hover:text-slate-900 p-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Return Settings (Reason & Refund Method) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">سبب الإرجاع والاسترداد:</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="المقاس غير مناسب">المقاس غير مناسب</option>
                  <option value="عيب تصنيع / تلف بالقطعة">عيب تصنيع / تلف بالقطعة</option>
                  <option value="تغيير رأي العميل">تغيير رأي العميل</option>
                  <option value="صنف مختلف / استبدال">صنف مختلف / استبدال</option>
                  <option value="سبب آخر">سبب آخر</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">طريقة خصم واسترداد المبلغ:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('cash')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all flex items-center justify-center gap-1 text-xs ${
                      refundMethod === 'cash'
                        ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>كاش (الخزينة)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod('card')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all flex items-center justify-center gap-1 text-xs ${
                      refundMethod === 'card'
                        ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>استرداد فيزا</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Refund Totals & Execute Button */}
            <div className="bg-slate-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-600 font-medium">إجمالي المبلغ المسترد للعميل:</div>
                <div className="text-xl font-bold font-mono text-rose-700 tabular-nums">
                  {returnCalculation.totalRefund.toLocaleString()} ج.م
                </div>
                <div className="text-[10px] text-slate-500">
                  سيتم التعديل الفوري لعهد الخزينة والرصيد بالمخزن
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  disabled={returnCalculation.totalQty <= 0}
                  onClick={handleExecuteReturn}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                    returnCalculation.totalQty <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white active:scale-[0.99]'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>تأكيد المرتجع والخصم</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
