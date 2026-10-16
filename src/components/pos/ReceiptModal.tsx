import React, { useState } from 'react';
import { Invoice } from '../../types';
import { useStore } from '../../context/StoreContext';
import {
  X,
  Share2,
  Copy,
  Printer,
  Check,
  Trophy,
  QrCode,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ReceiptModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoice,
  onClose,
}) => {
  const { recentAchievement, clearRecentAchievement } = useStore();
  const [copied, setCopied] = useState(false);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(invoice.whatsappReceiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const phone = invoice.customerPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '20' + phone.substring(1) : phone;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      invoice.whatsappReceiptText
    )}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCloseAll = () => {
    clearRecentAchievement();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-bold text-slate-900">
              تم تسجيل عملية البيع بنجاح (فاتورة #{invoice.invoiceNumber})
            </h3>
          </div>
          <button
            onClick={handleCloseAll}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Real-time Salesman KPI Achievement Banner */}
          {recentAchievement && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2 shadow-sm text-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-900 block text-sm">
                      تحديث فوري لإنجاز تارجت البائع: {recentAchievement.employeeName}
                    </span>
                    <span className="text-slate-600 text-[11px]">
                      مبيعات العملية الحالية: +{recentAchievement.saleAmount.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-xs text-slate-500 block">نسبة الإنجاز</span>
                  <span className="text-base font-bold text-emerald-700 tabular-nums">
                    {recentAchievement.achievementPercent}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-200 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-amber-100">
                  <span className="text-slate-500 block">المبيعات الجديدة:</span>
                  <strong className="text-slate-900 font-mono">
                    {recentAchievement.newSales.toLocaleString()} ج.م
                  </strong>
                </div>

                <div className="bg-white p-2 rounded-lg border border-amber-100">
                  <span className="text-slate-500 block">المتبقي للتارجت:</span>
                  <strong className="text-sky-700 font-mono">
                    {recentAchievement.remainingToTarget.toLocaleString()} ج.م
                  </strong>
                </div>

                <div className="bg-white p-2 rounded-lg border border-amber-100">
                  <span className="text-slate-500 block">الهدف الشهري:</span>
                  <strong className="text-slate-700 font-mono">
                    {recentAchievement.target.toLocaleString()} ج.م
                  </strong>
                </div>

                <div className="bg-white p-2 rounded-lg border border-amber-100">
                  <span className="text-slate-500 block">إجمالي الحوافز:</span>
                  <strong className="text-emerald-700 font-mono font-bold">
                    {recentAchievement.commissionInfo.totalCommission.toLocaleString()} ج.م
                  </strong>
                </div>
              </div>

              {/* Target Bonus From Salary Status */}
              <div className="mt-2 text-[11px] p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900">
                <span>
                  {recentAchievement.achievementPercent >= 100
                    ? `🎉 تهانينا! تم إنجاز التارجت وحصد حافز ${recentAchievement.commissionInfo.targetBonusPercent}% من المرتب:`
                    : `🎯 حافز تحقيق التارجت المحدد (${recentAchievement.commissionInfo.targetBonusPercent}% من المرتب):`}
                </span>
                <span className="font-mono font-bold">
                  {recentAchievement.achievementPercent >= 100
                    ? `+${recentAchievement.commissionInfo.targetSalaryBonus.toLocaleString()} ج.م إضافية على المرتب`
                    : `${Math.round(((recentAchievement.commissionInfo.salary || 6000) * recentAchievement.commissionInfo.targetBonusPercent) / 100).toLocaleString()} ج.م (عند بلوغ 100%)`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3 border border-slate-300">
                <div
                  className={`h-full transition-all duration-500 ${
                    recentAchievement.achievementPercent >= 100
                      ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                      : recentAchievement.achievementPercent >= 80
                      ? 'bg-amber-500'
                      : 'bg-sky-500'
                  }`}
                  style={{ width: `${Math.min(100, recentAchievement.achievementPercent)}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة واتساب للعميل</span>
            </button>
            <button
              onClick={handleCopyWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all border border-slate-300"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم نسخ النص!' : 'نسخ نص الفاتورة'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة إيصال حراري (80mm)</span>
            </button>
          </div>

          {/* Visual Thermal Receipt Preview (80mm format) */}
          <div className="bg-white text-slate-900 rounded-xl p-5 shadow-lg max-w-sm mx-auto font-mono text-xs border border-slate-200">
            <div id="thermal-receipt" className="space-y-3 text-right">
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h4 className="font-bold text-sm tracking-tight text-slate-900 font-sans">
                  اخين AKHEN للأزياء والملابس
                </h4>
                <p className="text-[11px] text-slate-600 font-sans">الفيوم - طامية - بجوار مطعم ابن مصر</p>
              </div>

              {/* Meta */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الفاتورة:</span>
                  <span className="font-bold">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">التاريخ:</span>
                  <span>{new Date(invoice.date).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الوقت:</span>
                  <span>
                    {new Date(invoice.date).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">البائع / الكاشير:</span>
                  <span>{invoice.salesmanName || invoice.cashierName}</span>
                </div>
                {invoice.customerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">العميل:</span>
                    <span>{invoice.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border-b border-dashed border-slate-300 pb-2">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="text-right py-1">الصنف</th>
                      <th className="text-center py-1">الكمية</th>
                      <th className="text-left py-1">السعر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1">
                          <div className="font-sans font-medium text-slate-900">{it.product.name}</div>
                          <div className="text-[10px] text-slate-500">
                            مقاس: {it.product.size} {it.priceEdited ? '(سعر معدل)' : ''}
                          </div>
                        </td>
                        <td className="py-1 text-center font-bold">{it.quantity}</td>
                        <td className="py-1 text-left tabular-nums">
                          {(it.unitPrice * it.quantity).toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">المجموع الفرعي:</span>
                  <span className="tabular-nums">{invoice.subtotal.toLocaleString()} ج.م</span>
                </div>
                {invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>الخصم الممنوح:</span>
                    <span className="tabular-nums">-{invoice.discountTotal.toLocaleString()} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-1">
                  <span>الإجمالي النهائي:</span>
                  <span className="tabular-nums">{invoice.grandTotal.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <div className="flex justify-between">
                  <span>طريقة الدفع:</span>
                  <span className="font-semibold text-slate-800">
                    {invoice.paymentMethod === 'cash'
                      ? 'نقداً (كاش)'
                      : invoice.paymentMethod === 'card'
                      ? 'فيزا / بطاقة بنكية'
                      : invoice.paymentMethod === 'split'
                      ? `مجزأ (كاش: ${invoice.cashPaid} | فيزا: ${invoice.cardPaid})`
                      : 'أقساط'}
                  </span>
                </div>
              </div>

              {/* QR Mock & Return Policy */}
              <div className="text-center pt-2 space-y-1">
                <div className="w-16 h-16 mx-auto bg-slate-100 border border-slate-300 flex items-center justify-center rounded">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
                <p className="text-[9px] text-slate-500 font-sans">
                  الاستبدال خلال 14 يوماً والإرجاع خلال 7 أيام مع وجود أصل الفاتورة والتيكت
                </p>
                <p className="text-[10px] font-bold text-slate-800 font-sans">شكراً لتسوقكم معنا في مصر!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleCloseAll}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            إغلاق وبدء فاتورة جديدة
          </button>
        </div>
      </div>
    </div>
  );
};
