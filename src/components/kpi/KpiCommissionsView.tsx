import React, { useState } from 'react';
import { useStore, calculateCommission } from '../../context/StoreContext';
import { Employee } from '../../types';
import {
  exportInventoryToCSV,
  exportSalesToCSV,
  exportComprehensiveReportCSV,
  exportEmployeesPerformanceCSV,
} from '../../utils/csvExporter';
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
  Zap,
  Calculator,
  Percent,
  ShieldCheck,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { SalesChart } from './SalesChart';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface KpiCommissionsViewProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
}

export const KpiCommissionsView: React.FC<KpiCommissionsViewProps> = ({
  onOpenPinModal,
}) => {
  const { employees, products, invoices, returns, currentUser, permissions } = useStore();
  const isReadOnly = permissions?.readOnly;

  // Export functions
  const exportToExcel = () => {
    const data = sortedEmployees.map((emp) => {
      const comm = calculateCommission(
        emp.currentSales,
        emp.monthlyTarget,
        emp.salary || 6000,
        emp.targetBonusPercent || 20,
        emp.commissionRate
      );
      return {
        'الاسم': emp.name,
        'الدور': emp.role,
        'المبيعات المحققة': emp.currentSales,
        'الهدف الشهري': emp.monthlyTarget,
        'نسبة الإنجاز %': comm.achievementPercent,
        'إجمالي الحوافز': comm.totalCommission,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقارير المالية');
    XLSX.writeFile(wb, 'تقرير_العمولات.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('تقرير العمولات والمبيعات', 14, 15);
    autoTable(doc, {
      head: [['الاسم', 'الدور', 'المبيعات', 'الهدف', 'الإنجاز %', 'الحوافز']],
      body: sortedEmployees.map((emp) => {
        const comm = calculateCommission(
          emp.currentSales,
          emp.monthlyTarget,
          emp.salary || 6000,
          emp.targetBonusPercent || 20,
          emp.commissionRate
        );
        return [
          emp.name,
          emp.role,
          emp.currentSales.toString(),
          emp.monthlyTarget.toString(),
          `${comm.achievementPercent}%`,
          comm.totalCommission.toString(),
        ];
      }),
    });
    doc.save('تقرير_العمولات.pdf');
  };

  // Selected employee for simulation
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    currentUser.id || employees[0]?.id || ''
  );
  const [simulationAmount, setSimulationAmount] = useState<number>(5000);

  // Target Edit Modal
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newTargetInput, setNewTargetInput] = useState<number>(100000);

  // Sort employees by sales achievement
  const sortedEmployees = [...employees].sort((a, b) => {
    const aRate = a.currentSales / (a.monthlyTarget || 1);
    const bRate = b.currentSales / (b.monthlyTarget || 1);
    return bRate - aRate;
  });

  const selectedEmployee =
    employees.find((e) => e.id === selectedEmpId) || employees[0];

  // Simulation calculations
  const simCurrent = calculateCommission(
    selectedEmployee.currentSales,
    selectedEmployee.monthlyTarget,
    selectedEmployee.salary || 6000,
    selectedEmployee.targetBonusPercent || 20,
    selectedEmployee.commissionRate
  );
  const simProjectedSales = selectedEmployee.currentSales + simulationAmount;
  const simProjected = calculateCommission(
    simProjectedSales,
    selectedEmployee.monthlyTarget,
    selectedEmployee.salary || 6000,
    selectedEmployee.targetBonusPercent || 20,
    selectedEmployee.commissionRate
  );
  const simCommissionDelta = simProjected.totalCommission - simCurrent.totalCommission;

  const handleOpenEditTarget = (emp: Employee) => {
    onOpenPinModal(`تعديل التارجت الشهري للموظف: ${emp.name} (PIN المدير)`, () => {
      setEditingEmployee(emp);
      setNewTargetInput(emp.monthlyTarget);
    });
  };

  const handleSaveTarget = () => {
    if (!editingEmployee) return;
    editingEmployee.monthlyTarget = newTargetInput;
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      {/* KPI Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              التارجت وحوافز الموظفين (KPIs & Tiered Commissions)
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            تتبع فوري ومباشر مع كل فاتورة بيع للمبيعات التراكمية، النسبة المئوية لتحقيق
            الهدف، وحساب العمولات الآلية متعددة الشرائح والجوائز التقديرية بالجنيه المصري.
          </p>
        </div>

        {/* Commission Tiers Legend */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs shrink-0">
            <div className="px-2 py-1 bg-amber-50 text-amber-800 rounded border border-amber-200 font-mono text-[11px] font-semibold">
              &lt; 80%: 1%
            </div>
            <div className="px-2 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono text-[11px] font-semibold">
              80-100%: 2%
            </div>
            <div className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 font-mono text-[11px] font-bold">
              &gt; 100%: 3.5% + 1,500 ج.م
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportComprehensiveReportCSV(products, invoices, returns)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors shadow-xs"
              title="تصدير ملخص مالي وشامل لكافة المبيعات والمخزون"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV ملخص
            </button>
            <button
              onClick={exportToExcel}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Download className="w-3 h-3" /> Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* CSV Reports Quick Toolbar for Manager */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900">
              مركز تصدير كافة تقارير النظام بصيغة CSV (Excel / Sheet Analytics)
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono font-medium">
            ترميز UTF-8 مع أرقام وبيانات باللغة العربية
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <button
            onClick={() => exportSalesToCSV(invoices)}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-right transition-all group shadow-xs"
          >
            <div>
              <div className="font-bold text-emerald-700 text-xs">تصدير الفواتير والمبيعات</div>
              <div className="text-[10px] text-slate-500 mt-0.5">({invoices.length} فاتورة مسجلة)</div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
          </button>

          <button
            onClick={() => exportInventoryToCSV(products)}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-right transition-all group shadow-xs"
          >
            <div>
              <div className="font-bold text-sky-700 text-xs">تصدير المخزون والأصناف</div>
              <div className="text-[10px] text-slate-500 mt-0.5">({products.length} صنف ملابس)</div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
          </button>

          <button
            onClick={() => exportEmployeesPerformanceCSV(employees)}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-right transition-all group shadow-xs"
          >
            <div>
              <div className="font-bold text-amber-700 text-xs">تصدير أداء وعمولات الموظفين</div>
              <div className="text-[10px] text-slate-500 mt-0.5">({employees.length} موظف وطاقم)</div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0" />
          </button>

          <button
            onClick={() => exportComprehensiveReportCSV(products, invoices, returns)}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-right transition-all group shadow-xs"
          >
            <div>
              <div className="font-bold text-purple-700 text-xs">تقرير ملخص أرباح ومخزون</div>
              <div className="text-[10px] text-slate-500 mt-0.5">ملخص رقمي مالي</div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-purple-600 shrink-0" />
          </button>
        </div>
      </div>

      <SalesChart />

      {/* Staff Leaderboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedEmployees.map((emp, index) => {
          const comm = calculateCommission(
            emp.currentSales,
            emp.monthlyTarget,
            emp.salary || 6000,
            emp.targetBonusPercent || 20,
            emp.commissionRate
          );
          const isUser = emp.id === currentUser.id;

          return (
            <div
              key={emp.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                isUser
                  ? 'bg-white border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                      {emp.avatar.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{emp.name}</span>
                        {isUser && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-bold">
                            أنت
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {emp.role === 'manager'
                          ? 'مدير فرع'
                          : emp.role === 'cashier'
                          ? 'كاشير رئيسي'
                          : 'مستشار مبيعات'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      index === 0
                        ? 'bg-amber-400 text-slate-950'
                        : index === 1
                        ? 'bg-slate-200 text-slate-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{index + 1}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">نسبة الإنجاز:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        comm.achievementPercent >= 100
                          ? 'text-emerald-600'
                          : comm.achievementPercent >= 80
                          ? 'text-amber-600'
                          : 'text-sky-600'
                      }`}
                    >
                      {comm.achievementPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-500 ${
                        comm.achievementPercent >= 100
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                          : comm.achievementPercent >= 80
                          ? 'bg-amber-500'
                          : 'bg-sky-500'
                      }`}
                      style={{ width: `${Math.min(100, comm.achievementPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Figures */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">المبيعات المحققة:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {(emp.currentSales ?? 0).toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">الهدف الشهري:</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {(emp.monthlyTarget ?? 0).toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">المتبقي للتارجت:</span>
                    <span className="font-mono text-amber-600 font-semibold">
                      {(comm.remainingToTarget ?? 0).toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">المرتب الأساسي:</span>
                    <span className="font-mono text-slate-700">
                      {(emp.salary ?? 6000).toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">حافز التارجت ({emp.targetBonusPercent || 20}%):</span>
                    <span className={`font-mono font-bold ${comm.isTargetAchieved ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {comm.isTargetAchieved
                        ? `+${(comm.targetSalaryBonus ?? 0).toLocaleString()} ج.م`
                        : `${Math.round(((emp.salary ?? 6000) * (emp.targetBonusPercent || 20)) / 100).toLocaleString()} ج.م (عند الإنجاز)`}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-slate-200 flex justify-between">
                    <span className="text-slate-600 font-bold">إجمالي الحوافز المستحقة:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {(comm.totalCommission ?? 0).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {currentUser.role === 'manager' && !isReadOnly && (
                <button
                  onClick={() => handleOpenEditTarget(emp)}
                  className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors border border-slate-200"
                >
                  تعديل التارجت الشهري
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Simulator Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Calculator className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">
            حاسبة محاكاة العمولات الفورية (Instant Commission & Target Simulator)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1.5">اختر الموظف للمحاكاة:</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (التارجت: {emp.monthlyTarget.toLocaleString()} ج.م)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1.5">قيمة البيعة المتوقعة (ج.م):</label>
            <input
              type="number"
              step="500"
              value={simulationAmount}
              onChange={(e) => setSimulationAmount(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col justify-between text-xs">
            <span className="text-slate-700 font-medium">الزيادة الفورية في عمولة الموظف بعد هذه البيعة:</span>
            <div className="text-xl font-bold font-mono text-emerald-600 tabular-nums">
              +{simCommissionDelta.toLocaleString()} ج.م
            </div>
            <span className="text-[10px] text-slate-500">
              ترفع إنجازه من {simCurrent.achievementPercent}% إلى {simProjected.achievementPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Target Edit Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" />
              <span>تعديل تارجت الموظف: {editingEmployee.name}</span>
            </h3>

            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">الهدف الشهري الجديد (ج.م):</label>
              <input
                type="number"
                step="5000"
                value={newTargetInput}
                onChange={(e) => setNewTargetInput(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveTarget}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
