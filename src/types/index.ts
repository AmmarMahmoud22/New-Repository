export type UserRole = 'salesman' | 'cashier' | 'manager';

export interface RolePermissions {
  canSell: boolean;
  canViewKpi: boolean;
  canManageShift: boolean;
  canLogExpense: boolean;
  canApplyNormalDiscount: boolean;
  canApplyHighDiscount: boolean;
  canEditPrice: boolean;
  canEditStock: boolean;
  canCloseShift: boolean;
  canViewAudit: boolean;
  canManageInstallments: boolean;
  canCollectInstallments: boolean;
  canAccessInventory: boolean;
  canManageEmployees: boolean;
  canManageCustomers: boolean;
  canManageSuppliers?: boolean;
  canManageTreasury?: boolean;
  canExportBackup: boolean;
  canResetData: boolean;
  canViewReports: boolean;
  readOnly: boolean;
}

export type EmployeeAdjustmentType = 'bonus' | 'deduction';

export interface EmployeeAdjustment {
  id: string;
  employeeId: string;
  employeeName: string;
  type: EmployeeAdjustmentType; // 'bonus' (مكافأة) or 'deduction' (خصم)
  amount: number;
  reason: string;
  date: string;
  recordedBy: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'completed';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn?: string;
  checkInTime?: string; // HH:mm
  checkOut?: string;
  checkOutTime?: string; // HH:mm
  status: AttendanceStatus;
  workHours?: number; // Calculated hours worked
  workingHours?: number;
  overtimeHours?: number;
  lateMinutes?: number; // Calculated lateness in minutes
  latenessMinutes?: number;
  autoDeductionAmount?: number; // Automatic penalty deduction for lateness/absence
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: UserRole;
  code: string;
  avatar: string;
  monthlyTarget: number;
  currentSales: number;
  shiftSales: number;
  phone: string;
  nationalId?: string;
  salary: number; // Base salary in EGP
  salaryType?: 'monthly' | 'hourly'; // Pay model: monthly fixed salary vs hourly rate
  hourlyRate?: number; // Base hourly rate in EGP/hr
  overtimeHourlyRate?: number; // Overtime hourly rate in EGP/hr
  standardDailyHours?: number; // Standard contracted daily hours (e.g. 8 or 10 hrs)
  targetBonusPercent: number; // Bonus % of salary rewarded when monthly target is reached (specified by manager)
  totalBonuses?: number; // Total accumulated extra bonuses
  totalDeductions?: number; // Total accumulated deductions
  totalOvertimeHours?: number; // Accumulated overtime hours
  totalLateMinutes?: number; // Accumulated late minutes
  totalWorkedHours?: number; // Total accumulated worked hours
  pinCode?: string; // Custom 4-digit PIN/Code set by Manager
  commissionRate?: number; // Sales commission %
  joinDate?: string;
  contractEndDate?: string; // YYYY-MM-DD
  docExpiryDate?: string; // YYYY-MM-DD (انتهاء الأوراق والوثائق الرسمية/الإقامة)
  nationalIdExpiry?: string; // YYYY-MM-DD (انتهاء الرقم القومي/البطاقة)
  permissions?: Partial<RolePermissions>; // Custom permissions override
}

export type ProductCategory = 'mens' | 'youth' | 'formal' | string;

export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku?: string;
  category: ProductCategory;
  brand: string;
  size: string;
  color: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  nationalId?: string;
  address?: string;
  totalPurchases: number;
  invoicesCount: number;
  notes?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  priceEdited?: boolean;
  editReason?: string;
  discountPercent: number;
}

export type PaymentMethod = 'cash' | 'card' | 'split' | 'installment';

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }[];
  totalRefundAmount: number;
  reason: string;
  processedBy: string;
  processedById?: string;
  salesmanId?: string;
  salesmanName?: string;
  paymentMethod: 'cash' | 'card';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  shiftId: string;
  cashierId: string;
  cashierName: string;
  salesmanId: string;
  salesmanName: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxRate: number; // 0.14 = 14% ضريبة القيمة المضافة بمصر
  taxTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  cashPaid?: number;
  cardPaid?: number;
  notes?: string;
  whatsappReceiptText: string;
  exceptionalDiscountApprovedBy?: string;
  status?: 'paid' | 'partially_returned' | 'returned';
  returnedTotal?: number;
  returns?: ReturnRecord[];
}

export interface InstallmentScheduleItem {
  monthIndex: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
  paidAmount?: number;
  receiptNumber?: string;
  paidVia?: string;
}

export interface InstallmentContract {
  id: string;
  contractNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  nationalId: string;
  totalPurchaseAmount: number;
  downPayment: number;
  remainingAmount: number;
  termMonths: number;
  monthlyInstallment: number;
  status: 'active' | 'completed' | 'defaulted';
  notes?: string;
  itemsSummary: string;
  schedule: InstallmentScheduleItem[];
  createdBy: string;
}

export type ExpenseCategory = 'hospitality' | 'maintenance' | 'supplies' | 'bills' | 'misc';

export interface Expense {
  id: string;
  shiftId: string;
  date: string;
  category: ExpenseCategory;
  categoryLabel: string;
  title: string;
  amount: number;
  notes?: string;
  recordedBy: string;
}

export interface Shift {
  id: string;
  shiftNumber: number;
  openedBy: string;
  openedById: string;
  openedAt: string;
  closedAt?: string;
  closedBy?: string;
  openingCashFund: number;
  expectedCash: number;
  countedCash?: number;
  discrepancy?: number;
  status: 'open' | 'closed';
  notes?: string;
  summary: {
    totalCashSales: number;
    totalCardSales: number;
    totalSplitSalesCash: number;
    totalSplitSalesCard: number;
    totalInstallmentDown: number;
    totalInstallmentCollected: number;
    totalExpenses: number;
    totalReturns?: number;
    totalNetCashInDrawer: number;
    invoiceCount: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  contactPerson?: string;
  address?: string;
  notes?: string;
  balance: number; // Positive = we owe supplier (مستحقات للمورد), Negative = supplier owes us
  totalPurchases: number;
  totalPaid: number;
  createdAt: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  type: 'purchase_invoice' | 'payment_made' | 'refund_received';
  amount: number;
  date: string;
  referenceNumber?: string;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer';
  notes?: string;
  recordedBy: string;
}

export type TreasuryTransactionType = 'deposit' | 'withdrawal' | 'supplier_payment' | 'capital_add' | 'owner_draw';

export interface TreasuryTransaction {
  id: string;
  type: TreasuryTransactionType;
  title: string;
  amount: number;
  date: string;
  category: string; // e.g. 'إيداع رأس مال', 'مسحوبات شركاء', 'سداد مورد', 'إيداع بنكي', 'مصروف استثنائي'
  recordedBy: string;
  recordedById?: string;
  notes?: string;
  referenceNumber?: string;
  shiftId?: string;
}

export type AuditActionType =
  | 'discount_exception'
  | 'manual_price_edit'
  | 'return_processed'
  | 'return_without_invoice'
  | 'void_invoice'
  | 'shift_opened'
  | 'shift_closed'
  | 'expense_logged'
  | 'installment_created'
  | 'installment_collected'
  | 'role_permission_switch'
  | 'stock_update'
  | 'product_created'
  | 'employee_created'
  | 'employee_deleted'
  | 'employee_adjustment_added'
  | 'attendance_check_in'
  | 'attendance_check_out'
  | 'customer_created'
  | 'supplier_created'
  | 'supplier_payment'
  | 'treasury_deposit'
  | 'treasury_withdrawal'
  | 'settings_update'
  | 'data_reset'
  | 'complete_database_wipe';

export interface AuditLog {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  role: UserRole;
  actionType: AuditActionType;
  actionTitle: string;
  details: string;
  severity: 'normal' | 'sensitive' | 'critical';
  requiresManagerPin?: boolean;
  approvedBy?: string;
}

export type OfferType = 'bundle' | 'product_discount' | 'category_discount';

export interface PromotionalOffer {
  id: string;
  title: string;
  type: OfferType;
  productIds: string[]; // Linked inventory items
  category?: ProductCategory;
  discountPercent?: number; // e.g. 20%
  discountAmount?: number; // e.g. 100 EGP
  bundlePrice?: number; // Special fixed price for bundle
  minQuantity?: number; // Minimum quantity required
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface DiscountCoupon {
  id: string;
  code: string; // e.g. "AKHEN20" or "SUMMER100"
  title: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}
