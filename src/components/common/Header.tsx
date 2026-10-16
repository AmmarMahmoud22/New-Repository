import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Store,
  Clock,
  Wallet,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Shield,
  ShieldCheck,
  UserCheck,
  LayoutDashboard,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
  onOpenDailyDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenPinModal,
  onOpenDailyDashboard,
}) => {
  const {
    currentUser,
    setCurrentUser,
    employees,
    activeShift,
    hasPermission,
    logAudit,
    exportDatabaseBackup,
    importDatabaseBackup,
    resetToDemoData,
  } = useStore();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const tabsNavRef = React.useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsNavRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      tabsNavRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Tabs configured with comprehensive navigation including Employees and Customers
  const navItems = [
    { id: 'pos', label: 'الكاشير والبيع', icon: '🛍️', requiresPermission: 'canSell' as const },
    { id: 'inventory', label: 'المخزون', icon: '📦', requiresPermission: 'canAccessInventory' as const },
    { id: 'promotions', label: 'العروض والخصومات', icon: '🎁', requiresPermission: 'canAccessInventory' as const },
    { id: 'suppliers', label: 'الموردين', icon: '🚚', requiresPermission: 'canManageSuppliers' as const },
    { id: 'treasury', label: 'الحسابات والخزينة', icon: '💰', requiresPermission: 'canManageTreasury' as const },
    { id: 'reports', label: 'التقارير والاستيراد/التصدير', icon: '📊', requiresPermission: 'canViewReports' as const },
    { id: 'customers', label: 'العملاء', icon: '👥', requiresPermission: 'canManageCustomers' as const },
    { id: 'employees', label: 'الموظفين', icon: '👔', requiresPermission: 'canManageEmployees' as const },
    { id: 'installments', label: 'الأقساط والدفعات', icon: '📅', requiresPermission: 'canManageInstallments' as const },
    { id: 'kpi', label: 'التارجت والعمولات', icon: '🎯', requiresPermission: 'canViewKpi' as const },
    { id: 'shift', label: 'الشيفت واستلام العهدة', icon: '🏦', requiresPermission: 'canManageShift' as const },
    { id: 'audit', label: 'سجل الأمان والرقابة', icon: '🛡️', requiresPermission: 'canViewAudit' as const },
    { id: 'reset', label: 'تصفير البيانات', icon: '🔄', requiresPermission: 'canResetData' as const },
  ];

  const handleRoleSwitch = (emp: typeof currentUser) => {
    // If switching to manager, ask for PIN
    if (emp.role === 'manager' && currentUser.role !== 'manager') {
      onOpenPinModal('التبديل إلى حساب مدير الفرع', () => {
        logAudit(
          'role_permission_switch',
          'تبديل دور المستخدم إلى مدير فرع',
          `قام ${currentUser.name} بالتبديل إلى حساب ${emp.name} بصلاحيات المدير.`,
          'sensitive',
          'مدير الفرع'
        );
        setCurrentUser(emp);
        setShowUserDropdown(false);
      });
    } else {
      logAudit(
        'role_permission_switch',
        `تبديل المستخدم إلى ${emp.name}`,
        `تم تغيير المستخدم الحالي من ${currentUser.name} (${currentUser.role}) إلى ${emp.name} (${emp.role}).`,
        'normal'
      );
      setCurrentUser(emp);
      setShowUserDropdown(false);
    }
  };

  const handleImportSubmit = () => {
    if (!jsonInput.trim()) return;
    const ok = importDatabaseBackup(jsonInput);
    if (ok) {
      setImportStatus('تم استعادة قاعدة البيانات بنجاح!');
      setTimeout(() => {
        setShowBackupModal(false);
        setImportStatus(null);
        setJsonInput('');
      }, 1200);
    } else {
      setImportStatus('خطأ: صيغة الملف غير صحيحة، يرجى التأكد من محتوى JSON.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'manager':
        return (
          <span className="text-[11px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            <span>مدير الفرع (صلاحية كاملة)</span>
          </span>
        );
      case 'cashier':
        return (
          <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            <span>كاشير رئيسي</span>
          </span>
        );
      default:
        return (
          <span className="text-[11px] bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <span>مستشار مبيعات (بائع)</span>
          </span>
        );
    }
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar Row */}
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Clean Brand Wordmark without unwanted extra badges or texts */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  اخين AKHEN
                </h1>
              </div>
            </div>

            {/* Shift & Drawer Status Widget */}
            <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-slate-500">الوردية:</span>
                {activeShift ? (
                  <span className="text-emerald-700 font-semibold font-mono">
                    #{activeShift.shiftNumber} (مفتوحة)
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold font-mono">مغلقة</span>
                )}
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-500">نقدية الدرج:</span>
                <span className="text-slate-900 font-mono font-bold tabular-nums">
                  {activeShift ? activeShift.expectedCash.toLocaleString() : 0} ج.م
                </span>
              </div>
            </div>

            {/* Actions: User Selector & Tools */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Daily Dashboard Button */}
              {onOpenDailyDashboard && (
                <button
                  onClick={onOpenDailyDashboard}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  title="عرض لوحة الملخص اليومي (Dashboard)"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">الملخص اليومي</span>
                </button>
              )}

              {/* Database Quick Actions */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                {hasPermission('canExportBackup') && (
                  <button
                    onClick={exportDatabaseBackup}
                    title="تصدير نسخة احتياطية من قاعدة البيانات"
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                {hasPermission('canExportBackup') && (
                  <button
                    onClick={() => setShowBackupModal(true)}
                    title="استيراد نسخة احتياطية"
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                )}
                {hasPermission('canResetData') && (
                  <button
                    onClick={() => {
                      if (confirm('هل ترغب حقاً بإعادة ضبط النظام للبيانات التجريبية الافتراضية؟')) {
                        resetToDemoData();
                      }
                    }}
                    title="إعادة ضبط البيانات التجريبية"
                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* User Switcher Dropdown (No PIN text displayed) */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 transition-all text-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                    {currentUser.avatar.slice(0, 1)}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 leading-tight">
                      {currentUser.name}
                    </div>
                    <div>{getRoleBadge(currentUser.role)}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showUserDropdown && (
                  <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50">
                    <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1.5 text-xs text-slate-500 flex items-center justify-between font-semibold">
                      <span>طاقم العمل والمستخدمين</span>
                    </div>
                    <div className="space-y-1">
                      {employees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => handleRoleSwitch(emp)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-colors ${
                            currentUser.id === emp.id
                              ? 'bg-amber-50 border border-amber-300 text-amber-900'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                              {emp.avatar.slice(0, 1)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{emp.name}</span>
                                {currentUser.id === emp.id && (
                                  <span className="text-[10px] text-amber-800 bg-amber-200 px-1.5 rounded font-bold">
                                    الحالي
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {emp.role === 'manager'
                                  ? 'مدير فرع (تحكم وإدارة كاملة)'
                                  : emp.role === 'cashier'
                                  ? 'كاشير (ورديات وخزينة وأقساط)'
                                  : 'بائع (فواتير وتارجت)'}
                              </div>
                            </div>
                          </div>
                          {emp.role === 'manager' && (
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 px-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>الصلاحيات تتحكم فورياً في علامات التبويب والإجراءات الحساسة.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar / شريط التنقل وتمرير التبويبات الرئيسي */}
          <div className="py-2.5 border-t border-slate-200">
            <div className="flex items-center gap-1.5">
              {/* Right Scroll Arrow Button (أسهم التمرير يميناً) */}
              <button
                type="button"
                onClick={() => scrollTabs('right')}
                title="تمرير التبويبات يميناً"
                className="p-2 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 rounded-xl border border-slate-300 transition-all shadow-xs shrink-0 flex items-center justify-center hover:border-amber-400 active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Scrollable Tabs Container with visible custom scrollbar */}
              <div
                ref={tabsNavRef}
                className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner flex items-center gap-1.5 overflow-x-auto tabs-scrollbar pb-2.5 pt-1.5 relative scroll-smooth w-full"
              >
                {navItems.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const isAllowed = hasPermission(tab.requiresPermission);

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (isAllowed) {
                          setActiveTab(tab.id);
                        } else {
                          onOpenPinModal(`الوصول إلى قسم ${tab.label} (يتطلب صلاحية المدير)`, () => {
                            setActiveTab(tab.id);
                          });
                        }
                      }}
                      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                        isActive
                          ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 scale-[1.01]'
                          : isAllowed
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/40 opacity-70'
                      }`}
                    >
                      <span className="text-sm">{tab.icon}</span>
                      <span>{tab.label}</span>
                      {!isAllowed && <Lock className="w-3 h-3 text-slate-400 mr-1" />}

                      {/* Active Accent Indicator Bar (الشريط المميز للتبويب النشط) */}
                      {isActive && (
                        <span className="absolute bottom-0 inset-x-2 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-full shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Left Scroll Arrow Button (أسهم التمرير يساراً) */}
              <button
                type="button"
                onClick={() => scrollTabs('left')}
                title="تمرير التبويبات يساراً"
                className="p-2 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 rounded-xl border border-slate-300 transition-all shadow-xs shrink-0 flex items-center justify-center hover:border-amber-400 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Backup / Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-600" />
              استيراد وتحديث قاعدة البيانات
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              يمكنك لصق كود النسخة الاحتياطية (JSON) المستخرجة مسبقاً لاسترجاع كافة المبيعات
              والأقساط والمصروفات فوراً بالجنيه المصري.
            </p>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="الصق كود JSON للنسخة الاحتياطية هنا..."
              className="w-full h-36 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono focus:border-amber-500 focus:outline-none mb-3 resize-none"
            />

            {importStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs mb-3 font-medium ${
                  importStatus.startsWith('خطأ')
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {importStatus}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowBackupModal(false);
                  setJsonInput('');
                  setImportStatus(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-xs"
              >
                تأكيد الاستيراد
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
