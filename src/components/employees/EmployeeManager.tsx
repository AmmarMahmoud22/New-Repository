import React, { useState, useMemo } from 'react';
import { useStore, ROLE_PERMISSIONS_MAP, RolePermissions } from '../../context/StoreContext';
import { Employee, UserRole, AttendanceStatus, AttendanceRecord } from '../../types';
import {
  Users,
  User,
  KeyRound,
  Plus,
  Search,
  Phone,
  Shield,
  Target,
  Edit,
  Trash2,
  DollarSign,
  UserCheck,
  ShieldCheck,
  X,
  Lock,
  FileText,
  ShoppingBag,
  Tag,
  Package,
  RotateCcw,
  ShieldAlert,
  Filter,
  CheckCircle2,
  Clock,
  ArrowDownUp,
  Receipt,
  ListFilter,
  Printer,
  Calendar,
  AlertTriangle,
  FileCheck,
  BadgeAlert,
  CalendarDays,
  Sparkles,
  Calculator,
  Award,
  Building,
  Check,
} from 'lucide-react';

const PERMISSION_LABELS: Record<keyof RolePermissions, string> = {
  canSell: 'إجراء مبيعات (POS)',
  canViewKpi: 'مشاهدة KPIs والعمولات',
  canManageShift: 'فتح وإدارة الشيفت',
  canLogExpense: 'تسجيل مصروفات',
  canApplyNormalDiscount: 'تطبيق خصم عادي',
  canApplyHighDiscount: 'تطبيق خصم مرتفع (>10%)',
  canEditPrice: 'تعديل الأسعار',
  canEditStock: 'تعديل كميات المخزون',
  canCloseShift: 'إغلاق الشيفت',
  canViewAudit: 'مشاهدة سجل الرقابة',
  canManageInstallments: 'إدارة التقسيط',
  canCollectInstallments: 'تحصيل أقساط',
  canAccessInventory: 'دخول صفحة المخزون',
  canManageEmployees: 'إدارة الموظفين',
  canManageCustomers: 'إدارة العملاء',
  canManageSuppliers: 'إدارة الموردين وحساباتهم',
  canManageTreasury: 'إدارة الحسابات والخزينة والسحب والإيداع',
  canExportBackup: 'تصدير نسخة احتياطية',
  canResetData: 'تصفير البيانات',
  canViewReports: 'مشاهدة التقارير والتحليلات',
  readOnly: 'مشاهدة فقط (إخفاء أزرار التعديل والحذف)',
};

export interface PerformanceRatingInfo {
  score: number; // 0 to 100
  stars: number; // 1 to 5
  salesScore: number; // out of 40
  hoursScore: number; // out of 30
  punctualityScore: number; // out of 30
  label: string;
  color: string;
  badgeBg: string;
  totalWorkedHours: number;
}

export function calculatePerformanceRating(
  emp: Employee,
  attendanceRecords: AttendanceRecord[],
  selectedMonth: string
): PerformanceRatingInfo {
  // 1. Sales Performance (40% weight)
  const target = emp.monthlyTarget > 0 ? emp.monthlyTarget : 1;
  const salesRatio = Math.min(1.25, (emp.currentSales || 0) / target);
  const salesScore = Math.round(salesRatio * 32); // Up to 40 pts if 125% target

  // 2. Working Hours Performance (30% weight)
  const monthAtt = attendanceRecords.filter(
    (r) => r.employeeId === emp.id && r.date.startsWith(selectedMonth)
  );
  const totalWorkedHours = monthAtt.reduce(
    (acc, r) => acc + (r.workingHours || r.workHours || (r.checkInTime && r.checkOutTime ? 8 : 0)),
    0
  );
  const expectedMonthlyHours = 160; // Standard 20 days * 8 hours
  const hoursRatio = Math.min(1.1, totalWorkedHours / expectedMonthlyHours);
  const hoursScore = Math.round(hoursRatio * 30);

  // 3. Punctuality & Discipline Performance (30% weight)
  const totalLateMins = monthAtt.reduce(
    (acc, r) => acc + (r.latenessMinutes || r.lateMinutes || 0),
    0
  );
  const totalAbsences = monthAtt.filter((r) => r.status === 'absent').length;

  const lateDeductionPoints = Math.floor(totalLateMins / 15);
  const absenceDeductionPoints = totalAbsences * 5;
  const punctualityScore = Math.max(0, 30 - lateDeductionPoints - absenceDeductionPoints);

  // Total Score (0 to 100)
  const score = Math.min(100, Math.max(10, salesScore + hoursScore + punctualityScore));

  let stars = 1;
  let label = 'يحتاج تحسين ⭐';
  let color = 'text-rose-600';
  let badgeBg = 'bg-rose-100 text-rose-800 border-rose-300';

  if (score >= 90) {
    stars = 5;
    label = 'ممتاز جداً ⭐⭐⭐⭐⭐';
    color = 'text-amber-600';
    badgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
  } else if (score >= 78) {
    stars = 4;
    label = 'جيد جداً ⭐⭐⭐⭐';
    color = 'text-emerald-700';
    badgeBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
  } else if (score >= 65) {
    stars = 3;
    label = 'جيد ⭐⭐⭐';
    color = 'text-sky-700';
    badgeBg = 'bg-sky-100 text-sky-900 border-sky-300';
  } else if (score >= 50) {
    stars = 2;
    label = 'مقبول ⭐⭐';
    color = 'text-amber-700';
    badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
  }

  return {
    score,
    stars,
    salesScore,
    hoursScore,
    punctualityScore,
    label,
    color,
    badgeBg,
    totalWorkedHours,
  };
}

interface EmployeeManagerProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  onOpenPinModal,
}) => {
  const {
    employees,
    invoices,
    auditLogs,
    returns,
    employeeAdjustments,
    attendanceRecords,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addEmployeeAdjustment,
    checkInEmployee,
    checkOutEmployee,
    recordManualAttendance,
    deleteAttendanceRecord,
    currentUser,
    hasPermission,
    permissions,
    verifyManagerPin,
    updateManagerPin,
  } = useStore();

  const isReadOnly = permissions.readOnly;

  // Active Sub-Tab Navigation
  const [activeTab, setActiveTab] = useState<'all' | 'directory' | 'hours' | 'alerts' | 'payroll' | 'attendance' | 'adjustments' | 'logs' | 'employeeHours'>('all');

  // Worked Hours Detailed Report Filter State
  const [hoursEmpFilter, setHoursEmpFilter] = useState<string>('all');
  const [hoursMonthFilter, setHoursMonthFilter] = useState<string>('2026-10');
  const [queryEmpCode, setQueryEmpCode] = useState('');
  const [querySpecificDate, setQuerySpecificDate] = useState('');

  // Manager PIN Change Modal State
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Payroll Section State & Payslip Modal
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>('2026-10');
  const [selectedPayslipData, setSelectedPayslipData] = useState<{
    employee: Employee;
    month: string;
    baseSalary: number;
    targetBonus: number;
    commission: number;
    extraBonuses: number;
    attendancePenalties: number;
    extraDeductions: number;
    totalEarnings: number;
    totalDeductions: number;
    netSalary: number;
    workedDays: number;
    workedHours: number;
    lateMinutes: number;
    ratingInfo: PerformanceRatingInfo;
    adjustmentsList: typeof employeeAdjustments;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Attendance filter state
  const [attFilterEmpId, setAttFilterEmpId] = useState<string>('all');
  const [attFilterStatus, setAttFilterStatus] = useState<string>('all');

  // Manual Attendance Modal State
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '',
    date: new Date().toISOString().slice(0, 10),
    checkInTime: '09:30',
    checkOutTime: '17:30',
    status: 'present' as AttendanceStatus,
    notes: '',
  });

  // Logs state
  const [selectedLogEmpId, setSelectedLogEmpId] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Bonus & Deduction Modal State
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [targetEmpForAdjustment, setTargetEmpForAdjustment] = useState<Employee | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'bonus' | 'deduction'>('bonus');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(500);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);

  // Filter for Adjustments Log
  const [adjFilterEmpId, setAdjFilterEmpId] = useState<string>('all');
  const [adjFilterType, setAdjFilterType] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'salesman' as UserRole,
    code: '',
    phone: '',
    nationalId: '',
    pinCode: '',
    monthlyTarget: 100000,
    salary: 6000,
    salaryType: 'monthly' as 'monthly' | 'hourly',
    standardDailyHours: 8,
    hourlyRate: 35,
    overtimeHourlyRate: 50,
    targetBonusPercent: 20, // Manager sets % of salary rewarded when target is reached
    commissionRate: 2,
    avatar: '',
    joinDate: new Date().toISOString().slice(0, 10),
    contractEndDate: '',
    docExpiryDate: '',
    nationalIdExpiry: '',
    permissions: {} as Partial<RolePermissions>,
  });

  // Shift Wrap-up Modal State
  const [showShiftWrapUpModal, setShowShiftWrapUpModal] = useState(false);
  const [shiftWrapUpData, setShiftWrapUpData] = useState<{
    employee: Employee;
    checkInTime: string;
    checkOutTime: string;
    workedHours: number;
    standardHours: number;
    overtimeHours: number;
    shiftSales: number;
    notes: string;
  } | null>(null);

  // Aggregated operations log for employees
  const aggregatedEmployeeLogs = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      employeeId: string;
      employeeName: string;
      role?: UserRole;
      category: 'sale' | 'discount' | 'stock' | 'return' | 'audit';
      categoryLabel: string;
      title: string;
      details: string;
      amount?: number;
      severity: 'normal' | 'sensitive' | 'critical';
      approvedBy?: string;
    }> = [];

    // 1. Audit logs
    auditLogs.forEach((log) => {
      let cat: 'sale' | 'discount' | 'stock' | 'return' | 'audit' = 'audit';
      let catLabel = 'إجراء رقابي';

      if (log.actionType === 'discount_exception') {
        cat = 'discount';
        catLabel = 'خصم استثنائي';
      } else if (
        log.actionType === 'stock_update' ||
        log.actionType === 'product_created' ||
        log.actionType === 'manual_price_edit'
      ) {
        cat = 'stock';
        catLabel = 'تعديل المخزون/الأسعار';
      } else if (
        log.actionType === 'return_processed' ||
        log.actionType === 'return_without_invoice'
      ) {
        cat = 'return';
        catLabel = 'مرتجع واسترجاع';
      }

      list.push({
        id: log.id,
        date: log.date,
        employeeId: log.employeeId,
        employeeName: log.employeeName,
        role: log.role,
        category: cat,
        categoryLabel: catLabel,
        title: log.actionTitle,
        details: log.details,
        severity: log.severity,
        approvedBy: log.approvedBy,
      });
    });

    // 2. Invoices (Sales & Discounts)
    invoices.forEach((inv) => {
      // Cashier action
      list.push({
        id: `inv-cashier-${inv.id}`,
        date: inv.date,
        employeeId: inv.cashierId,
        employeeName: inv.cashierName,
        category: 'sale',
        categoryLabel: 'عملية بيع (كاشير)',
        title: `إصدار فاتورة #${inv.invoiceNumber}`,
        details: `إجمالي الفاتورة: ${inv.grandTotal.toLocaleString()} ج.م | العميل: ${inv.customerName} | طريقة الدفع: ${
          inv.paymentMethod === 'cash'
            ? 'نقداً (كاش)'
            : inv.paymentMethod === 'card'
            ? 'فيزا/بطاقة'
            : 'دفع مجزأ'
        }`,
        amount: inv.grandTotal,
        severity: 'normal',
      });

      // Salesman action if distinct
      if (inv.salesmanId && inv.salesmanId !== inv.cashierId) {
        list.push({
          id: `inv-salesman-${inv.id}`,
          date: inv.date,
          employeeId: inv.salesmanId,
          employeeName: inv.salesmanName,
          category: 'sale',
          categoryLabel: 'عمولة مبيعات (بائع)',
          title: `تسجيل مبيعات فاتورة #${inv.invoiceNumber}`,
          details: `قيمة البيعة: ${inv.grandTotal.toLocaleString()} ج.م | أصناف: ${inv.items.length} قطعة | العميل: ${inv.customerName}`,
          amount: inv.grandTotal,
          severity: 'normal',
        });
      }

      // Invoice discount
      if (inv.discountTotal && inv.discountTotal > 0) {
        list.push({
          id: `inv-disc-${inv.id}`,
          date: inv.date,
          employeeId: inv.cashierId,
          employeeName: inv.cashierName,
          category: 'discount',
          categoryLabel: 'تخفيض فاتورة',
          title: `منح خصم بقيمة ${inv.discountTotal.toLocaleString()} ج.م`,
          details: `خصم على الفاتورة رقم #${inv.invoiceNumber} (البائع المسجل: ${inv.salesmanName})`,
          amount: inv.discountTotal,
          severity: inv.discountTotal > 300 ? 'sensitive' : 'normal',
          approvedBy: inv.exceptionalDiscountApprovedBy,
        });
      }
    });

    // 3. Returns
    returns.forEach((ret) => {
      list.push({
        id: `ret-op-${ret.id}`,
        date: ret.date,
        employeeId: ret.processedById || '',
        employeeName: ret.processedBy,
        category: 'return',
        categoryLabel: 'عملية مرتجع',
        title: `استرجاع فاتورة #${ret.originalInvoiceNumber} (${ret.returnNumber})`,
        details: `مبلغ المسترد: ${ret.totalRefundAmount.toLocaleString()} ج.م | السبب: ${ret.reason} | البائع الأصلي: ${
          ret.salesmanName || 'غير محدد'
        }`,
        amount: ret.totalRefundAmount,
        severity: 'sensitive',
      });
    });

    // Sort descending
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [auditLogs, invoices, returns]);

  // Filtered operations log
  const filteredOperationsLog = useMemo(() => {
    return aggregatedEmployeeLogs.filter((item) => {
      const matchEmp =
        selectedLogEmpId === 'all'
          ? true
          : item.employeeId === selectedLogEmpId ||
            item.employeeName.toLowerCase().includes(
              employees.find((e) => e.id === selectedLogEmpId)?.name.toLowerCase() || ''
            );

      const matchCat =
        selectedCategoryFilter === 'all'
          ? true
          : item.category === selectedCategoryFilter;

      const matchQuery =
        !logSearchQuery.trim() ||
        item.title.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        item.details.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        item.employeeName.toLowerCase().includes(logSearchQuery.toLowerCase());

      return matchEmp && matchCat && matchQuery;
    });
  }, [
    aggregatedEmployeeLogs,
    selectedLogEmpId,
    selectedCategoryFilter,
    logSearchQuery,
    employees,
  ]);

  // Selected Employee Quick Stats
  const selectedEmpStats = useMemo(() => {
    if (selectedLogEmpId === 'all') {
      const totalSalesVal = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
      const totalDiscountsVal = invoices.reduce(
        (acc, inv) => acc + (inv.discountTotal || 0),
        0
      );
      const totalReturnsVal = returns.reduce(
        (acc, ret) => acc + ret.totalRefundAmount,
        0
      );

      return {
        salesCount: invoices.length,
        salesTotal: totalSalesVal,
        discountsCount: invoices.filter((i) => i.discountTotal > 0).length,
        discountsTotal: totalDiscountsVal,
        returnsCount: returns.length,
        returnsTotal: totalReturnsVal,
      };
    }

    const empObj = employees.find((e) => e.id === selectedLogEmpId);
    const empName = empObj?.name || '';

    const empInvoices = invoices.filter(
      (i) => i.cashierId === selectedLogEmpId || i.salesmanId === selectedLogEmpId
    );
    const salesTotal = empObj?.currentSales || 0;
    const discountsCount = empInvoices.filter((i) => i.discountTotal > 0).length;
    const discountsTotal = empInvoices.reduce(
      (acc, i) => acc + (i.discountTotal || 0),
      0
    );
    const empReturns = returns.filter(
      (r) => r.processedById === selectedLogEmpId || r.salesmanId === selectedLogEmpId
    );
    const returnsTotal = empReturns.reduce(
      (acc, r) => acc + r.totalRefundAmount,
      0
    );

    return {
      salesCount: empInvoices.length,
      salesTotal,
      discountsCount,
      discountsTotal,
      returnsCount: empReturns.length,
      returnsTotal,
    };
  }, [selectedLogEmpId, invoices, returns, employees]);

  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.includes(searchQuery) ||
      emp.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchRole =
      selectedRoleFilter === 'all' ? true : emp.role === selectedRoleFilter;

    return matchSearch && matchRole;
  });

  // Contract & Official Documents Expiration Alerts
  const expiryAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      employeeId: string;
      employeeName: string;
      employeeCode: string;
      type: 'contract' | 'doc' | 'id';
      typeLabel: string;
      date: string;
      diffDays: number;
      status: 'expired' | 'urgent' | 'warning';
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    employees.forEach((emp) => {
      const checks = [
        { dateStr: emp.contractEndDate, type: 'contract' as const, label: 'عقد العمل' },
        { dateStr: emp.docExpiryDate, type: 'doc' as const, label: 'الأوراق والفيش والوثائق' },
        { dateStr: emp.nationalIdExpiry, type: 'id' as const, label: 'بطاقة الرقم القومي' },
      ];

      checks.forEach((chk) => {
        if (chk.dateStr) {
          const targetDate = new Date(chk.dateStr);
          targetDate.setHours(0, 0, 0, 0);
          const diffTime = targetDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 30) {
            let status: 'expired' | 'urgent' | 'warning' = 'warning';
            if (diffDays <= 0) status = 'expired';
            else if (diffDays <= 10) status = 'urgent';

            alerts.push({
              id: `${emp.id}-${chk.type}`,
              employeeId: emp.id,
              employeeName: emp.name,
              employeeCode: emp.code,
              type: chk.type,
              typeLabel: chk.label,
              date: chk.dateStr,
              diffDays,
              status,
            });
          }
        }
      });
    });

    return alerts.sort((a, b) => a.diffDays - b.diffDays);
  }, [employees]);

  // Monthly Payroll Calculations
  const payrollDataList = useMemo(() => {
    return employees.map((emp) => {
      const empAtt = attendanceRecords.filter(
        (r) => r.employeeId === emp.id && r.date.startsWith(selectedPayrollMonth)
      );
      const workedDays = empAtt.filter((r) => r.status === 'present' || r.status === 'late').length;
      const workedHours = empAtt.reduce((acc, r) => acc + (r.workingHours || r.workHours || 8), 0);
      const lateMinutes = empAtt.reduce((acc, r) => acc + (r.latenessMinutes || r.lateMinutes || 0), 0);
      const attendancePenalties = empAtt.reduce((acc, r) => acc + (r.autoDeductionAmount || 0), 0);

      const isTargetMet = emp.currentSales >= emp.monthlyTarget;
      const targetBonus = isTargetMet ? Math.round((emp.salary * (emp.targetBonusPercent || 20)) / 100) : 0;
      const commission = Math.round((emp.currentSales * (emp.commissionRate || 2)) / 100);

      const monthAdjustments = employeeAdjustments.filter(
        (a) => a.employeeId === emp.id && a.date.startsWith(selectedPayrollMonth)
      );
      const extraBonuses = monthAdjustments
        .filter((a) => a.type === 'bonus')
        .reduce((acc, a) => acc + a.amount, 0);
      const extraDeductions = monthAdjustments
        .filter((a) => a.type === 'deduction')
        .reduce((acc, a) => acc + a.amount, 0);

      const totalEarnings = emp.salary + targetBonus + commission + extraBonuses;
      const totalDeductions = attendancePenalties + extraDeductions;
      const netSalary = Math.max(0, totalEarnings - totalDeductions);

      const ratingInfo = calculatePerformanceRating(emp, attendanceRecords, selectedPayrollMonth);

      return {
        employee: emp,
        month: selectedPayrollMonth,
        baseSalary: emp.salary,
        targetBonus,
        commission,
        extraBonuses,
        attendancePenalties,
        extraDeductions,
        totalEarnings,
        totalDeductions,
        netSalary,
        workedDays,
        workedHours,
        lateMinutes,
        ratingInfo,
        adjustmentsList: monthAdjustments,
      };
    });
  }, [employees, attendanceRecords, employeeAdjustments, selectedPayrollMonth]);

  const payrollSummary = useMemo(() => {
    const totalBase = payrollDataList.reduce((acc, p) => acc + p.baseSalary, 0);
    const totalIncentives = payrollDataList.reduce((acc, p) => acc + p.targetBonus + p.commission + p.extraBonuses, 0);
    const totalDeductions = payrollDataList.reduce((acc, p) => acc + p.totalDeductions, 0);
    const totalNet = payrollDataList.reduce((acc, p) => acc + p.netSalary, 0);

    return { totalBase, totalIncentives, totalDeductions, totalNet };
  }, [payrollDataList]);

  const handleOpenAddModal = () => {
    const nextCode = `EMP-0${employees.length + 1}`;
    setEditingEmployee(null);
    setFormData({
      name: '',
      role: 'salesman',
      code: nextCode,
      phone: '',
      nationalId: '',
      pinCode: String(Math.floor(1000 + Math.random() * 9000)), // Default 4-digit PIN
      monthlyTarget: 80000,
      salary: 5000,
      salaryType: 'monthly',
      standardDailyHours: 8,
      hourlyRate: 35,
      overtimeHourlyRate: 50,
      targetBonusPercent: 20,
      commissionRate: 2,
      avatar: '',
      joinDate: new Date().toISOString().slice(0, 10),
      contractEndDate: '',
      docExpiryDate: '',
      nationalIdExpiry: '',
      permissions: {},
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      role: emp.role,
      code: emp.code,
      phone: emp.phone,
      nationalId: emp.nationalId || '',
      pinCode: emp.pinCode || emp.code || '1234',
      monthlyTarget: emp.monthlyTarget,
      salary: emp.salary || 6000,
      salaryType: emp.salaryType || 'monthly',
      standardDailyHours: emp.standardDailyHours || 8,
      hourlyRate: emp.hourlyRate || 35,
      overtimeHourlyRate: emp.overtimeHourlyRate || 50,
      targetBonusPercent: emp.targetBonusPercent || 20,
      commissionRate: emp.commissionRate || 2,
      avatar: emp.avatar || emp.name.slice(0, 1),
      joinDate: emp.joinDate || new Date().toISOString().slice(0, 10),
      contractEndDate: emp.contractEndDate || '',
      docExpiryDate: emp.docExpiryDate || '',
      nationalIdExpiry: emp.nationalIdExpiry || '',
      permissions: emp.permissions || {},
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    if (editingEmployee) {
      updateEmployee({
        ...editingEmployee,
        ...formData,
        permissions: formData.permissions,
      });
    } else {
      addEmployee({
        ...formData,
        avatar: formData.name.slice(0, 1),
        permissions: formData.permissions,
      });
    }
    setShowModal(false);
  };

  const handleOpenAdjustmentModal = (emp: Employee, type: 'bonus' | 'deduction') => {
    setTargetEmpForAdjustment(emp);
    setAdjustmentType(type);
    setAdjustmentAmount(type === 'bonus' ? 500 : 200);
    setAdjustmentReason(type === 'bonus' ? 'مكافأة تميز وحسن أداء' : 'خصم تأخير / غياب / مخالفة');
    setShowAdjustmentModal(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmpForAdjustment || adjustmentAmount <= 0) return;

    const actionText = adjustmentType === 'bonus'
      ? `تسجيل مكافأة بقيمة ${adjustmentAmount.toLocaleString()} ج.م للموظف ${targetEmpForAdjustment.name}`
      : `تسجيل خصم بقيمة ${adjustmentAmount.toLocaleString()} ج.م على الموظف ${targetEmpForAdjustment.name}`;

    const executeSave = () => {
      addEmployeeAdjustment({
        employeeId: targetEmpForAdjustment.id,
        type: adjustmentType,
        amount: adjustmentAmount,
        reason: adjustmentReason,
      });
      setShowAdjustmentModal(false);
      setTargetEmpForAdjustment(null);
    };

    if (currentUser.role !== 'manager') {
      onOpenPinModal(actionText, executeSave);
    } else {
      executeSave();
    }
  };

  const handleOpenDeleteModal = (emp: Employee) => {
    if (emp.id === currentUser.id) {
      alert('لا يمكنك حذف الحساب النشط الحالي المسجل دخول به الآن!');
      return;
    }
    setEmpToDelete(emp);
    setShowDeleteModal(true);
  };

  const handleExecuteDeleteEmployee = () => {
    if (!empToDelete) return;
    const targetId = empToDelete.id;
    const targetName = empToDelete.name;

    const executeDelete = () => {
      deleteEmployee(targetId);
      setShowDeleteModal(false);
      setEmpToDelete(null);
    };

    onOpenPinModal(`حذف الموظف نهائياً من قاعدة البيانات: ${targetName}`, executeDelete);
  };

  const handlePrepareCheckOut = (emp: Employee, todayRec: AttendanceRecord) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let hours = 8;
    if (todayRec.checkInTime) {
      const [inH, inM] = todayRec.checkInTime.split(':').map(Number);
      const [outH, outM] = timeStr.split(':').map(Number);
      const diffMins = Math.max(0, outH * 60 + outM - (inH * 60 + inM));
      hours = Math.round((diffMins / 60) * 10) / 10;
    }

    const stdHours = emp.standardDailyHours || 8;
    const overtime = Math.max(0, hours - stdHours);

    setShiftWrapUpData({
      employee: emp,
      checkInTime: todayRec.checkInTime || '09:00',
      checkOutTime: timeStr,
      workedHours: hours,
      standardHours: stdHours,
      overtimeHours: overtime,
      shiftSales: emp.shiftSales || emp.currentSales || 0,
      notes: '',
    });
    setShowShiftWrapUpModal(true);
  };

  const handleConfirmCheckOut = () => {
    if (!shiftWrapUpData) return;
    checkOutEmployee(shiftWrapUpData.employee.id, shiftWrapUpData.notes);
    setShowShiftWrapUpModal(false);
    setShiftWrapUpData(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'manager':
        return (
          <span className="text-[11px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            <span>مدير الفرع</span>
          </span>
        );
      case 'cashier':
        return (
          <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            <span>كاشير</span>
          </span>
        );
      default:
        return (
          <span className="text-[11px] bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <span>بائع</span>
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
            <Users className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              إدارة طاقم العمل والموظفين
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            تسجيل وتعديل بيانات الموظفين، تحديد الأدوار والصلاحيات (بائع / كاشير / مدير)، أرقام الهواتف،
            والأهداف الشهرية لمتابعة عمولات البيع.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2 shrink-0">
            {currentUser.role === 'manager' && (
              <button
                onClick={() => {
                  setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
                  setPinError('');
                  setPinSuccess('');
                  setShowChangePinModal(true);
                }}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs border border-slate-700"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>تغيير رمز PIN للمدير</span>
              </button>
            )}

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>الكل (عرض شامل)</span>
        </button>

        <button
          onClick={() => setActiveTab('hours')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'hours'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>إجمالي ساعات الموظفين</span>
        </button>
        <button
          onClick={() => setActiveTab('employeeHours')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'employeeHours'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>استعلام ساعات موظف (بالكود)</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'alerts'
              ? 'bg-rose-600 text-white shadow-xs'
              : expiryAlerts.length > 0
              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>تنبيهات العقود والوثائق</span>
          {expiryAlerts.length > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
              {expiryAlerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'payroll'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>سجل الرواتب وكشوف المرتبات</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'attendance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>سجل الحضور والشيفتات</span>
        </button>

        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'adjustments'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>المكافآت والخصومات</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'logs'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>سجل العمليات والرقابة</span>
        </button>
      </div>

      {/* ⚠️ Expiration Alerts Center */}
      {(activeTab === 'all' || activeTab === 'alerts') && (
        <div className="bg-white border border-rose-200 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
                <h3 className="text-base font-black text-slate-900">
                  مركز تنبيهات انتهاء عقود العمل والوثائق الرسمية للموظفين
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                تنبيه مرئي ومباشر لمنع انتهاء العقود أو أوراق الإقامة والفيش والبطاقات الشخصية وتسهيل المتابعة والتجديد.
              </p>
            </div>

            {expiryAlerts.length > 0 ? (
              <span className="bg-rose-100 text-rose-900 border border-rose-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{expiryAlerts.length} تنبيه يتطلب المتابعة والتجديد</span>
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>جميع العقود والوثائق سارية ومتوافقة</span>
              </span>
            )}
          </div>

          {expiryAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {expiryAlerts.map((alert) => {
                const targetEmp = employees.find((e) => e.id === alert.employeeId);
                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                      alert.status === 'expired'
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : alert.status === 'urgent'
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-yellow-50/60 border-yellow-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-black text-xs flex items-center gap-1.5">
                          <span>{alert.employeeName}</span>
                          <span className="text-[10px] font-mono opacity-70">({alert.employeeCode})</span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                          <span>{alert.typeLabel}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {alert.status === 'expired' ? (
                        <span className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                          منتهي منذ {Math.abs(alert.diffDays)} يوم
                        </span>
                      ) : alert.status === 'urgent' ? (
                        <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shrink-0">
                          ينتهي خلال {alert.diffDays} أيام
                        </span>
                      ) : (
                        <span className="bg-yellow-200 text-yellow-900 font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0">
                          ينتهي خلال {alert.diffDays} يوم
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <span>تاريخ الانتهاء: {alert.date}</span>
                      </div>

                      {targetEmp && !isReadOnly && (
                        <button
                          onClick={() => handleOpenEditModal(targetEmp)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow-xs"
                        >
                          <Edit className="w-3 h-3 text-amber-600" />
                          <span>تحديث التاريخ</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
              <p className="font-bold text-slate-700">لا توجد أوراق أو عقود قربت على الانتهاء</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                يمكنك إضافة تواريخ انتهاء العقود والأوراق الرسمية لكل موظف عند التعديل لمتابعتها تلقائياً هنا.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 💰 Monthly Payroll & Payslips Section */}
      {(activeTab === 'all' || activeTab === 'payroll') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  سجل الرواتب الشهري وكشوف المرتبات التفصيلية
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                احتساب الرواتب تلقائياً بناءً على ساعات الحضور والغياب المسجلة، حوافز التارجت والعمولات، الخصومات والمكافآت، وطباعة كشوف المرتبات.
              </p>
            </div>

            {/* Month Picker Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>الشهر المالي:</span>
              </label>
              <select
                value={selectedPayrollMonth}
                onChange={(e) => setSelectedPayrollMonth(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="2026-10">أكتوبر 2026</option>
                <option value="2026-09">سبتمبر 2026</option>
                <option value="2026-08">أغسطس 2026</option>
                <option value="2026-07">يوليو 2026</option>
              </select>
            </div>
          </div>

          {/* Monthly Summary Statistics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 block">إجمالي المرتبات الأساسية</span>
              <div className="text-lg font-black text-slate-900 font-mono">
                {payrollSummary.totalBase.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ج.م</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 block">إجمالي العمولات والحوافز والمكافآت (+)</span>
              <div className="text-lg font-black text-emerald-700 font-mono">
                +{payrollSummary.totalIncentives.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ج.م</span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-rose-800 block">إجمالي الخصومات والجزاءات والتأخيرات (-)</span>
              <div className="text-lg font-black text-rose-700 font-mono">
                -{payrollSummary.totalDeductions.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ج.م</span>
              </div>
            </div>

            <div className="bg-amber-500 text-slate-950 border border-amber-400 rounded-xl p-3.5 space-y-1 shadow-xs">
              <span className="text-[11px] font-bold text-slate-900 block">صافي إجمالي المرتبات المستحقة للصرف</span>
              <div className="text-xl font-black font-mono">
                {payrollSummary.totalNet.toLocaleString()} <span className="text-xs font-bold">ج.م</span>
              </div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">الموظف والوظيفة</th>
                    <th className="p-3">الراتب الأساسي</th>
                    <th className="p-3">تقييم الأداء الشهري</th>
                    <th className="p-3">سجل الحضور بالشهري</th>
                    <th className="p-3">حافز التارجت والعمولة</th>
                    <th className="p-3 text-emerald-700">مكافآت إضافية (+)</th>
                    <th className="p-3 text-rose-700">خصومات وجزاءات (-)</th>
                    <th className="p-3 font-black text-slate-900">صافي المرتب المستحق</th>
                    <th className="p-3 text-center">كشف الراتب والطباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payrollDataList.map((item) => (
                    <tr key={item.employee.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                            {item.employee.avatar.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.employee.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.employee.code}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-800">
                        {item.baseSalary.toLocaleString()} ج.م
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-lg border text-[11px] font-bold font-mono inline-flex items-center gap-1.5 ${item.ratingInfo.badgeBg}`}>
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>{item.ratingInfo.score}% ({item.ratingInfo.stars}★)</span>
                        </span>
                      </td>

                      <td className="p-3 text-[11px]">
                        <div className="font-medium text-slate-700">
                          {item.workedDays} يوم حضور ({item.workedHours} ساعة)
                        </div>
                        {item.lateMinutes > 0 && (
                          <div className="text-amber-700 text-[10px] font-bold">
                            تأخيرات: {item.lateMinutes} دقيقة
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-[11px]">
                        {item.targetBonus > 0 && (
                          <div className="text-emerald-700 font-bold">
                            🎁 حافز تارجت: +{item.targetBonus.toLocaleString()} ج.م
                          </div>
                        )}
                        {item.commission > 0 && (
                          <div className="text-sky-700 font-medium">
                            💼 عمولة بيع: +{item.commission.toLocaleString()} ج.م
                          </div>
                        )}
                        {item.targetBonus === 0 && item.commission === 0 && (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="p-3 font-mono font-bold text-emerald-700">
                        {item.extraBonuses > 0 ? `+${item.extraBonuses.toLocaleString()} ج.م` : '-'}
                      </td>

                      <td className="p-3 font-mono font-bold text-rose-700">
                        {item.totalDeductions > 0 ? `-${item.totalDeductions.toLocaleString()} ج.م` : '-'}
                      </td>

                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-black text-xs px-2.5 py-1 rounded-lg inline-block">
                          {item.netSalary.toLocaleString()} ج.م
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedPayslipData(item)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition-all flex items-center gap-1.5 mx-auto shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>طباعة كشف الراتب</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attendance & Clock-In Today Widget */}
      {(activeTab === 'all' || activeTab === 'attendance') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">
                  حالة الحضور والانصراف اليومية ({new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                تسجيل فوري لحضور وانصراف الموظفين، احتساب التأخيرات وتطبيق الجزاءات أو المكافآت التلقائية على المرتب.
              </p>
            </div>

            {!isReadOnly && (
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل حضور/غياب يدوي</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {employees.map((emp) => {
              const todayDateStr = new Date().toISOString().slice(0, 10);
              const todayRec = attendanceRecords.find(
                (r) => r.employeeId === emp.id && r.date === todayDateStr
              );

              return (
                <div
                  key={emp.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                        {emp.avatar.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{emp.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{emp.code}</div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {todayRec ? (
                      todayRec.status === 'present' ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                          حاضر ({todayRec.checkInTime})
                        </span>
                      ) : todayRec.status === 'late' ? (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                          متأخر ({todayRec.checkInTime})
                        </span>
                      ) : todayRec.status === 'absent' ? (
                        <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                          غائب
                        </span>
                      ) : (
                        <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                          إجازة
                        </span>
                      )
                    ) : (
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap">
                        لم يسجل حضور
                      </span>
                    )}
                  </div>

                  {/* Worked Hours Pill if Checked Out */}
                  {todayRec && todayRec.checkInTime && todayRec.checkOutTime && (
                    <div className="bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] text-center font-mono font-bold text-emerald-900 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>ساعات العمل:</span>
                      </span>
                      <span>{todayRec.workHours || todayRec.workingHours || 8} ساعة ({todayRec.checkInTime} - {todayRec.checkOutTime})</span>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  {!isReadOnly && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200">
                      {!todayRec || !todayRec.checkInTime ? (
                        <button
                          onClick={() => checkInEmployee(emp.id)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>تسجيل حضور</span>
                        </button>
                      ) : !todayRec.checkOutTime ? (
                        <button
                          onClick={() => handlePrepareCheckOut(emp, todayRec)}
                          className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>تسجيل انصراف ({todayRec.checkInTime})</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => checkInEmployee(emp.id)}
                          className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs"
                          title="إلغاء الانصراف والتسجيل لحضور شيفت جديد"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>تسجيل حضور شيفت جديد</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section: Worked Hours & Shift Log Report */}
      {(activeTab === 'all' || activeTab === 'hours') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  كشف وتقارير ساعات العمل التفصيلية لكل موظف (Worked Hours Report)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                متابعة تفصيلية لكل شيفت وساعات العمل اليومية المحسوبة فور الخروج مع إمكانية الفلترة والطباعة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={hoursEmpFilter}
                onChange={(e) => setHoursEmpFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900"
              >
                <option value="all">كل الموظفين ({employees.length})</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.code})
                  </option>
                ))}
              </select>

              <select
                value={hoursMonthFilter}
                onChange={(e) => setHoursMonthFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 font-mono"
              >
                <option value="2026-10">أكتوبر 2026</option>
                <option value="2026-09">سبتمبر 2026</option>
                <option value="2026-08">أغسطس 2026</option>
              </select>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>طباعة تقرير الساعات</span>
              </button>
            </div>
          </div>

          {/* Worked Hours Summary KPI Cards */}
          {(() => {
            const filteredAtt = attendanceRecords.filter((r) => {
              const matchEmp = hoursEmpFilter === 'all' || r.employeeId === hoursEmpFilter;
              const matchMonth = r.date.startsWith(hoursMonthFilter);
              return matchEmp && matchMonth;
            });

            const totalHours = filteredAtt.reduce(
              (sum, r) => sum + (r.workingHours || r.workHours || (r.checkInTime && r.checkOutTime ? 8 : 0)),
              0
            );

            const totalShifts = filteredAtt.filter((r) => r.status === 'present' || r.status === 'late').length;
            const avgDailyHours = totalShifts > 0 ? (totalHours / totalShifts).toFixed(1) : '0';
            const overtimeHours = filteredAtt.reduce((sum, r) => {
              const h = r.workingHours || r.workHours || 8;
              return sum + Math.max(0, h - 8);
            }, 0);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-800 block">إجمالي ساعات العمل المسجلة</span>
                  <div className="text-xl font-black text-indigo-950 font-mono">
                    {totalHours.toLocaleString()} <span className="text-xs text-indigo-700">ساعة</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 block">عدد أيام/شيفتات الحضور</span>
                  <div className="text-xl font-black text-emerald-950 font-mono">
                    {totalShifts} <span className="text-xs text-emerald-700">شيفت</span>
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-sky-800 block">متوسط الساعات اليومية</span>
                  <div className="text-xl font-black text-sky-950 font-mono">
                    {avgDailyHours} <span className="text-xs text-sky-700">ساعة/شيفت</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-amber-800 block">ساعات الإضافي (Overtime)</span>
                  <div className="text-xl font-black text-amber-950 font-mono">
                    +{overtimeHours} <span className="text-xs text-amber-700">ساعة</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Detailed Shift Hours Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">التاريخ واليوم</th>
                    <th className="p-3">اسم الموظف والكود</th>
                    <th className="p-3">وقت الحضور</th>
                    <th className="p-3">وقت الانصراف</th>
                    <th className="p-3 font-black text-slate-900">ساعات العمل اليومية</th>
                    <th className="p-3">حالة الشيفت والتأخيرات</th>
                    <th className="p-3">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attendanceRecords
                    .filter((r) => {
                      const matchEmp = hoursEmpFilter === 'all' || r.employeeId === hoursEmpFilter;
                      const matchMonth = r.date.startsWith(hoursMonthFilter);
                      return matchEmp && matchMonth;
                    })
                    .length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        لا توجد سجلات ساعات عمل مسجلة في هذه الفترة تطابق الاختيار.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords
                      .filter((r) => {
                        const matchEmp = hoursEmpFilter === 'all' || r.employeeId === hoursEmpFilter;
                        const matchMonth = r.date.startsWith(hoursMonthFilter);
                        return matchEmp && matchMonth;
                      })
                      .map((r) => {
                        const emp = employees.find((e) => e.id === r.employeeId);
                        const hours = r.workingHours || r.workHours || (r.checkInTime && r.checkOutTime ? 8 : 0);
                        const isOvertime = hours > 8;

                        return (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono font-bold text-slate-800">
                              {r.date}
                            </td>

                            <td className="p-3 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                                  {r.employeeName.slice(0, 1)}
                                </div>
                                <span>{r.employeeName}</span>
                                <span className="text-[10px] font-mono text-slate-400">({emp?.code || '—'})</span>
                              </div>
                            </td>

                            <td className="p-3 font-mono text-emerald-700 font-bold">
                              {r.checkInTime ? `🟢 ${r.checkInTime}` : '—'}
                            </td>

                            <td className="p-3 font-mono text-sky-700 font-bold">
                              {r.checkOutTime ? `🔴 ${r.checkOutTime}` : 'جاري العمل...'}
                            </td>

                            <td className="p-3 font-mono font-black text-sm">
                              <span className={`px-2.5 py-1 rounded-lg border inline-block ${
                                isOvertime
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {hours} ساعة {isOvertime && `(إضافي +${(hours - 8).toFixed(1)}س)`}
                              </span>
                            </td>

                            <td className="p-3">
                              {r.status === 'present' ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  حضور بموعده
                                </span>
                              ) : r.status === 'late' ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  متأخر ({r.lateMinutes || r.latenessMinutes} دقيقة)
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  غائب
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-slate-500 text-[11px]">
                              {r.notes || '—'}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Section: Employee Hours Lookup by Code & Specific Date */}
      {(activeTab === 'all' || activeTab === 'employeeHours') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>استعلام ساعات العمل للموظف بالكود واليوم المحدد</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                أدخل كود الموظف لمعرفة إجمالي عدد الساعات المسجلة، ومعرفة ساعات العمل في أي يوم محدد.
              </p>
            </div>
            {queryEmpCode && (
              <button
                type="button"
                onClick={() => {
                  setQueryEmpCode('');
                  setQuerySpecificDate('');
                }}
                className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 self-start sm:self-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>مسح الاستعلام</span>
              </button>
            )}
          </div>

          {/* Search Box & Quick Chips */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={queryEmpCode}
                  onChange={(e) => setQueryEmpCode(e.target.value)}
                  placeholder="اكتب كود الموظف (مثال: EMP001)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-8 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
                {queryEmpCode && (
                  <button
                    type="button"
                    onClick={() => setQueryEmpCode('')}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Pick Employee Codes */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500">اختر موظف سريعاً:</span>
              {employees.slice(0, 8).map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setQueryEmpCode(emp.code)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-all flex items-center gap-1.5 ${
                    queryEmpCode.trim().toLowerCase() === emp.code.toLowerCase()
                      ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-sans">{emp.name.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-75">({emp.code})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Employee Results */}
          {!queryEmpCode.trim() ? (
            <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">في انتظار إدخال كود الموظف</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                قم بكتابة كود الموظف في الخانة أعلاه أو اضغط على أي كود من الأزرار السريعة لعرض تفاصيل ساعات العمل المسجلة والبحث بالتاريخ.
              </p>
            </div>
          ) : (() => {
            const cleanQuery = queryEmpCode.trim().toLowerCase();
            const emp = employees.find(
              (e) => e.code.toLowerCase() === cleanQuery || e.id.toLowerCase() === cleanQuery
            );

            if (!emp) {
              return (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center space-y-1">
                  <p className="text-xs font-bold text-rose-800">
                    لم يتم العثور على موظف بالكود &quot;{queryEmpCode}&quot;
                  </p>
                  <p className="text-[11px] text-rose-600">
                    يرجى التأكد من صحة الكود المسجل في بطاقة الموظف أو اختياره من القائمة السريعة أعلاه.
                  </p>
                </div>
              );
            }

            const empAtt = attendanceRecords.filter((r) => r.employeeId === emp.id);
            const totalHours = empAtt.reduce(
              (sum, r) => sum + (r.workingHours || r.workHours || (r.checkInTime && r.checkOutTime ? 8 : 0)),
              0
            );
            const totalShifts = empAtt.filter((r) => r.status === 'present' || r.status === 'late').length;
            const avgDailyHours = totalShifts > 0 ? (totalHours / totalShifts).toFixed(1) : '0';
            const overtimeHours = empAtt.reduce((sum, r) => {
              const h = r.workingHours || r.workHours || 8;
              return sum + Math.max(0, h - 8);
            }, 0);

            // Specific Date Query
            const targetDateRecord = querySpecificDate
              ? empAtt.find((r) => r.date === querySpecificDate)
              : null;

            return (
              <div className="space-y-5 animate-fadeIn">
                {/* Employee Profile Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg font-black font-mono">
                      {emp.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black">{emp.name}</h4>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-medium">
                          {emp.role === 'manager'
                            ? 'مدير فرع'
                            : emp.role === 'cashier'
                            ? 'كاشير'
                            : 'بائع'}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100 flex items-center gap-2 mt-0.5 font-mono">
                        <span>هاتف: {emp.phone || 'غير مسجل'}</span>
                        <span>•</span>
                        <span>تاريخ التعيين: {emp.joinDate || '—'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl px-4 py-2 border border-white/15 text-center sm:text-left">
                    <span className="text-[10px] text-emerald-100 block">إجمالي الساعات المسجلة</span>
                    <span className="text-2xl font-black font-mono text-amber-300">
                      {totalHours.toLocaleString()}
                    </span>
                    <span className="text-xs text-white mr-1">ساعة</span>
                  </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">إجمالي ساعات العمل</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {totalHours} <span className="text-xs font-normal text-slate-500">ساعة</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">عدد أيام / شفتات العمل</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {totalShifts} <span className="text-xs font-normal text-slate-500">يوم</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">متوسط الساعات اليومية</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {avgDailyHours} <span className="text-xs font-normal text-slate-500">ساعة/يوم</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">ساعات العمل الإضافي</span>
                    <div className="text-lg font-black text-amber-600 font-mono">
                      +{overtimeHours} <span className="text-xs font-normal text-slate-500">ساعة</span>
                    </div>
                  </div>
                </div>

                {/* Specific Date Query Box ("اشتغل كام ساعة يوم كذا") */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-black text-amber-950">
                        استعلام ساعات العمل في يوم محدد (اشتغل كام ساعة يوم كذا؟)
                      </span>
                    </div>
                    {querySpecificDate && (
                      <button
                        type="button"
                        onClick={() => setQuerySpecificDate('')}
                        className="text-[11px] text-amber-800 hover:text-amber-950 underline self-start sm:self-auto"
                      >
                        إلغاء تحديد اليوم
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <label className="text-xs text-slate-700 font-bold whitespace-nowrap">
                      اختر التاريخ المطلوب:
                    </label>
                    <input
                      type="date"
                      value={querySpecificDate}
                      onChange={(e) => setQuerySpecificDate(e.target.value)}
                      className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-xs"
                    />

                    {/* Quick date chips from recorded history */}
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="text-[10px] text-amber-800 font-medium">أيام مسجلة للموظف:</span>
                      {empAtt.slice(0, 5).map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setQuerySpecificDate(r.date)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-colors ${
                            querySpecificDate === r.date
                              ? 'bg-amber-600 text-white border-amber-600 font-bold'
                              : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {r.date}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Display Specific Date Query Result */}
                  {querySpecificDate ? (
                    targetDateRecord ? (
                      <div className="bg-white border-2 border-emerald-500 rounded-xl p-3.5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-slate-900">
                              ساعات العمل في يوم {querySpecificDate} ({new Date(querySpecificDate).toLocaleDateString('ar-EG', { weekday: 'long' })}):
                            </span>
                          </div>
                          <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-2.5 py-1 rounded-full font-mono">
                            {targetDateRecord.workingHours || targetDateRecord.workHours || 8} ساعة عمل
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-500 block">وقت تسجيل الحضور:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {targetDateRecord.checkInTime || '09:00 ص'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">وقت تسجيل الانصراف:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {targetDateRecord.checkOutTime || '05:00 م'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">حالة الحضور:</span>
                            <span
                              className={`font-bold inline-block px-1.5 py-0.5 rounded text-[10px] ${
                                targetDateRecord.status === 'present'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : targetDateRecord.status === 'late'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {targetDateRecord.status === 'present'
                                ? 'حاضر في الموعد'
                                : targetDateRecord.status === 'late'
                                ? `متأخر (${targetDateRecord.lateMinutes || 15} دقيقة)`
                                : 'غائب'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">الملاحظات:</span>
                            <span className="text-slate-600 text-[11px]">
                              {targetDateRecord.notes || 'لا توجد ملاحظات'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          لم يتم تسجيل حضور للموظف <strong>{emp.name}</strong> في تاريخ <strong>{querySpecificDate}</strong> (قد يكون يوم إجازة أسبوعية أو غياب).
                        </span>
                      </div>
                    )
                  ) : (
                    <p className="text-[11px] text-amber-800/80">
                      💡 اختر تاريخاً من التقويم أو اضغط على أحد التواريخ السريعة أعلاه لمعرفة كم ساعة اشتغل في ذلك اليوم بدقة.
                    </p>
                  )}
                </div>

                {/* Attendance & Hours History Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>جدول كل أيام العمل وساعات الدوام للموظف ({empAtt.length} يوم)</span>
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">التاريخ واليوم</th>
                            <th className="p-2.5">وقت الحضور</th>
                            <th className="p-2.5">وقت الانصراف</th>
                            <th className="p-2.5 font-black text-slate-900">ساعات العمل</th>
                            <th className="p-2.5">الحالة</th>
                            <th className="p-2.5">ملاحظات</th>
                            <th className="p-2.5 text-center">استعلام اليوم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {empAtt.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-400">
                                لا توجد سجلات حضور مسجلة لهذا الموظف حتى الآن.
                              </td>
                            </tr>
                          ) : (
                            empAtt.map((r) => {
                              const hours = r.workingHours || r.workHours || (r.checkInTime && r.checkOutTime ? 8 : 0);
                              const isSelectedDate = querySpecificDate === r.date;
                              return (
                                <tr
                                  key={r.id}
                                  className={`hover:bg-slate-50 transition-colors ${
                                    isSelectedDate ? 'bg-amber-50/70 font-semibold' : ''
                                  }`}
                                >
                                  <td className="p-2.5 font-mono">
                                    <div className="font-bold text-slate-900">{r.date}</div>
                                    <div className="text-[10px] text-slate-500 font-sans">
                                      {new Date(r.date).toLocaleDateString('ar-EG', { weekday: 'long' })}
                                    </div>
                                  </td>
                                  <td className="p-2.5 font-mono text-slate-700">
                                    {r.checkInTime || '09:00 ص'}
                                  </td>
                                  <td className="p-2.5 font-mono text-slate-700">
                                    {r.checkOutTime || '05:00 م'}
                                  </td>
                                  <td className="p-2.5 font-mono font-bold text-emerald-700">
                                    {hours} ساعة
                                    {hours > 8 && (
                                      <span className="text-[10px] text-amber-600 block">
                                        (+{hours - 8} إضافي)
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                                        r.status === 'present'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : r.status === 'late'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {r.status === 'present'
                                        ? 'حاضر'
                                        : r.status === 'late'
                                        ? `متأخر (${r.lateMinutes || 15}د)`
                                        : 'غائب'}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-slate-500 text-[11px]">
                                    {r.notes || '—'}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setQuerySpecificDate(r.date)}
                                      className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                                        isSelectedDate
                                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {isSelectedDate ? 'محدد حالياً' : 'عرض هذا اليوم'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Main List & Directory Filters */}
      {(activeTab === 'all' || activeTab === 'directory') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedRoleFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الكل ({employees.length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('salesman')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedRoleFilter === 'salesman'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              البائعين
            </button>
            <button
              onClick={() => setSelectedRoleFilter('cashier')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedRoleFilter === 'cashier'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الكاشير
            </button>
            <button
              onClick={() => setSelectedRoleFilter('manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedRoleFilter === 'manager'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              المديرين
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف أو الكود..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
        </div>

        {/* Employees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const isCurrentUser = emp.id === currentUser.id;
            return (
              <div
                key={emp.id}
                className={`bg-slate-50 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  isCurrentUser
                    ? 'border-amber-400 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-950 text-sm shadow-xs">
                        {emp.avatar.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">{emp.name}</h4>
                          {isCurrentUser && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-bold">
                              الحالي
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 font-medium">
                          {emp.code}
                        </span>
                      </div>
                    </div>

                    <div>{getRoleBadge(emp.role)}</div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>الهاتف:</span>
                      </span>
                      <span className="font-mono text-slate-900 font-bold">{emp.phone}</span>
                    </div>

                    {emp.nationalId && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">الرقم القومي:</span>
                        <span className="font-mono text-slate-700">{emp.nationalId}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>كود PIN السري:</span>
                      </span>
                      <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                        {emp.pinCode || emp.code || '1234'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-amber-600" />
                        <span>التارجت الشهري:</span>
                      </span>
                      <span className="font-mono font-bold text-amber-600">
                        {(emp.monthlyTarget ?? 0).toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">المبيعات المحققة:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {(emp.currentSales ?? 0).toLocaleString()} ج.م
                        <span className="text-[10px] text-slate-500 mr-1">
                          ({Math.round(((emp.currentSales ?? 0) / (emp.monthlyTarget || 1)) * 100)}%)
                        </span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="text-slate-500 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-sky-600" />
                        <span>المرتب الأساسي:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {(emp.salary ?? 6000).toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">حافز تحقيق التارجت:</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {emp.targetBonusPercent || 20}% من المرتب ({Math.round(((emp.salary ?? 6000) * (emp.targetBonusPercent || 20)) / 100).toLocaleString()} ج.م)
                      </span>
                    </div>

                    {/* Attendance Monthly Summary Badges */}
                    {(() => {
                      const empAtt = attendanceRecords.filter((r) => r.employeeId === emp.id);
                      const presentDays = empAtt.filter((r) => r.status === 'present' || r.status === 'late').length;
                      const totalLateMins = empAtt.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
                      const absentDays = empAtt.filter((r) => r.status === 'absent').length;

                      return (
                        <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100 text-[10px]">
                          <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg text-center">
                            <div className="text-slate-500 font-medium">الحضور</div>
                            <div className="font-mono font-bold text-emerald-800">{presentDays} يوم</div>
                          </div>
                          <div className="bg-amber-50 border border-amber-200 p-1.5 rounded-lg text-center">
                            <div className="text-slate-500 font-medium font-medium">التأخيرات</div>
                            <div className="font-mono font-bold text-amber-800">{totalLateMins} دقيقة</div>
                          </div>
                          <div className="bg-rose-50 border border-rose-200 p-1.5 rounded-lg text-center">
                            <div className="text-slate-500 font-medium">الغياب</div>
                            <div className="font-mono font-bold text-rose-800">{absentDays} يوم</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Bonus & Deduction Summary Badges */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                      <div className="bg-emerald-50/80 border border-emerald-200 px-2 py-1 rounded-lg flex items-center justify-between">
                        <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                          🎁 مكافآت:
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-700">
                          +{(emp.totalBonuses || 0).toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="bg-rose-50/80 border border-rose-200 px-2 py-1 rounded-lg flex items-center justify-between">
                        <span className="text-[10px] text-rose-800 font-bold flex items-center gap-1">
                          ⚠️ خصومات:
                        </span>
                        <span className="font-mono text-xs font-black text-rose-700">
                          -{(emp.totalDeductions || 0).toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>

                    {/* Monthly Performance Evaluation Badge */}
                    {(() => {
                      const rating = calculatePerformanceRating(emp, attendanceRecords, selectedPayrollMonth);
                      return (
                        <div className={`p-2 rounded-xl border flex items-center justify-between text-xs mt-1 ${rating.badgeBg}`}>
                          <div>
                            <div className="font-bold text-[11px] flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>تقييم الأداء الشهري:</span>
                            </div>
                            <div className="text-[10px] opacity-80 mt-0.5 font-mono">
                              مبيعات: {rating.salesScore}/32 | ساعات: {rating.hoursScore}/30 | انضباط: {rating.punctualityScore}/30
                            </div>
                          </div>
                          <div className="text-left font-mono">
                            <div className="font-black text-sm">{rating.score}%</div>
                            <div className="text-[9px] font-bold whitespace-nowrap">{rating.label}</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Calculated Net Salary Indicator */}
                    {(() => {
                      const empAtt = attendanceRecords.filter((r) => r.employeeId === emp.id);
                      const autoAttDeductions = empAtt.reduce((sum, r) => sum + (r.autoDeductionAmount || 0), 0);
                      const totalDeductionVal = (emp.totalDeductions || 0) + autoAttDeductions;

                      const isTargetDone = (emp.currentSales ?? 0) >= (emp.monthlyTarget ?? 0);
                      const targetBonusVal = isTargetDone ? Math.round(((emp.salary ?? 6000) * (emp.targetBonusPercent || 20)) / 100) : 0;
                      const estimatedNetSalary = (emp.salary ?? 6000) + targetBonusVal + (emp.totalBonuses || 0) - totalDeductionVal;

                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl flex items-center justify-between mt-1.5 shadow-xs">
                          <div>
                            <div className="text-[11px] font-bold text-amber-400">صافي مستحق الموظف:</div>
                            <div className="text-[9px] text-slate-400">شامل التارجت والمكافآت وتأخيرات الحضور</div>
                          </div>
                          <span className="font-mono text-sm font-black text-emerald-400">
                            {estimatedNetSalary.toLocaleString()} ج.م
                          </span>
                        </div>
                      );
                    })()}

                    <div className="mt-1">
                      {(emp.currentSales ?? 0) >= (emp.monthlyTarget ?? 0) ? (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center justify-between">
                          <span>🎉 تم إنجاز التارجت بنجاح!</span>
                          <span className="font-mono">+{Math.round(((emp.salary ?? 6000) * (emp.targetBonusPercent || 20)) / 100).toLocaleString()} ج.م</span>
                        </div>
                      ) : (
                        <div className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2 py-1 rounded-lg flex items-center justify-between">
                          <span>متبقي لتحقيق التارجت:</span>
                          <span className="font-mono text-amber-700 font-bold">
                            {Math.max(0, (emp.monthlyTarget ?? 0) - (emp.currentSales ?? 0)).toLocaleString()} ج.م
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-slate-200">
                  {/* Action Buttons Row 1: Bonus & Deduction */}
                  {!isReadOnly && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenAdjustmentModal(emp, 'bonus')}
                        className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة مكافأة</span>
                      </button>

                      <button
                        onClick={() => handleOpenAdjustmentModal(emp, 'deduction')}
                        className="py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إضافة خصم</span>
                      </button>
                    </div>
                  )}

                  {/* Action Buttons Row 2: Operations, Edit, Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedLogEmpId(emp.id);
                        document.getElementById('employee-audit-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>السجل</span>
                    </button>

                    {!isReadOnly && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="py-1.5 px-3 bg-white hover:bg-slate-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 text-sky-600" />
                          <span>تعديل</span>
                        </button>

                        <button
                          onClick={() => handleOpenDeleteModal(emp)}
                          className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          title="حذف الموظف نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>حذف نهائي</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Operations Log & Individual Audit Control Section */}
      {(activeTab === 'all' || activeTab === 'logs') && (
        <div id="employee-audit-section" className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                سجل العمليات والرقابة التفصيلية لكل موظف (Individual Operations Audit)
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              تتبع فوري ومستقل لكافة تحركات الموظف (المبيعات المنفذة، الخصومات الممنوحة، المرتجعات المترتبة، وتعديلات أسعار/كميات المخزون) لضمان الشفافية والانضباط.
            </p>
          </div>

          {/* Quick Summary Cards for selected filter */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="bg-slate-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-[10px] text-slate-500">المبيعات:</div>
                <div className="font-mono font-bold text-emerald-700 text-xs">
                  {selectedEmpStats.salesCount} عملية ({selectedEmpStats.salesTotal.toLocaleString()} ج.م)
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-[10px] text-slate-500">إجمالي الخصومات:</div>
                <div className="font-mono font-bold text-amber-700 text-xs">
                  {selectedEmpStats.discountsCount} خصم ({selectedEmpStats.discountsTotal.toLocaleString()} ج.م)
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-rose-200 p-2.5 rounded-xl flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <div>
                <div className="text-[10px] text-slate-500">المرتجعات:</div>
                <div className="font-mono font-bold text-rose-700 text-xs">
                  {selectedEmpStats.returnsCount} مرتجع ({selectedEmpStats.returnsTotal.toLocaleString()} ج.م)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <label className="text-[11px] text-slate-600 font-bold block mb-1">تحديد الموظف للرقابة:</label>
            <select
              value={selectedLogEmpId}
              onChange={(e) => setSelectedLogEmpId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">كل طاقم العمل ({employees.length} موظف)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role === 'manager' ? 'مدير' : emp.role === 'cashier' ? 'كاشير' : 'بائع'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-600 font-bold block mb-1">نوع العملية:</label>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">جميع أنواع العمليات</option>
              <option value="sale">🛍️ المبيعات والفواتير الصادرة</option>
              <option value="discount">🏷️ الخصومات والتخفيضات الممنوحة</option>
              <option value="stock">📦 تعديلات المخزون والأسعار اليدوية</option>
              <option value="return">🔄 عمليات المرتجع والاسترجاع</option>
              <option value="audit">🔒 السجلات والقرارات الحساسة</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-600 font-bold block mb-1">بحث في تفاصيل السجل:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="بحث برقم الفاتورة، السبب، أو النص..."
                className="w-full bg-white border border-slate-300 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Detailed Operations Log Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">التاريخ والوقت</th>
                <th className="py-3 px-3">الموظف القائم بالعملية</th>
                <th className="py-3 px-3">نوع النشاط</th>
                <th className="py-3 px-3">عنوان العملية</th>
                <th className="py-3 px-3">التفاصيل والبيانات المحاسبية</th>
                <th className="py-3 px-3 text-center">الاعتماد والأمان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredOperationsLog.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    لا توجد سجلات عمليات مطابقة للفلاتر المختارة حالياً.
                  </td>
                </tr>
              ) : (
                filteredOperationsLog.map((item) => {
                  const dateObj = new Date(item.date);
                  const formattedDate = dateObj.toLocaleDateString('ar-EG');
                  const formattedTime = dateObj.toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                        <div>{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">{formattedTime}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{item.employeeName}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.category === 'sale' && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                            <ShoppingBag className="w-3 h-3 text-emerald-600" />
                            <span>{item.categoryLabel}</span>
                          </span>
                        )}
                        {item.category === 'discount' && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                            <Tag className="w-3 h-3 text-amber-600" />
                            <span>{item.categoryLabel}</span>
                          </span>
                        )}
                        {item.category === 'stock' && (
                          <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                            <Package className="w-3 h-3 text-sky-600" />
                            <span>{item.categoryLabel}</span>
                          </span>
                        )}
                        {item.category === 'return' && (
                          <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                            <RotateCcw className="w-3 h-3 text-rose-600" />
                            <span>{item.categoryLabel}</span>
                          </span>
                        )}
                        {item.category === 'audit' && (
                          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                            <ShieldAlert className="w-3 h-3 text-purple-600" />
                            <span>{item.categoryLabel}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {item.title}
                      </td>

                      <td className="py-3 px-3 text-slate-600 max-w-md leading-relaxed">
                        {item.details}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.approvedBy ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg font-mono font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>موافق عليه: {item.approvedBy}</span>
                          </span>
                        ) : item.severity === 'critical' || item.severity === 'sensitive' ? (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-lg font-mono font-bold inline-flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>يتطلب تصريح PIN</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">عملية قياسية</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Section: Bonuses & Deductions History Log Table */}
      {(activeTab === 'all' || activeTab === 'adjustments') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>سجل وسجل المكافآت والخصومات المسجلة (Bonuses & Deductions Log)</span>
            </h3>
            <p className="text-xs text-slate-500">
              عرض كافة حركات الخصومات والجزاءات والمكافآت المالية المسجلة لكل موظف بالتفصيل.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={adjFilterEmpId}
              onChange={(e) => setAdjFilterEmpId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium"
            >
              <option value="all">كل الموظفين ({employees.length})</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>

            <select
              value={adjFilterType}
              onChange={(e) => setAdjFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium"
            >
              <option value="all">جميع الحركات (مكافآت وخصومات)</option>
              <option value="bonus">🎁 مكافآت فقط</option>
              <option value="deduction">⚠️ خصومات فقط</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">التاريخ والوقت</th>
                <th className="py-2.5 px-3">اسم الموظف</th>
                <th className="py-2.5 px-3">نوع الحركة</th>
                <th className="py-2.5 px-3">المبلغ (ج.م)</th>
                <th className="py-2.5 px-3">السبب / البيان</th>
                <th className="py-2.5 px-3 text-center">بواسطة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeAdjustments
                .filter((adj) => {
                  const matchEmp = adjFilterEmpId === 'all' || adj.employeeId === adjFilterEmpId;
                  const matchType = adjFilterType === 'all' || adj.type === adjFilterType;
                  return matchEmp && matchType;
                })
                .length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    لا توجد مكافآت أو خصومات مسجلة تطابق التصفية حتى الآن.
                  </td>
                </tr>
              ) : (
                employeeAdjustments
                  .filter((adj) => {
                    const matchEmp = adjFilterEmpId === 'all' || adj.employeeId === adjFilterEmpId;
                    const matchType = adjFilterType === 'all' || adj.type === adjFilterType;
                    return matchEmp && matchType;
                  })
                  .map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(adj.date).toLocaleDateString('ar-EG')} - {new Date(adj.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {adj.employeeName}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {adj.type === 'bonus' ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <span>🎁 مكافأة إضافية</span>
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <span>⚠️ خصم جزائي</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-sm whitespace-nowrap">
                        {adj.type === 'bonus' ? (
                          <span className="text-emerald-700">+{adj.amount.toLocaleString()} ج.م</span>
                        ) : (
                          <span className="text-rose-700">-{adj.amount.toLocaleString()} ج.م</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs leading-relaxed">
                        {adj.reason}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {adj.recordedBy}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Section: Automated Payroll Sheet Table (مسير الرواتب الآلي المرتبط بالحضور والتارجت) */}
      {(activeTab === 'all' || activeTab === 'payroll') && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>مسير الرواتب والمكافآت التلقائي المرتبط بالحضور والتارجت (Automated Payroll Sheet)</span>
            </h3>
            <p className="text-xs text-slate-400">
              احتساب كشف الرواتب الشامل فورياً بحساب الساعات الإضافية، الخصومات التلقائية للتأخير، وحوافز التارجت.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 font-bold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span>إجمالي الرواتب الصافية المستحقة:</span>
            <span className="text-sm">
              {employees
                .reduce((acc, emp) => {
                  const isAchieved = (emp.currentSales ?? 0) >= (emp.monthlyTarget ?? 0);
                  const targetBonus = isAchieved ? Math.round(((emp.salary ?? 6000) * (emp.targetBonusPercent || 20)) / 100) : 0;
                  const empAtt = attendanceRecords.filter((r) => r.employeeId === emp.id);
                  const overtimeHrs = empAtt.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
                  const lateMins = empAtt.reduce((sum, r) => sum + (r.lateMinutes || r.latenessMinutes || 0), 0);
                  const hourly = Math.round((emp.salary || 6000) / 200);
                  const overtimePay = Math.round(overtimeHrs * hourly * 1.5);
                  const lateDeduct = Math.round((lateMins / 60) * hourly);
                  const net = (emp.salary || 6000) + targetBonus + overtimePay + (emp.totalBonuses || 0) - lateDeduct - (emp.totalDeductions || 0);
                  return acc + Math.max(0, net);
                }, 0)
                .toLocaleString()} ج.م
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
                <th className="py-2.5 px-3">الموظف</th>
                <th className="py-2.5 px-3">الأساسي</th>
                <th className="py-2.5 px-3">حافز التارجت</th>
                <th className="py-2.5 px-3">ساعات الإضافي</th>
                <th className="py-2.5 px-3">تأخيرات (خصم)</th>
                <th className="py-2.5 px-3">مكافآت أخرى</th>
                <th className="py-2.5 px-3">خصومات أخرى</th>
                <th className="py-2.5 px-3 text-left">صافي المستحق النهائي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {employees.map((emp) => {
                const isTargetAchieved = (emp.currentSales ?? 0) >= (emp.monthlyTarget ?? 0);
                const targetBonusVal = isTargetAchieved
                  ? Math.round(((emp.salary ?? 6000) * (emp.targetBonusPercent || 20)) / 100)
                  : 0;

                const empAtt = attendanceRecords.filter((r) => r.employeeId === emp.id);
                const overtimeHrs = empAtt.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
                const lateMins = empAtt.reduce((sum, r) => sum + (r.lateMinutes || r.latenessMinutes || 0), 0);

                const hourlyRate = Math.round((emp.salary || 6000) / 200);
                const overtimePay = Math.round(overtimeHrs * hourlyRate * 1.5);
                const latenessDeduction = Math.round((lateMins / 60) * hourlyRate);

                const extraBonuses = emp.totalBonuses || 0;
                const extraDeductions = emp.totalDeductions || 0;

                const netSalary = Math.max(
                  0,
                  (emp.salary || 6000) + targetBonusVal + overtimePay + extraBonuses - latenessDeduction - extraDeductions
                );

                return (
                  <tr key={emp.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px]">
                          {emp.name.slice(0, 1)}
                        </div>
                        <span>{emp.name}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {(emp.salary || 6000).toLocaleString()} ج.م
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      {isTargetAchieved ? (
                        <span className="text-emerald-400 font-bold">
                          +{targetBonusVal.toLocaleString()} ج.م (100%🎯)
                        </span>
                      ) : (
                        <span className="text-slate-500">0 ج.م</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-emerald-400">
                      {overtimeHrs > 0 ? (
                        <span>+{overtimePay.toLocaleString()} ج.م ({overtimeHrs} ساعة)</span>
                      ) : (
                        <span className="text-slate-500">0 ساعة</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-rose-400">
                      {lateMins > 0 ? (
                        <span>-{latenessDeduction.toLocaleString()} ج.م ({lateMins} د)</span>
                      ) : (
                        <span className="text-slate-500">0 دقيقة</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-emerald-400">
                      +{extraBonuses.toLocaleString()} ج.م
                    </td>

                    <td className="py-2.5 px-3 font-mono text-rose-400">
                      -{extraDeductions.toLocaleString()} ج.م
                    </td>

                    <td className="py-2.5 px-3 text-left font-mono font-black text-sm text-emerald-400 bg-slate-800/80 rounded-lg">
                      {netSalary.toLocaleString()} ج.م
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Bonus & Deduction Modal */}
      {showAdjustmentModal && targetEmpForAdjustment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {adjustmentType === 'bonus' ? (
                  <>
                    <Plus className="w-5 h-5 text-emerald-600" />
                    <span>تسجيل مكافأة للموظف: {targetEmpForAdjustment.name}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 text-amber-600" />
                    <span>تسجيل خصم على الموظف: {targetEmpForAdjustment.name}</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  نوع الإجراء
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('bonus');
                      setAdjustmentReason('مكافأة تميز وإنجاز');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      adjustmentType === 'bonus'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>🎁 مكافأة (حافز)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('deduction');
                      setAdjustmentReason('خصم تأخير / مخالفة');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      adjustmentType === 'deduction'
                        ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>⚠️ خصم (جزاء)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  المبلغ بالجنيه (EGP) *
                </label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  required
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  السبب / بيان التفاصيل *
                </label>
                <textarea
                  rows={3}
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="ادخل سبب المكافأة أو الخصم..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs transition-colors shadow-xs ${
                    adjustmentType === 'bonus'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {adjustmentType === 'bonus' ? 'حفظ المكافأة' : 'حفظ الخصم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Employee Permanent Confirmation Modal */}
      {showDeleteModal && empToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">حذف الموظف نهائياً من قاعدة البيانات</h3>
                <p className="text-xs text-rose-700 font-medium">تحذير: هذا الإجراء غير قابل للتراجع نهائياً!</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-slate-800 space-y-2">
              <p>
                هل أنت متأكد من حذف الموظف <strong className="text-rose-900 font-bold">{empToDelete.name}</strong> (كود: {empToDelete.code})؟
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                سيتم مسح حساب الموظف، كوده، وصلاحياته وسجل العمولات/المكافآت والخصومات المرتبطة به بشكل دائم من قاعدة البيانات.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                إلغاء الأمر
              </button>
              <button
                onClick={handleExecuteDeleteEmployee}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition-colors shadow-sm"
              >
                تأكيد الحذف النهائي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 sticky top-0 bg-white/95 backdrop-blur-xs z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingEmployee ? 'تعديل بيانات الموظف والصلاحيات' : 'إضافة موظف جديد إلى المنظومة'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    حدد الدور الوظيفي، كود PIN السري، وساعات العمل وأجر الساعة أو الراتب الثابت
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Basic Info */}
              <div className="bg-slate-50/80 border border-slate-200 p-4 rounded-2xl space-y-3.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>1. البيانات الشخصية والأساسية</span>
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">اسم الموظف بالكامل *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="الاسم الثلاثي"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-bold shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-700 font-bold block mb-1">الدور الوظيفي *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium shadow-2xs"
                    >
                      <option value="salesman">مستشار مبيعات (بائع)</option>
                      <option value="cashier">كاشير رئيسي</option>
                      <option value="manager">مدير فرع</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-700 font-bold block mb-1">كود الموظف *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="كود الموظف"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-700 font-bold block mb-1">رقم الهاتف *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="رقم الهاتف"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-700 font-bold block mb-1">الرقم القومي</label>
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      placeholder="الرقم القومي"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: PIN Security Code */}
              <div className="bg-indigo-50/50 border border-indigo-200/80 p-4 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-indigo-950 flex items-center justify-between border-b border-indigo-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    <span>2. رمز PIN السري للتبديل والبيع السريع</span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold">
                    متاح للكتابة من الكيبورد
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">رمز PIN المكون من 4 أرقام *</label>
                  <input
                    type="text"
                    required
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    placeholder="رمز PIN"
                    maxLength={6}
                    className="w-full bg-white border border-indigo-300 rounded-xl p-2.5 text-sm text-slate-900 font-mono font-bold tracking-widest focus:outline-none focus:border-indigo-600 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    يستخدم هذا الكود للتعرف المباشر على البائع في شاشة البيع بدون الحاجة لتبديل المستخدم الرئيسي.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">التارجت الشهري (ج.م) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.monthlyTarget}
                    onChange={(e) => setFormData({ ...formData, monthlyTarget: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">الراتب الأساسي (ج.م) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-emerald-800 font-bold block mb-1">
                    نسبة مكافأة التارجت (% من المرتب) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      required
                      value={formData.targetBonusPercent}
                      onChange={(e) => setFormData({ ...formData, targetBonusPercent: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-emerald-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">عمولة البيع الأساسية (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">%</span>
                  </div>
                </div>
              </div>

              {/* Contract & Document Expiration Dates Section */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <CalendarDays className="w-4 h-4 text-amber-600" />
                  <span>تبيان ومواعيد العقود والوثائق الرسمية (لتنفيذ التنبيهات)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">تاريخ انتهاء عقد العمل</label>
                    <input
                      type="date"
                      value={formData.contractEndDate}
                      onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">تاريخ انتهاء الأوراق/الفيش</label>
                    <input
                      type="date"
                      value={formData.docExpiryDate}
                      onChange={(e) => setFormData({ ...formData, docExpiryDate: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">انتهاء البطاقة الشخصية</label>
                    <input
                      type="date"
                      value={formData.nationalIdExpiry}
                      onChange={(e) => setFormData({ ...formData, nationalIdExpiry: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">تاريخ التعيين / الانضمام</label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Terms & Hourly / Fixed Pay Model */}
              <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl space-y-3">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5 border-b border-amber-200 pb-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>تحديد ساعات العمل المقررة وسعر الساعة/المرتب الثابت</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">نظام الحساب والراتب *</label>
                    <select
                      value={formData.salaryType}
                      onChange={(e) => setFormData({ ...formData, salaryType: e.target.value as 'monthly' | 'hourly' })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                    >
                      <option value="monthly">مرتب شهري ثابت (EGP/Month)</option>
                      <option value="hourly">أجر بالساعة والشيفتات (EGP/Hour)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">ساعات العمل اليومية المقررة *</label>
                    <input
                      type="number"
                      min={1}
                      max={18}
                      required
                      value={formData.standardDailyHours}
                      onChange={(e) => setFormData({ ...formData, standardDailyHours: Number(e.target.value) || 8 })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">سعر ساعة العمل الأساسية (ج.م/ساعة)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-700 font-bold block mb-1">سعر ساعة الإضافي (الأوفر تايم)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.overtimeHourlyRate}
                      onChange={(e) => setFormData({ ...formData, overtimeHourlyRate: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <label className="text-xs font-bold text-sky-800 block">إعدادات وصلاحيات الحساب</label>
                  <span className="text-[10px] text-slate-500">تخصيص الصلاحيات المتاحة</span>
                </div>

                {/* Prominent Read-Only Option */}
                <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.permissions?.readOnly}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          readOnly: e.target.checked
                        }
                      })}
                      className="w-4 h-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-amber-900">
                      👁️ تحديد صلاحية "مشاهدة فقط" (إخفاء أزرار الحذف والتعديل)
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-600 mt-1 mr-6">
                    عند تفعيل هذا الخيار، سيتم إخفاء أزرار الحذف والتعديل والإضافة في كافة صفحات النظام لضمان عدم إمكانية تعديل البيانات من قِبل الموظف.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(Object.keys(ROLE_PERMISSIONS_MAP.salesman) as Array<keyof RolePermissions>)
                    .filter((p) => p !== 'readOnly')
                    .map((perm) => (
                      <div key={perm} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!formData.permissions?.[perm]}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              [perm]: e.target.checked
                            }
                          })}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-[10px] text-slate-700 font-medium">
                          {PERMISSION_LABELS[perm] || perm}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Bonus Calculator Preview */}
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-emerald-900 flex items-center justify-between">
                  <span>مكافأة تحقيق التارجت المحددة:</span>
                  <span className="font-mono text-xs">
                    {Math.round(((formData.salary ?? 0) * (formData.targetBonusPercent ?? 20)) / 100).toLocaleString()} ج.م
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  عند وصول الموظف إلى 100% أو أكثر من هدفه الشهري ({(formData.monthlyTarget ?? 0).toLocaleString()} ج.م)،
                  سيصرف له حافز إضافي بنسبة {formData.targetBonusPercent ?? 20}% من راتبه الأساسي ({(formData.salary ?? 0).toLocaleString()} ج.م).
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  {editingEmployee ? 'حفظ التعديل' : 'إضافة الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Manual Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>تسجيل حضور/غياب يدوي للموظف</span>
              </h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!attendanceForm.employeeId) {
                  alert('يرجى اختيار الموظف أولاً');
                  return;
                }
                recordManualAttendance(attendanceForm);
                setShowAttendanceModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اختر الموظف *</label>
                <select
                  required
                  value={attendanceForm.employeeId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- اختار الموظف --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={attendanceForm.date}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الحالة *</label>
                  <select
                    value={attendanceForm.status}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value as AttendanceStatus })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="present">🟢 حاضر</option>
                    <option value="late">🟡 متأخر</option>
                    <option value="absent">🔴 غائب (خصم أجر يوم آلياً)</option>
                    <option value="leave">🔵 إجازة رسمية</option>
                  </select>
                </div>
              </div>

              {attendanceForm.status !== 'absent' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">وقت الحضور</label>
                    <input
                      type="time"
                      value={attendanceForm.checkInTime}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, checkInTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">وقت الانصراف</label>
                    <input
                      type="time"
                      value={attendanceForm.checkOutTime}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOutTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                  placeholder="ملاحظات طارئة أو سبب الإجازة..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  حفظ سجل الحضور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🖨️ Printable Payslip Modal */}
      {selectedPayslipData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .printable-payslip-content, .printable-payslip-content * { visibility: visible; }
              .printable-payslip-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
              .no-print { display: none !important; }
            }
          `}</style>

          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8 printable-payslip-content text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="text-xl font-black text-slate-950 tracking-tight">
                  مؤسسة الملابس والمنسوجات ERP
                </div>
                <div className="text-xs text-slate-600 font-bold">
                  كشف راتب موظف تفصيلي (سند تسليم وسجل أجور)
                </div>
              </div>

              <div className="text-left font-mono space-y-0.5">
                <div className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-300">
                  عن شهر: {selectedPayslipData.month}
                </div>
                <div className="text-[10px] text-slate-500">
                  تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}
                </div>
              </div>

              <button
                onClick={() => setSelectedPayslipData(null)}
                className="text-slate-400 hover:text-slate-700 no-print"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Employee Details Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">اسم الموظف:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedPayslipData.employee.name}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">كود الموظف:</span>
                <span className="font-mono font-bold text-slate-800">{selectedPayslipData.employee.code}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">المسمى الوظيفي:</span>
                <span className="font-bold text-slate-800">
                  {selectedPayslipData.employee.role === 'manager'
                    ? 'مدير فرع'
                    : selectedPayslipData.employee.role === 'cashier'
                    ? 'كاشير رئيسي'
                    : 'مستشار مبيعات'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">رقم الهاتف:</span>
                <span className="font-mono text-slate-800">{selectedPayslipData.employee.phone}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">الرقم القومي:</span>
                <span className="font-mono text-slate-800">{selectedPayslipData.employee.nationalId || 'غير مسجل'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">تاريخ الانضمام:</span>
                <span className="font-mono text-slate-800">{selectedPayslipData.employee.joinDate || '2024-01-01'}</span>
              </div>
            </div>

            {/* Attendance & Work Summary Banner */}
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex justify-between items-center text-xs text-sky-900 font-medium">
              <span>ملخص أيام الحضور والشيفتات بالشهري:</span>
              <span className="font-bold font-mono">
                {selectedPayslipData.workedDays} يوم عمل ({selectedPayslipData.workedHours} ساعة)
                {selectedPayslipData.lateMinutes > 0 && ` | تأخيرات: ${selectedPayslipData.lateMinutes} دقيقة`}
              </span>
            </div>

            {/* Monthly Performance Evaluation Block */}
            <div className={`border rounded-xl p-3 text-xs space-y-1 ${selectedPayslipData.ratingInfo.badgeBg}`}>
              <div className="flex justify-between items-center font-bold">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>تقييم الأداء والانضباط الشهري:</span>
                </span>
                <span className="font-mono text-sm font-black">
                  {selectedPayslipData.ratingInfo.score}% - {selectedPayslipData.ratingInfo.label}
                </span>
              </div>
              <div className="text-[10px] opacity-80 flex justify-between font-mono pt-1 border-t border-slate-200/60">
                <span>درجة المبيعات والتارجت: {selectedPayslipData.ratingInfo.salesScore}/32</span>
                <span>التزام ساعات العمل: {selectedPayslipData.ratingInfo.hoursScore}/30</span>
                <span>درجة الانضباط والحضور: {selectedPayslipData.ratingInfo.punctualityScore}/30</span>
              </div>
            </div>

            {/* Detailed Itemized Tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Earnings (الاستحقاقات) */}
              <div className="border border-emerald-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-600 text-white font-bold p-2 text-center text-xs">
                  الاستحقاقات والإضافات (+)
                </div>
                <div className="p-3 space-y-2 bg-emerald-50/30">
                  <div className="flex justify-between items-center pb-1 border-b border-emerald-100">
                    <span className="text-slate-700">المرتب الأساسي الشهري:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedPayslipData.baseSalary.toLocaleString()} ج.م</span>
                  </div>

                  {selectedPayslipData.targetBonus > 0 && (
                    <div className="flex justify-between items-center pb-1 border-b border-emerald-100 text-emerald-800 font-semibold">
                      <span>حافز تحقيق التارجت ({selectedPayslipData.employee.targetBonusPercent}%):</span>
                      <span className="font-mono font-bold">+{selectedPayslipData.targetBonus.toLocaleString()} ج.م</span>
                    </div>
                  )}

                  {selectedPayslipData.commission > 0 && (
                    <div className="flex justify-between items-center pb-1 border-b border-emerald-100 text-sky-800 font-semibold">
                      <span>عمولة المبيعات:</span>
                      <span className="font-mono font-bold">+{selectedPayslipData.commission.toLocaleString()} ج.م</span>
                    </div>
                  )}

                  {selectedPayslipData.extraBonuses > 0 && (
                    <div className="flex justify-between items-center pb-1 border-b border-emerald-100 text-emerald-800 font-semibold">
                      <span>المكافآت الإضافية المباشرة:</span>
                      <span className="font-mono font-bold">+{selectedPayslipData.extraBonuses.toLocaleString()} ج.م</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 font-bold text-emerald-950 text-xs border-t border-emerald-300">
                    <span>إجمالي الاستحقاقات:</span>
                    <span className="font-mono font-black text-sm">{selectedPayslipData.totalEarnings.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Deductions (الاستقطاعات) */}
              <div className="border border-rose-200 rounded-xl overflow-hidden">
                <div className="bg-rose-600 text-white font-bold p-2 text-center text-xs">
                  الاستقطاعات والخصومات (-)
                </div>
                <div className="p-3 space-y-2 bg-rose-50/30">
                  <div className="flex justify-between items-center pb-1 border-b border-rose-100">
                    <span>جزاءات التأخير والغياب:</span>
                    <span className="font-mono font-bold text-rose-800">
                      {selectedPayslipData.attendancePenalties > 0 ? `-${selectedPayslipData.attendancePenalties.toLocaleString()} ج.م` : '0 ج.م'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-1 border-b border-rose-100">
                    <span>الخصومات والجزاءات الإدارية:</span>
                    <span className="font-mono font-bold text-rose-800">
                      {selectedPayslipData.extraDeductions > 0 ? `-${selectedPayslipData.extraDeductions.toLocaleString()} ج.م` : '0 ج.م'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-6 font-bold text-rose-950 text-xs border-t border-rose-300">
                    <span>إجمالي الخصومات:</span>
                    <span className="font-mono font-black text-sm">-{selectedPayslipData.totalDeductions.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Net Payable Highlight Box */}
            <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <div className="text-xs font-bold text-amber-900">صافي المرتب النهائي المستحق للصرف والاعتماد:</div>
                <div className="text-[10px] text-slate-600">تسلم الموظف المستحق كاملاً بعد تطبيق كافة الحوافز والخصومات.</div>
              </div>
              <div className="text-2xl font-black text-slate-950 font-mono">
                {selectedPayslipData.netSalary.toLocaleString()} <span className="text-xs font-bold">ج.م</span>
              </div>
            </div>

            {/* Signatures Block */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-[11px] text-slate-700 font-bold">
              <div className="space-y-8">
                <div>توقيع الموظف المستلم</div>
                <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              </div>

              <div className="space-y-8">
                <div>توقيع مدير الحسابات والمالية</div>
                <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              </div>

              <div className="space-y-8">
                <div>اعتماد إدارة الفرع / المحل</div>
                <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-4 no-print border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedPayslipData(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة كشف الراتب (Print / PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔑 Change Manager PIN Modal */}
      {showChangePinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>تغيير كلمة مرور / رمز PIN مدير الفرع</span>
              </h3>
              <button
                onClick={() => setShowChangePinModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                ⚠️ {pinError}
              </div>
            )}

            {pinSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                ✅ {pinSuccess}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPinError('');
                setPinSuccess('');

                if (!verifyManagerPin(pinForm.currentPin)) {
                  setPinError('رمز PIN الحالي للمدير غير صحيح!');
                  return;
                }

                if (!pinForm.newPin || pinForm.newPin.length < 4) {
                  setPinError('رمز PIN الجديد يجب أن يتكون من 4 أرقام على الأقل.');
                  return;
                }

                if (pinForm.newPin !== pinForm.confirmPin) {
                  setPinError('رمز PIN الجديد وتأكيده غير متطابقين!');
                  return;
                }

                updateManagerPin(pinForm.newPin);
                setPinSuccess('تم تغيير كلمة مرور / رمز PIN المدير بنجاح!');
                setTimeout(() => {
                  setShowChangePinModal(false);
                }, 1200);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">
                  رمز PIN الحالي للمدير *
                </label>
                <input
                  type="password"
                  required
                  value={pinForm.currentPin}
                  onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                  placeholder="أدخل رمز PIN الحالي (الافتراضي: 1234)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">
                  رمز PIN الجديد (الكود السري الجديد) *
                </label>
                <input
                  type="password"
                  required
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                  placeholder="مثال: 9876"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">
                  تأكيد رمز PIN الجديد *
                </label>
                <input
                  type="password"
                  required
                  value={pinForm.confirmPin}
                  onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                  placeholder="أعد كتابة الرمز الجديد للتأكيد"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  حفظ الكود الجديد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎉 Shift Wrap-up Modal */}
      {showShiftWrapUpModal && shiftWrapUpData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600 animate-bounce" />
                <h3 className="text-base font-bold text-slate-900">
                  ملخص نهاية الشيفت (Shift Wrap-Up)
                </h3>
              </div>
              <button
                onClick={() => setShowShiftWrapUpModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-950 text-xs font-bold text-center">
              🎉 شكراً لك {shiftWrapUpData.employee.name}! تم حصر إنجازاتك وساعات عملك اليوم بنجاح.
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">ساعات العمل اليومية الفعلية</span>
                <div className="text-base font-black font-mono text-slate-900">
                  {shiftWrapUpData.workedHours} ساعة
                </div>
                <div className="text-[9px] text-slate-500">
                  ({shiftWrapUpData.checkInTime} إلى {shiftWrapUpData.checkOutTime})
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-amber-800 font-bold block">الأوفر تايم (ساعات إضافية)</span>
                <div className="text-base font-black font-mono text-amber-900">
                  +{shiftWrapUpData.overtimeHours} ساعة
                </div>
                <div className="text-[9px] text-amber-700">
                  (المقرر: {shiftWrapUpData.standardHours} س/يومياً)
                </div>
              </div>

              <div className="col-span-2 bg-sky-50 border border-sky-200 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sky-800 font-bold block">مبيعات الشيفت المحققة اليوم:</span>
                  <div className="text-lg font-black font-mono text-sky-950">
                    {shiftWrapUpData.shiftSales.toLocaleString()} ج.م
                  </div>
                </div>
                <Award className="w-8 h-8 text-sky-500" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">
                ملاحظات تسليم الشيفت للزميل أو الإدارة (اختياري)
              </label>
              <textarea
                value={shiftWrapUpData.notes}
                onChange={(e) => setShiftWrapUpData({ ...shiftWrapUpData, notes: e.target.value })}
                rows={2}
                placeholder="مثال: تم تسليم الكاش والنقدية للزميل / تم إكمال الجرد اليومي..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowShiftWrapUpModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckOut}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                تأكيد الخروج وإغلاق الشيفت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
