import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AuditLog, AuditActionType, UserRole } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Search,
  Filter,
  AlertTriangle,
  FileCheck,
  UserCheck,
  KeyRound,
  Shield,
} from 'lucide-react';

interface AuditLogsViewProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  onOpenPinModal,
}) => {
  const { auditLogs, logAudit, currentUser, hasPermission } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Sensitive test trigger
  const handleTestSensitiveReturn = () => {
    onOpenPinModal('اعتماد مرتجع ملابس استثنائي بدون فاتورة (PIN المدير)', () => {
      logAudit(
        'return_without_invoice',
        'مرتجع قطعة ملابس بدون فاتورة شراء',
        'تم قبول إرجاع بدلة رجالي كحلي بدون فاتورة معتمدة بقيمة 3,200 ج.م بعد فحص الباركود وموافقة المدير.',
        'critical',
        'مدير الفرع'
      );
    });
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.employeeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchSeverity =
      selectedSeverity === 'all' ? true : log.severity === selectedSeverity;

    const matchRole =
      selectedRole === 'all' ? true : log.role === selectedRole;

    return matchSearch && matchSeverity && matchRole;
  });

  const getSeverityBadge = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>حرج للغاية</span>
          </span>
        );
      case 'sensitive':
        return (
          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-600" />
            <span>حساس (موافقة PIN)</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
            عادي / دوري
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              سجل الأمان والتدقيق الرقابي ونظام الصلاحيات (Audit Logs & RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            توثيق إلكتروني فوري ومحكم لكافة العمليات الحساسة: الخصومات الاستثنائية، تعديل
            الأسعار اليدوي، مرتجعات بدون فواتير، وإغلاقات الشيفت مع تحديد هوية الموظف
            وتوقيته بدقة متناهية.
          </p>
        </div>

        <button
          onClick={handleTestSensitiveReturn}
          className="self-start md:self-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shrink-0 shadow-xs"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>اختبار إجراء حساس (مرتجع بدون فاتورة)</span>
        </button>
      </div>

      {/* RBAC Matrix Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <Lock className="w-4 h-4 text-amber-500" />
          <span>مصفوفة الصلاحيات حسب الدور الوظيفي (Role-Based Access Control)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          {/* Salesman */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-700">مستشار مبيعات (بائع)</span>
              <span className="text-[10px] bg-sky-100 px-2 py-0.5 rounded text-sky-800 font-semibold">
                مستوى أساسي
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>إجراء عمليات البيع والبحث في الكتالوج</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>متابعة التارجت الشخصي والعمولة اللحظية</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>تطبيق خصم عادي حتى 10% فقط</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <span>✕ لا يحق له إغلاق الشيفت أو تعديل الأسعار أو الخصم &gt;10%</span>
              </li>
            </ul>
          </div>

          {/* Cashier */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-700">كاشير رئيسي</span>
              <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-semibold">
                مستوى مالي
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>استلام وتسليم الوردية والجرد النقدي</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>تحصيل أقساط العقود وسندات القبض</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>تسجيل المصروفات اليومية والنثريات</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <span>✕ تعديل الأسعار والخصومات الكبيرة تتطلب PIN المدير</span>
              </li>
            </ul>
          </div>

          {/* Manager */}
          <div className="bg-slate-50 border border-amber-300 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-800">مدير الفرع</span>
              <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-800 font-bold">
                تحكم كامل وإشراف
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>اعتماد الخصومات الاستثنائية الكبيرة</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>تعديل أسعار البيع اليدوية وأرصدة المخزون</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>اعتماد مرتجعات بدون فواتير والتعديلات الإدارية</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير واستيراد النسخ الاحتياطية وإدارة التارجت</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-medium"
            >
              <option value="all">كافة مستويات الحساسية</option>
              <option value="normal">عادي / دوري</option>
              <option value="sensitive">حساس (موافقة PIN)</option>
              <option value="critical">حرج للغاية</option>
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-medium"
            >
              <option value="all">كافة الأدوار</option>
              <option value="salesman">بائع</option>
              <option value="cashier">كاشير</option>
              <option value="manager">مدير</option>
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في سجل الأمان..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">التوقيت والتاريخ</th>
                <th className="py-2.5 px-3">الموظف المسؤول</th>
                <th className="py-2.5 px-3">الدور</th>
                <th className="py-2.5 px-3">نوع العملية</th>
                <th className="py-2.5 px-3">تفاصيل الإجراء</th>
                <th className="py-2.5 px-3">المستوى الرقابي</th>
                <th className="py-2.5 px-3 text-left">الاعتماد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                    <div>
                      {new Date(log.date).toLocaleDateString('ar-EG')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(log.date).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    {log.employeeName}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                      {log.role === 'manager'
                        ? 'مدير'
                        : log.role === 'cashier'
                        ? 'كاشير'
                        : 'بائع'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-700 whitespace-nowrap">
                    {log.actionTitle}
                  </td>
                  <td className="py-3 px-3 text-slate-600 leading-relaxed max-w-xs">
                    {log.details}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getSeverityBadge(log.severity)}
                  </td>
                  <td className="py-3 px-3 text-left whitespace-nowrap">
                    {log.approvedBy ? (
                      <span className="text-[10px] text-emerald-700 font-mono flex items-center justify-end gap-1 font-bold">
                        <KeyRound className="w-3 h-3 text-emerald-600" />
                        <span>{log.approvedBy}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
