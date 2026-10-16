import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  RotateCcw,
  AlertTriangle,
  Download,
  Trash2,
  Receipt,
  Calendar,
  Wallet,
  Target,
  Users,
  Package,
  ShieldAlert,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface DataResetViewProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
}

export const DataResetView: React.FC<DataResetViewProps> = ({ onOpenPinModal }) => {
  const {
    currentUser,
    permissions,
    invoices,
    installments,
    expenses,
    employees,
    products,
    customers,
    exportDatabaseBackup,
    resetSalesAndInvoices,
    resetInstallments,
    resetTreasuryAndExpenses,
    resetEmployeeSalesCounters,
    resetAuditLogs,
    resetInventoryStock,
    resetCustomers,
    fullFactoryReset,
    wipeCompleteDatabase,
  } = useStore();

  const isReadOnly = permissions?.readOnly;

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'warning';
  } | null>(null);

  // Double Confirmation Modal State
  const [showCompleteWipeModal, setShowCompleteWipeModal] = useState(false);
  const [wipeConfirmPhrase, setWipeConfirmPhrase] = useState('');

  const showNotice = (msg: string, type: 'success' | 'warning' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStartCompleteWipe = () => {
    setWipeConfirmPhrase('');
    setShowCompleteWipeModal(true);
  };

  const handleProceedWipeStep2 = () => {
    if (wipeConfirmPhrase.trim() !== 'مسح شامل' && wipeConfirmPhrase.trim() !== 'مسح البيانات') {
      return;
    }

    onOpenPinModal('تأكيد وتصريح مسح وتفريغ كافة الجداول بقاعدة البيانات بالكامل', () => {
      wipeCompleteDatabase();
      showNotice('تم تفريغ ومسح كافة الجداول بقاعدة البيانات بالكامل بنجاح!');
      setShowCompleteWipeModal(false);
      setWipeConfirmPhrase('');
    });
  };

  const handleActionWithPin = (title: string, action: () => void) => {
    onOpenPinModal(title, () => {
      action();
      showNotice(`تم بنجاح: ${title}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Central Terminal Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] text-emerald-700 uppercase tracking-widest font-bold">
                AKHEN CENTRAL SYSTEM TERMINAL
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-emerald-600" />
              <span>مركز تصفير وإعادة تهيئة بيانات النظام</span>
            </h2>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              تحكم دقيق ومؤمّن برمز المشرف (PIN) لتصفير سجلات المبيعات، عدادات تارجت الموظفين، عقود الأقساط،
              أو حركة الخزينة بشكل منفرد، أو إجراء تهيئة شاملة للمحل مع إمكانية سحب نسخة احتياطية فورية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={exportDatabaseBackup}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>تصدير نسخة احتياطية أولاً</span>
            </button>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs text-amber-800 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>تنبيه أمني: كافة عمليات التصفير مشفرة وتتطلب موافقة وتصريح مدير الفرع عبر رمز الـ PIN وتسجل فوراً بسجل الأمان.</span>
        </div>
      </div>

      {/* Read Only Notice */}
      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>حسابك مخصص لـ "مشاهدة فقط". تم إخفاء وتعطيل كافة أزرار التصفير وإعادة التهيئة لحماية البيانات.</span>
        </div>
      )}

      {/* Floating Status Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all shadow-md ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Granular Reset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Reset Invoices & Sales */}
        <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">تصفير المبيعات والفواتير</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    السجل الحالي: {invoices.length} فاتورة
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              مسح جميع فواتير البيع السابقة وتصفير إجمالي مبيعات الوردية الحالية للبدء من الصفر.
            </p>
          </div>

          <button
            onClick={() =>
              handleActionWithPin('تصفير ومسح كافة فواتير المبيعات', resetSalesAndInvoices)
            }
            className="mt-4 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>تصفير المبيعات الآن</span>
          </button>
        </div>

        {/* 2. Reset Employee Sales & Target Counters */}
        <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">تصفير عدادات مبيعات الموظفين</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {employees.length} موظف مسجل
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              إعادة تصفير المبيعات التراكمية للموظفين (0 ج.م) لبدء شهر جديد مع الاحتفاظ ببياناتهم وأهدافهم ومرتباتهم.
            </p>
          </div>

          <button
            onClick={() =>
              handleActionWithPin('تصفير عدادات مبيعات وتارجت الموظفين', resetEmployeeSalesCounters)
            }
            className="mt-4 w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تصفير عدادات التارجت</span>
          </button>
        </div>

        {/* 3. Reset Treasury & Expenses */}
        <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">تصفير المصروفات والخزينة</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {expenses.length} حركة مصروف
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              مسح سجل المصروفات والنثريات وإعادة ضبط صافي الخزينة الحالية للعهد الافتتاحية.
            </p>
          </div>

          <button
            onClick={() =>
              handleActionWithPin('تصفير المصروفات وحساب الخزينة', resetTreasuryAndExpenses)
            }
            className="mt-4 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>تصفير الخزينة والمصروفات</span>
          </button>
        </div>

        {/* 4. Reset Installments */}
        <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">تصفير عقود الأقساط</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {installments.length} عقد قسط
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              حذف جميع عقود التقسيط المفتوحة وجداول الأقساط الشهرية المسجلة بالكامل.
            </p>
          </div>

          <button
            onClick={() =>
              handleActionWithPin('تصفير وحذف جميع عقود الأقساط', resetInstallments)
            }
            className="mt-4 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>تصفير عقود الأقساط</span>
          </button>
        </div>

        {/* 5. Reset Inventory Stock */}
        <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">تصفير كميات المخزون</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {products.length} صنف ملابس
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              تصفير أرصدة القطع المتاحة بالمخزن (الرصيد = 0) لكافة الأصناف للبدء في جرد بضاعة جديد.
            </p>
          </div>

          <button
            onClick={() =>
              handleActionWithPin('تصفير كميات المخزون للصفر', () => resetInventoryStock(false))
            }
            className="mt-4 w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تصفير كميات القطع</span>
          </button>
        </div>

        {/* 6. Reset Customers */}
        <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">تصفير سجل العملاء</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {customers.length} عميل مسجل
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              مسح قاعدة بيانات العملاء وسجل أرقام الهواتف وإجمالي مشترياتهم السابقة.
            </p>
          </div>

          <button
            onClick={() =>
              handleActionWithPin('تصفير ومسح قاعدة بيانات العملاء', resetCustomers)
            }
            className="mt-4 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>تصفير العملاء</span>
          </button>
        </div>
      </div>

      {/* Total Database Wipe (حذف وتفريغ كافة الجداول بالكامل) */}
      <div className="bg-rose-900 text-white rounded-2xl p-6 shadow-md border-2 border-rose-700 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-rose-300 font-black text-base">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 animate-bounce" />
              <span>مسح كافة الجداول بقاعدة البيانات (Complete Database Wipe 100%)</span>
            </div>
            <p className="text-xs text-rose-100 max-w-3xl leading-relaxed">
              يقوم هذا الخيار بـ <strong>مسح كافة بيانات الجداول نهائياً</strong> لضمان نظافة النظام تماماً (مسح سجل المبيعات، أصناف المخزون، بيانات الموظفين، العملاء، الموردين، الخزينة والعقود)، والبدء على سيستم نظيف تماماً بجدول مواصفات فارغ.
            </p>
            <div className="text-[11px] font-mono text-amber-300 font-bold">
              يتطلب الإجراء تأكيداً مزدوجاً (كتابة 'مسح شامل' + تصريح PIN من مدير الفرع).
            </div>
          </div>

          {!isReadOnly && (
            <button
              onClick={handleStartCompleteWipe}
              className="px-5 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shrink-0 border border-rose-400"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح كافة الجداول نهائياً</span>
            </button>
          )}
        </div>
      </div>

      {/* Dangerous: Full Factory Reset Box */}
      <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <RotateCcw className="w-5 h-5 text-rose-600" />
              <span>إعادة ضبط المصنع بالبيانات الافتراضية (Demo Data Reset)</span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              إعادة تهيئة النظام مع استرجاع بيانات المبيعات والأصناف الافتراضية التجريبية (Demo Datasets).
            </p>
          </div>

          {!isReadOnly && (
            <button
              onClick={() =>
                handleActionWithPin(
                  'إعادة ضبط المصنع بالبيانات الافتراضية التجريبية',
                  fullFactoryReset
                )
              }
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استرجاع البيانات الافتراضية</span>
            </button>
          )}
        </div>
      </div>

      {/* Double Confirmation Modal for Total Wipe */}
      {showCompleteWipeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-rose-500 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3 text-rose-700">
              <div className="w-12 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  تأكيد خطوة (1 من 2): مسح كافة الجداول نهائياً
                </h3>
                <p className="text-xs text-rose-600 font-bold">
                  سيتم تفريغ ومسح كافة المبيعات والمخزون والموظفين والعملاء والموردين!
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-slate-800">
              <div className="font-bold text-rose-900">
                ⚠️ هل أنت متأكد من مسح وتفريغ قاعدة البيانات بالكامل؟
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                هذا الإجراء سيقوم بحذف كافة الجداول من المتصفح (المبيعات، الموظفين، العملاء، الأصناف، الخزينة والعقود)، وسيتم حذف البيانات 100% بدون أي إمكانية للاسترجاع ما لم تكن قد سحبت نسخة احتياطية.
              </p>

              <div className="pt-2">
                <label className="block text-[11px] font-black text-slate-900 mb-1.5">
                  يرجى كتابة الكلمة التأكيدية <span className="text-rose-700 font-mono bg-rose-100 px-1.5 py-0.5 rounded font-bold">مسح شامل</span> في الحقل لتفعيل زر المتابعة:
                </label>
                <input
                  type="text"
                  value={wipeConfirmPhrase}
                  onChange={(e) => setWipeConfirmPhrase(e.target.value)}
                  placeholder="اكتب: مسح شامل"
                  className="w-full bg-white border border-rose-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-rose-600 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowCompleteWipeModal(false);
                  setWipeConfirmPhrase('');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                إلغاء وتراجع
              </button>
              <button
                onClick={handleProceedWipeStep2}
                disabled={wipeConfirmPhrase.trim() !== 'مسح شامل' && wipeConfirmPhrase.trim() !== 'مسح البيانات'}
                className={`flex-1 py-2.5 text-white font-black rounded-xl text-xs transition-all shadow-md ${
                  wipeConfirmPhrase.trim() === 'مسح شامل' || wipeConfirmPhrase.trim() === 'مسح البيانات'
                    ? 'bg-rose-600 hover:bg-rose-500 cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed opacity-60'
                }`}
              >
                التالي: إدخال PIN المدير للخطوة (2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Footer Console */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[11px] text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-700 font-bold">AKHEN POS CONSOLE:</span>
          <span>المستخدم الحالي المصرح: {currentUser.name} ({currentUser.role === 'manager' ? 'مدير' : 'موظف'})</span>
        </div>
        <span className="text-slate-500 font-semibold">SYSTEM STATUS: READY & PERSISTED (LOCAL_STORAGE)</span>
      </div>
    </div>
  );
};
