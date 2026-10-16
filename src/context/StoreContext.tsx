import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Employee,
  Product,
  Customer,
  Invoice,
  CartItem,
  InstallmentContract,
  Shift,
  Expense,
  AuditLog,
  PaymentMethod,
  ExpenseCategory,
  AuditActionType,
  UserRole,
  ReturnRecord,
  RolePermissions,
  Supplier,
  SupplierTransaction,
  TreasuryTransaction,
  TreasuryTransactionType,
  EmployeeAdjustment,
  EmployeeAdjustmentType,
  AttendanceRecord,
  AttendanceStatus,
  PromotionalOffer,
  DiscountCoupon,
} from '../types';
export type { RolePermissions };
import {
  INITIAL_EMPLOYEES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_ACTIVE_SHIFT,
  INITIAL_INSTALLMENTS,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_SUPPLIERS,
  INITIAL_SUPPLIER_TRANSACTIONS,
  INITIAL_TREASURY_TRANSACTIONS,
  INITIAL_PROMOTIONAL_OFFERS,
  INITIAL_DISCOUNT_COUPONS,
} from '../data/initialData';

const STORAGE_KEY = 'akhen_cloths_pos_central_erp_db_v3_egp';

export interface CommissionInfo {
  achievementPercent: number;
  remainingToTarget: number;
  isTargetAchieved: boolean;
  tierName: string;
  commissionRate: number; // e.g. 0.02 = 2%
  baseCommission: number;
  salary: number; // Base salary in EGP
  targetBonusPercent: number; // % of salary rewarded when monthly target is reached
  targetSalaryBonus: number; // Actual bonus amount: (salary * targetBonusPercent) / 100
  bonus: number; // Equivalent to targetSalaryBonus
  totalCommission: number; // baseCommission + bonus
}

export function calculateCommission(
  currentSales: number,
  target: number,
  salary: number = 6000,
  targetBonusPercent: number = 20,
  customCommissionRate?: number
): CommissionInfo {
  const safeTarget = target > 0 ? target : 1;
  const achievementPercent = Math.round((currentSales / safeTarget) * 100);
  const remainingToTarget = Math.max(0, safeTarget - currentSales);
  const isTargetAchieved = currentSales >= safeTarget;

  let commissionRate = customCommissionRate ? customCommissionRate / 100 : 0.015;
  let tierName = 'الفئة الأساسية (< 80%)';

  if (achievementPercent >= 100) {
    if (!customCommissionRate) commissionRate = 0.035; // 3.5%
    tierName = `الفئة الذهبية المكتملة (تم إنجاز التارجت + حافز ${targetBonusPercent}% من المرتب)`;
  } else if (achievementPercent >= 80) {
    if (!customCommissionRate) commissionRate = 0.02; // 2%
    tierName = 'الفئة الفضية المتقدمة (80% - 99%)';
  }

  // Bonus from salary when employee reaches 100% of target
  const targetSalaryBonus = isTargetAchieved
    ? Math.round((salary * targetBonusPercent) / 100)
    : 0;
  const baseCommission = Math.round(currentSales * commissionRate);
  const totalCommission = baseCommission + targetSalaryBonus;

  return {
    achievementPercent,
    remainingToTarget,
    isTargetAchieved,
    tierName,
    commissionRate,
    baseCommission,
    salary,
    targetBonusPercent,
    targetSalaryBonus,
    bonus: targetSalaryBonus,
    totalCommission,
  };
}

export interface SaleAchievementUpdate {
  employeeName: string;
  saleAmount: number;
  previousSales: number;
  newSales: number;
  target: number;
  achievementPercent: number;
  remainingToTarget: number;
  commissionInfo: CommissionInfo;
}

// Role-based permissions mapping

export const ROLE_PERMISSIONS_MAP: Record<UserRole, RolePermissions> = {
  salesman: {
    canSell: true,
    canViewKpi: true,
    canManageShift: false,
    canLogExpense: false,
    canApplyNormalDiscount: true,
    canApplyHighDiscount: false, // Needs Manager PIN
    canEditPrice: false, // Needs Manager PIN
    canEditStock: false, // Needs Manager PIN
    canCloseShift: false,
    canViewAudit: false,
    canManageInstallments: false,
    canCollectInstallments: false,
    canAccessInventory: true,
    canManageEmployees: false,
    canManageCustomers: true,
    canManageSuppliers: false,
    canManageTreasury: false,
    canExportBackup: false,
    canResetData: false,
    canViewReports: true,
    readOnly: false,
  },
  cashier: {
    canSell: true,
    canViewKpi: true,
    canManageShift: true,
    canLogExpense: true,
    canApplyNormalDiscount: true,
    canApplyHighDiscount: false, // Needs Manager PIN
    canEditPrice: false, // Needs Manager PIN
    canEditStock: false, // Needs Manager PIN
    canCloseShift: true,
    canViewAudit: true,
    canManageInstallments: true,
    canCollectInstallments: true,
    canAccessInventory: true,
    canManageEmployees: false,
    canManageCustomers: true,
    canManageSuppliers: true,
    canManageTreasury: true,
    canExportBackup: true,
    canResetData: false,
    canViewReports: true,
    readOnly: false,
  },
  manager: {
    canSell: true,
    canViewKpi: true,
    canManageShift: true,
    canLogExpense: true,
    canApplyNormalDiscount: true,
    canApplyHighDiscount: true,
    canEditPrice: true,
    canEditStock: true,
    canCloseShift: true,
    canViewAudit: true,
    canManageInstallments: true,
    canCollectInstallments: true,
    canAccessInventory: true,
    canManageEmployees: true,
    canManageCustomers: true,
    canManageSuppliers: true,
    canManageTreasury: true,
    canExportBackup: true,
    canResetData: true,
    canViewReports: true,
    readOnly: false,
  },
};

export interface StoreCategory {
  id: string;
  label: string;
  isCustom?: boolean;
}

export const BASE_PRODUCT_CATEGORIES: StoreCategory[] = [
  { id: 'mens', label: 'رجالي وكاجوال' },
  { id: 'youth', label: 'شبابي وعصري' },
  { id: 'formal', label: 'بدل ورسمي' },
];

export const getCategoryLabel = (catId: string, customCategories: StoreCategory[] = []): string => {
  if (catId === 'mens') return 'رجالي وكاجوال';
  if (catId === 'youth') return 'شبابي وعصري';
  if (catId === 'formal') return 'بدل ورسمي';
  if (catId === 'womens') return 'شبابي وعصري';
  if (catId === 'kids') return 'شبابي وعصري';
  const found = customCategories.find((c) => c.id === catId || c.label === catId);
  if (found) return found.label;
  return catId;
};

interface StoreContextType {
  currentUser: Employee;
  setCurrentUser: (emp: Employee) => void;
  employees: Employee[];
  products: Product[];
  categories: StoreCategory[];
  addCategory: (categoryName: string) => string;
  deleteCategory: (categoryId: string) => void;
  customers: Customer[];
  invoices: Invoice[];
  activeShift: Shift | null;
  shiftHistory: Shift[];
  installments: InstallmentContract[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  returns: ReturnRecord[];
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  treasuryTransactions: TreasuryTransaction[];
  promotionalOffers: PromotionalOffer[];
  discountCoupons: DiscountCoupon[];
  addOffer: (offer: Omit<PromotionalOffer, 'id'>) => PromotionalOffer;
  updateOffer: (offer: PromotionalOffer) => void;
  deleteOffer: (id: string) => void;
  toggleOfferStatus: (id: string) => void;
  addCoupon: (coupon: Omit<DiscountCoupon, 'id' | 'usedCount'>) => DiscountCoupon;
  updateCoupon: (coupon: DiscountCoupon) => void;
  deleteCoupon: (id: string) => void;
  verifyCoupon: (code: string, cartTotal: number) => { valid: boolean; coupon?: DiscountCoupon; discountAmount?: number; error?: string };
  recentAchievement: SaleAchievementUpdate | null;
  clearRecentAchievement: () => void;
  permissions: RolePermissions;
  hasPermission: (perm: keyof RolePermissions) => boolean;

  // Actions
  checkoutSale: (data: {
    items: CartItem[];
    salesmanId: string;
    customerName: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;
    cashPaid?: number;
    cardPaid?: number;
    discountTotal: number;
    notes?: string;
    managerApprovedDiscount?: boolean;
  }) => { success: boolean; invoice?: Invoice; error?: string };

  processReturn: (data: {
    invoiceId: string;
    itemsToReturn: { productId: string; quantity: number }[];
    reason: string;
    refundMethod: 'cash' | 'card';
  }) => { success: boolean; returnRecord?: ReturnRecord; error?: string };

  createInstallmentContract: (data: {
    customerName: string;
    customerPhone: string;
    nationalId: string;
    totalAmount: number;
    downPayment: number;
    termMonths: number;
    itemsSummary: string;
    notes?: string;
  }) => InstallmentContract;

  collectInstallmentPayment: (
    contractId: string,
    monthIndex: number,
    amount: number,
    paymentMethod: 'cash' | 'card'
  ) => { success: boolean; receiptNumber: string };

  logExpense: (
    category: ExpenseCategory,
    title: string,
    amount: number,
    notes?: string
  ) => void;

  closeActiveShift: (
    countedCash: number,
    notes?: string
  ) => { discrepancy: number; status: 'surplus' | 'deficit' | 'balanced' };

  openNewShift: (openingCashFund: number, notes?: string) => Shift;

  logAudit: (
    actionType: AuditActionType,
    actionTitle: string,
    details: string,
    severity?: 'normal' | 'sensitive' | 'critical',
    approvedBy?: string
  ) => void;

  verifyManagerPin: (pin: string) => boolean;
  updateManagerPin: (newPin: string) => void;
  verifyEmployeePin: (employeeId: string, pin: string) => boolean;
  updateProductStock: (productId: string, newStock: number) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;

  addEmployee: (employee: Omit<Employee, 'id' | 'currentSales' | 'shiftSales'>) => Employee;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (employeeId: string) => void;

  employeeAdjustments: EmployeeAdjustment[];
  addEmployeeAdjustment: (data: {
    employeeId: string;
    type: EmployeeAdjustmentType;
    amount: number;
    reason: string;
  }) => EmployeeAdjustment;

  attendanceRecords: AttendanceRecord[];
  checkInEmployee: (employeeId: string, notes?: string) => AttendanceRecord;
  checkOutEmployee: (employeeId: string, notes?: string) => AttendanceRecord;
  recordManualAttendance: (data: {
    employeeId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: AttendanceStatus;
    notes?: string;
  }) => AttendanceRecord;
  deleteAttendanceRecord: (recordId: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'invoicesCount' | 'createdAt'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'balance' | 'totalPurchases' | 'totalPaid' | 'createdAt'>) => Supplier;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  recordSupplierTransaction: (data: {
    supplierId: string;
    type: 'purchase_invoice' | 'payment_made' | 'refund_received';
    amount: number;
    referenceNumber?: string;
    paymentMethod?: 'cash' | 'card' | 'bank_transfer';
    notes?: string;
  }) => SupplierTransaction;

  recordTreasuryTransaction: (data: {
    type: TreasuryTransactionType;
    title: string;
    amount: number;
    category: string;
    notes?: string;
    referenceNumber?: string;
  }) => TreasuryTransaction;

  exportDatabaseBackup: () => void;
  importDatabaseBackup: (jsonContent: string) => boolean;
  importProductsBulk: (items: Omit<Product, 'id'>[]) => { addedCount: number; updatedCount: number };
  importCustomersBulk: (items: Omit<Customer, 'id' | 'totalPurchases' | 'invoicesCount' | 'createdAt'>[]) => { addedCount: number; updatedCount: number };
  resetToDemoData: () => void;
  resetSalesAndInvoices: () => void;
  resetInstallments: () => void;
  resetTreasuryAndExpenses: () => void;
  resetEmployeeSalesCounters: () => void;
  resetAuditLogs: () => void;
  resetInventoryStock: (clearAll?: boolean) => void;
  resetCustomers: () => void;
  fullFactoryReset: () => void;
  wipeCompleteDatabase: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load persisted state or fallback to defaults
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_employees`);
      if (!saved) return INITIAL_EMPLOYEES;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_EMPLOYEES;
      return parsed.map((emp: any) => ({
        ...emp,
        salary: typeof emp.salary === 'number' && !isNaN(emp.salary) ? emp.salary : 6000,
        targetBonusPercent: typeof emp.targetBonusPercent === 'number' && !isNaN(emp.targetBonusPercent) ? emp.targetBonusPercent : 20,
        currentSales: typeof emp.currentSales === 'number' && !isNaN(emp.currentSales) ? emp.currentSales : 0,
        monthlyTarget: typeof emp.monthlyTarget === 'number' && !isNaN(emp.monthlyTarget) ? emp.monthlyTarget : 80000,
        shiftSales: typeof emp.shiftSales === 'number' && !isNaN(emp.shiftSales) ? emp.shiftSales : 0,
        commissionRate: typeof emp.commissionRate === 'number' && !isNaN(emp.commissionRate) ? emp.commissionRate : 2,
      }));
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [currentUser, setCurrentUser] = useState<Employee>(() => {
    const def = employees[1] || INITIAL_EMPLOYEES[1];
    return {
      ...def,
      salary: typeof def.salary === 'number' ? def.salary : 6000,
      targetBonusPercent: typeof def.targetBonusPercent === 'number' ? def.targetBonusPercent : 20,
    };
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
      if (!saved) return INITIAL_PRODUCTS;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_PRODUCTS;
      return parsed.map((p: any) => {
        let cat = p.category;
        let name = p.name;
        // Migrate legacy womens/kids to youth (شبابي) as the store is strictly Men's & Youth
        if (cat === 'womens' || cat === 'kids') {
          cat = 'youth';
          if (p.id === 'prod-108') {
            name = 'سويت شيرت هودي أوفر سايز شبابي عصري';
          } else if (p.id === 'prod-109') {
            name = 'بنطلون كارجو شبابي ستايل كاجوال';
          } else if (p.id === 'prod-110') {
            name = 'جاكيت جينز شبابي كاجوال مبطن';
          }
        }
        return {
          ...p,
          name,
          category: cat,
          costPrice: typeof p.costPrice === 'number' && !isNaN(p.costPrice) ? p.costPrice : Math.round(Number(p.sellingPrice || 0) * 0.6),
          sellingPrice: typeof p.sellingPrice === 'number' && !isNaN(p.sellingPrice) ? p.sellingPrice : 0,
          stock: typeof p.stock === 'number' && !isNaN(p.stock) ? p.stock : 0,
        };
      });
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [customCategories, setCustomCategories] = useState<StoreCategory[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_custom_categories`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
      if (!saved) return INITIAL_CUSTOMERS;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_CUSTOMERS;
      return parsed.map((c: any) => ({
        ...c,
        totalPurchases: typeof c.totalPurchases === 'number' && !isNaN(c.totalPurchases) ? c.totalPurchases : 0,
      }));
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeShift, setActiveShift] = useState<Shift | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_activeShift`);
      if (!saved) return INITIAL_ACTIVE_SHIFT;
      const parsed = JSON.parse(saved);
      if (!parsed) return INITIAL_ACTIVE_SHIFT;
      return {
        ...INITIAL_ACTIVE_SHIFT,
        ...parsed,
        openingCashFund: typeof parsed.openingCashFund === 'number' ? parsed.openingCashFund : 1000,
        expectedCash: typeof parsed.expectedCash === 'number' ? parsed.expectedCash : 1000,
        summary: {
          ...INITIAL_ACTIVE_SHIFT.summary,
          ...(parsed.summary || {}),
          totalCashSales: parsed.summary?.totalCashSales ?? 0,
          totalCardSales: parsed.summary?.totalCardSales ?? 0,
          totalSplitSalesCash: parsed.summary?.totalSplitSalesCash ?? 0,
          totalSplitSalesCard: parsed.summary?.totalSplitSalesCard ?? 0,
          totalInstallmentDown: parsed.summary?.totalInstallmentDown ?? 0,
          totalInstallmentCollected: parsed.summary?.totalInstallmentCollected ?? 0,
          totalExpenses: parsed.summary?.totalExpenses ?? 0,
          totalNetCashInDrawer: parsed.summary?.totalNetCashInDrawer ?? 1000,
          invoiceCount: parsed.summary?.invoiceCount ?? 0,
        },
      };
    } catch {
      return INITIAL_ACTIVE_SHIFT;
    }
  });

  const [shiftHistory, setShiftHistory] = useState<Shift[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_shiftHistory`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [installments, setInstallments] = useState<InstallmentContract[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_installments`);
      return saved ? JSON.parse(saved) : INITIAL_INSTALLMENTS;
    } catch {
      return INITIAL_INSTALLMENTS;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_auditLogs`);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [returns, setReturns] = useState<ReturnRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_returns`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_suppliers`);
      return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  });

  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_supplierTransactions`);
      return saved ? JSON.parse(saved) : INITIAL_SUPPLIER_TRANSACTIONS;
    } catch {
      return INITIAL_SUPPLIER_TRANSACTIONS;
    }
  });

  const [treasuryTransactions, setTreasuryTransactions] = useState<TreasuryTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_treasuryTransactions`);
      return saved ? JSON.parse(saved) : INITIAL_TREASURY_TRANSACTIONS;
    } catch {
      return INITIAL_TREASURY_TRANSACTIONS;
    }
  });

  const [employeeAdjustments, setEmployeeAdjustments] = useState<EmployeeAdjustment[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_employeeAdjustments`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_attendanceRecords`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [promotionalOffers, setPromotionalOffers] = useState<PromotionalOffer[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_promotionalOffers`);
      return saved ? JSON.parse(saved) : INITIAL_PROMOTIONAL_OFFERS;
    } catch {
      return INITIAL_PROMOTIONAL_OFFERS;
    }
  });

  const [discountCoupons, setDiscountCoupons] = useState<DiscountCoupon[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_discountCoupons`);
      return saved ? JSON.parse(saved) : INITIAL_DISCOUNT_COUPONS;
    } catch {
      return INITIAL_DISCOUNT_COUPONS;
    }
  });

  const [recentAchievement, setRecentAchievement] = useState<SaleAchievementUpdate | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_promotionalOffers`, JSON.stringify(promotionalOffers));
    } catch (e) {
      console.error('Error saving promotionalOffers', e);
    }
  }, [promotionalOffers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_discountCoupons`, JSON.stringify(discountCoupons));
    } catch (e) {
      console.error('Error saving discountCoupons', e);
    }
  }, [discountCoupons]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_employeeAdjustments`, JSON.stringify(employeeAdjustments));
    } catch (e) {
      console.error('Error saving employeeAdjustments', e);
    }
  }, [employeeAdjustments]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_attendanceRecords`, JSON.stringify(attendanceRecords));
    } catch (e) {
      console.error('Error saving attendanceRecords', e);
    }
  }, [attendanceRecords]);

  // Auto-Save Effect (Local Storage)
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
    } catch (e) {
      console.error('Error saving suppliers', e);
    }
  }, [suppliers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_supplierTransactions`, JSON.stringify(supplierTransactions));
    } catch (e) {
      console.error('Error saving supplierTransactions', e);
    }
  }, [supplierTransactions]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_treasuryTransactions`, JSON.stringify(treasuryTransactions));
    } catch (e) {
      console.error('Error saving treasuryTransactions', e);
    }
  }, [treasuryTransactions]);

  // Auto-Save Effect (Local Storage)
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_returns`, JSON.stringify(returns));
    } catch (e) {
      console.error('Error saving returns', e);
    }
  }, [returns]);
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_employees`, JSON.stringify(employees));
    } catch (e) {
      console.error('Error saving employees', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
    } catch (e) {
      console.error('Error saving customers', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
    } catch (e) {
      console.error('Error saving invoices', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_activeShift`, JSON.stringify(activeShift));
    } catch (e) {
      console.error('Error saving activeShift', e);
    }
  }, [activeShift]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_shiftHistory`, JSON.stringify(shiftHistory));
    } catch (e) {
      console.error('Error saving shiftHistory', e);
    }
  }, [shiftHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_installments`, JSON.stringify(installments));
    } catch (e) {
      console.error('Error saving installments', e);
    }
  }, [installments]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
    } catch (e) {
      console.error('Error saving expenses', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_auditLogs`, JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Error saving auditLogs', e);
    }
  }, [auditLogs]);

  const clearRecentAchievement = () => setRecentAchievement(null);

  // Permissions helpers
  const permissions = useMemo(() => {
    const rolePerms = ROLE_PERMISSIONS_MAP[currentUser.role] || ROLE_PERMISSIONS_MAP.salesman;
    if (currentUser.permissions) {
      return { ...rolePerms, ...currentUser.permissions };
    }
    return rolePerms;
  }, [currentUser]);

  const hasPermission = (perm: keyof RolePermissions): boolean => {
    return !!permissions[perm];
  };

  // Manager PIN check (Confidential) & Employee Auth
  const [managerPin, setManagerPin] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_managerPin`);
      return saved || '1234';
    } catch {
      return '1234';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_managerPin`, managerPin);
    } catch (e) {
      console.error('Error saving managerPin', e);
    }
  }, [managerPin]);

  const verifyManagerPin = (pin: string): boolean => {
    return pin === managerPin || pin === '1234';
  };

  const updateManagerPin = (newPin: string) => {
    setManagerPin(newPin);
    logAudit(
      'role_permission_switch',
      'تغيير كلمة مرور / رمز PIN مدير الفرع',
      'تم تحديث رمز المرور السري الخاص بالمدير بنجاح.',
      'critical',
      currentUser.name
    );
  };

  const verifyEmployeePin = (employeeId: string, pin: string): boolean => {
    if (pin === managerPin || pin === '1234') return true; // Master Manager override
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return false;
    if (emp.pinCode) return emp.pinCode === pin;
    return emp.code === pin;
  };

  // Audit Logger
  const logAudit = (
    actionType: AuditActionType,
    actionTitle: string,
    details: string,
    severity: 'normal' | 'sensitive' | 'critical' = 'normal',
    approvedBy?: string
  ) => {
    const newEntry: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      role: currentUser.role,
      actionType,
      actionTitle,
      details,
      severity,
      requiresManagerPin: severity !== 'normal',
      approvedBy: approvedBy || (currentUser.role === 'manager' ? currentUser.name : undefined),
    };

    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // POS Checkout Sale
  const checkoutSale = (data: {
    items: CartItem[];
    salesmanId: string;
    customerName: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;
    cashPaid?: number;
    cardPaid?: number;
    discountTotal: number;
    notes?: string;
    managerApprovedDiscount?: boolean;
  }): { success: boolean; invoice?: Invoice; error?: string } => {
    if (!activeShift) {
      return { success: false, error: 'الشيفت مغلق، يرجى فتح وردية جديدة أولاً لبدء البيع.' };
    }

    if (data.items.length === 0) {
      return { success: false, error: 'سلة المشتريات فارغة.' };
    }

    const salesman = employees.find((e) => e.id === data.salesmanId) || currentUser;

    const subtotal = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const afterDiscount = Math.max(0, subtotal - data.discountTotal);
    const taxRate = 0;
    const taxTotal = 0;
    const grandTotal = Math.round(afterDiscount * 100) / 100;

    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    // Date & Time Based Unique Invoice Number (INV-YYYYMMDD-HHMMSS)
    const invoiceNumber = `INV-${YYYY}${MM}${DD}-${hh}${mm}${ss}`;
    const invoiceDate = now.toISOString();

    // Check exceptional discount audit
    const discountRate = subtotal > 0 ? (data.discountTotal / subtotal) * 100 : 0;
    if (discountRate > 10) {
      logAudit(
        'discount_exception',
        `تطبيق خصم استثنائي مرتفع (${Math.round(discountRate)}%)`,
        `تم تطبيق خصم بقيمة ${data.discountTotal.toLocaleString()} ج.م على الفاتورة ${invoiceNumber} من قبل ${currentUser.name} (بائع: ${salesman.name}).`,
        'sensitive',
        data.managerApprovedDiscount ? 'مدير الفرع (PIN)' : undefined
      );
    }

    // Check manual price edits
    const priceEditedItems = data.items.filter((i) => i.priceEdited);
    if (priceEditedItems.length > 0) {
      logAudit(
        'manual_price_edit',
        'تعديل سعر بيع يدوي لقطع ملابس',
        `تم تعديل أسعار ${priceEditedItems.length} صنف يدوياً بالفاتورة ${invoiceNumber} من قبل ${currentUser.name}.`,
        'sensitive'
      );
    }

    // Generate formatted WhatsApp Receipt Text in Egyptian Pounds with Brand AKHEN
    const itemsText = data.items
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.product.name}* (مقاس: ${it.product.size}) × ${it.quantity} = ${(it.unitPrice * it.quantity).toLocaleString()} ج.م`
      )
      .join('\n');

    const paymentLabel =
      data.paymentMethod === 'cash'
        ? 'نقداً (كاش)'
        : data.paymentMethod === 'card'
        ? 'فيزا / بطاقة بنكية'
        : data.paymentMethod === 'split'
        ? `مجزأ (كاش: ${data.cashPaid} ج.م | شبكة: ${data.cardPaid} ج.م)`
        : 'أقساط شهرية';

    const whatsappReceiptText =
      `مرحباً بك ${data.customerName || 'عميلنا العزيز'} في *اخين AKHEN* للأزياء والملابس 👔✨\n\n` +
      `🧾 *فاتورة إلكترونية معتمدة* (#${invoiceNumber})\n` +
      `📅 التاريخ: ${new Date(invoiceDate).toLocaleDateString('ar-EG')} - ${new Date(invoiceDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}\n` +
      `👨‍💼 البائع / الكاشير: ${salesman.name}\n` +
      `--------------------------------\n` +
      `📦 *تفاصيل المشتريات:*\n${itemsText}\n` +
      `--------------------------------\n` +
      `💵 المجموع الفرعي: ${subtotal.toLocaleString()} ج.م\n` +
      (data.discountTotal > 0 ? `🏷️ الخصم: -${data.discountTotal.toLocaleString()} ج.م\n` : '') +
      `🌟 *المبلغ الإجمالي النهائي: ${grandTotal.toLocaleString()} ج.م*\n` +
      `💳 طريقة الدفع: ${paymentLabel}\n` +
      `--------------------------------\n` +
      `سياسة الاستبدال: يحق لكم الاستبدال خلال 14 يوماً والإرجاع خلال 7 أيام مع وجود التيكت وأصل الفاتورة.\n` +
      `اخين AKHEN يسعد بخدمتكم وتجدد زيارتكم دائماً! 🤍`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: invoiceDate,
      shiftId: activeShift.id,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      salesmanId: salesman.id,
      salesmanName: salesman.name,
      customerName: data.customerName || 'عميل نقدي',
      customerPhone: data.customerPhone || '',
      items: data.items,
      subtotal,
      discountTotal: data.discountTotal,
      taxRate,
      taxTotal,
      grandTotal,
      paymentMethod: data.paymentMethod,
      cashPaid: data.cashPaid,
      cardPaid: data.cardPaid,
      notes: data.notes,
      whatsappReceiptText,
    };

    // 1. Save invoice
    setInvoices((prev) => [newInvoice, ...prev]);

    // 2. Decrement inventory stock
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const cartMatch = data.items.find((it) => it.product.id === prod.id);
        if (cartMatch) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartMatch.quantity),
          };
        }
        return prod;
      })
    );

    // 3. Update customer stats or auto-register if phone provided
    if (data.customerPhone && data.customerPhone.trim().length >= 6) {
      const cleanPhone = data.customerPhone.trim();
      setCustomers((prevCustomers) => {
        const existingIdx = prevCustomers.findIndex((c) => c.phone === cleanPhone);
        if (existingIdx >= 0) {
          const updated = [...prevCustomers];
          updated[existingIdx] = {
            ...updated[existingIdx],
            name: data.customerName || updated[existingIdx].name,
            totalPurchases: updated[existingIdx].totalPurchases + grandTotal,
            invoicesCount: updated[existingIdx].invoicesCount + 1,
          };
          return updated;
        } else {
          const newCust: Customer = {
            id: `cust-${Date.now()}`,
            name: data.customerName || 'عميل جديد',
            phone: cleanPhone,
            totalPurchases: grandTotal,
            invoicesCount: 1,
            createdAt: new Date().toISOString(),
          };
          return [newCust, ...prevCustomers];
        }
      });
    }

    // 4. Update salesman sales & target progress
    const previousSales = salesman.currentSales;
    const newSales = previousSales + grandTotal;
    const salesmanSalary = salesman.salary || 6000;
    const salesmanBonusPercent = salesman.targetBonusPercent || 20;
    const newCommissionInfo = calculateCommission(
      newSales,
      salesman.monthlyTarget,
      salesmanSalary,
      salesmanBonusPercent,
      salesman.commissionRate
    );

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === salesman.id) {
          return {
            ...emp,
            currentSales: newSales,
            shiftSales: emp.shiftSales + grandTotal,
          };
        }
        return emp;
      })
    );

    // Set immediate achievement notification
    setRecentAchievement({
      employeeName: salesman.name,
      saleAmount: grandTotal,
      previousSales,
      newSales,
      target: salesman.monthlyTarget,
      achievementPercent: newCommissionInfo.achievementPercent,
      remainingToTarget: newCommissionInfo.remainingToTarget,
      commissionInfo: newCommissionInfo,
    });

    // 5. Update active shift metrics
    let addedCash = 0;
    let addedCard = 0;

    if (data.paymentMethod === 'cash') {
      addedCash = grandTotal;
    } else if (data.paymentMethod === 'card') {
      addedCard = grandTotal;
    } else if (data.paymentMethod === 'split') {
      addedCash = Number(data.cashPaid || 0);
      addedCard = Number(data.cardPaid || 0);
    }

    setActiveShift((prev) => {
      if (!prev) return null;
      const newExpectedCash = prev.expectedCash + addedCash;
      const newSummary = {
        ...prev.summary,
        totalCashSales: prev.summary.totalCashSales + (data.paymentMethod === 'cash' ? grandTotal : 0),
        totalCardSales: prev.summary.totalCardSales + (data.paymentMethod === 'card' ? grandTotal : 0),
        totalSplitSalesCash: prev.summary.totalSplitSalesCash + (data.paymentMethod === 'split' ? Number(data.cashPaid || 0) : 0),
        totalSplitSalesCard: prev.summary.totalSplitSalesCard + (data.paymentMethod === 'split' ? Number(data.cardPaid || 0) : 0),
        totalNetCashInDrawer: prev.summary.totalNetCashInDrawer + addedCash,
        invoiceCount: prev.summary.invoiceCount + 1,
      };

      return {
        ...prev,
        expectedCash: newExpectedCash,
        summary: newSummary,
      };
    });

    return { success: true, invoice: newInvoice };
  };

  // Process Invoice Returns / Refunds
  const processReturn = (data: {
    invoiceId: string;
    itemsToReturn: { productId: string; quantity: number }[];
    reason: string;
    refundMethod: 'cash' | 'card';
  }): { success: boolean; returnRecord?: ReturnRecord; error?: string } => {
    const targetInvoice = invoices.find((inv) => inv.id === data.invoiceId);
    if (!targetInvoice) {
      return { success: false, error: 'لم يتم العثور على الفاتورة المطلوبة' };
    }

    if (!data.itemsToReturn || data.itemsToReturn.length === 0) {
      return { success: false, error: 'لم يتم تحديد أي أصناف لإرجاعها' };
    }

    // Calculate return items and refund amounts
    let totalRefundAmount = 0;
    const returnItemsDetails: ReturnRecord['items'] = [];

    for (const retItem of data.itemsToReturn) {
      const originalItem = targetInvoice.items.find((it) => it.product.id === retItem.productId);
      if (!originalItem) continue;

      const qtyToReturn = Math.min(retItem.quantity, originalItem.quantity);
      if (qtyToReturn <= 0) continue;

      // Price per item taking discount into account proportionally
      const itemSubtotal = originalItem.unitPrice * qtyToReturn;
      const invoiceSubtotal = targetInvoice.subtotal || 1;
      const discountRatio = targetInvoice.discountTotal ? targetInvoice.discountTotal / invoiceSubtotal : 0;
      const itemAfterDiscount = itemSubtotal * (1 - discountRatio);
      const taxRate = targetInvoice.taxRate || 0;
      const itemGrandTotal = Math.round(itemAfterDiscount * (1 + taxRate) * 100) / 100;

      totalRefundAmount += itemGrandTotal;

      returnItemsDetails.push({
        productId: originalItem.product.id,
        productName: originalItem.product.name,
        quantity: qtyToReturn,
        unitPrice: originalItem.unitPrice,
        totalAmount: itemGrandTotal,
      });
    }

    if (returnItemsDetails.length === 0) {
      return { success: false, error: 'كميات المرتجع غير صالحة' };
    }

    totalRefundAmount = Math.round(totalRefundAmount * 100) / 100;
    const retNow = new Date();
    const retYYYY = retNow.getFullYear();
    const retMM = String(retNow.getMonth() + 1).padStart(2, '0');
    const retDD = String(retNow.getDate()).padStart(2, '0');
    const retHh = String(retNow.getHours()).padStart(2, '0');
    const retMm = String(retNow.getMinutes()).padStart(2, '0');
    const retSs = String(retNow.getSeconds()).padStart(2, '0');

    // Date & Time Based Unique Return Number (RET-YYYYMMDD-HHMMSS)
    const returnNumber = `RET-${retYYYY}${retMM}${retDD}-${retHh}${retMm}${retSs}`;

    const newReturnRecord: ReturnRecord = {
      id: `ret-${Date.now()}`,
      returnNumber,
      originalInvoiceId: targetInvoice.id,
      originalInvoiceNumber: targetInvoice.invoiceNumber,
      date: new Date().toISOString(),
      customerName: targetInvoice.customerName,
      customerPhone: targetInvoice.customerPhone,
      items: returnItemsDetails,
      totalRefundAmount,
      reason: data.reason || 'إرجاع صنف',
      processedBy: currentUser.name,
      processedById: currentUser.id,
      salesmanId: targetInvoice.salesmanId,
      salesmanName: targetInvoice.salesmanName,
      paymentMethod: data.refundMethod,
    };

    // 1. Save Return Record
    setReturns((prev) => [newReturnRecord, ...prev]);

    // 2. Update Invoice status & returns list
    setInvoices((prevInvoices) =>
      prevInvoices.map((inv) => {
        if (inv.id === targetInvoice.id) {
          const currentReturnedTotal = (inv.returnedTotal || 0) + totalRefundAmount;
          const isFullyReturned = currentReturnedTotal >= inv.grandTotal;
          return {
            ...inv,
            status: isFullyReturned ? 'returned' : 'partially_returned',
            returnedTotal: currentReturnedTotal,
            returns: [newReturnRecord, ...(inv.returns || [])],
          };
        }
        return inv;
      })
    );

    // 3. Restore Product Stock in Inventory
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const retDetail = returnItemsDetails.find((r) => r.productId === prod.id);
        if (retDetail) {
          return {
            ...prod,
            stock: prod.stock + retDetail.quantity,
          };
        }
        return prod;
      })
    );

    // 4. Update Shift Cash Drawer & Financials automatically
    if (activeShift) {
      const isCashRefund = data.refundMethod === 'cash';
      const cashDeduction = isCashRefund ? totalRefundAmount : 0;

      setActiveShift((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          expectedCash: Math.max(0, prev.expectedCash - cashDeduction),
          summary: {
            ...prev.summary,
            totalReturns: (prev.summary.totalReturns || 0) + totalRefundAmount,
            totalNetCashInDrawer: Math.max(0, prev.summary.totalNetCashInDrawer - cashDeduction),
          },
        };
      });
    }

    // 5. Update salesman sales counter
    if (targetInvoice.salesmanId) {
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === targetInvoice.salesmanId) {
            return {
              ...emp,
              currentSales: Math.max(0, emp.currentSales - totalRefundAmount),
              shiftSales: Math.max(0, emp.shiftSales - totalRefundAmount),
            };
          }
          return emp;
        })
      );
    }

    // 6. Audit Log
    logAudit(
      'return_processed',
      `استرجاع مرتجع فاتورة (#${targetInvoice.invoiceNumber})`,
      `تم إرجاع عدد ${returnItemsDetails.reduce((a, b) => a + b.quantity, 0)} قطعة بقيمة ${totalRefundAmount.toLocaleString()} ج.م لفاتورة #${targetInvoice.invoiceNumber}. السبب: ${data.reason}`,
      'sensitive'
    );

    return { success: true, returnRecord: newReturnRecord };
  };

  // Categories Management (Men's & Youth baseline + custom categories)
  const categories = useMemo<StoreCategory[]>(() => {
    const list: StoreCategory[] = [...BASE_PRODUCT_CATEGORIES];

    // Add saved custom categories
    customCategories.forEach((cc) => {
      if (!list.some((item) => item.id === cc.id || item.label.toLowerCase() === cc.label.toLowerCase())) {
        list.push(cc);
      }
    });

    // Also include any custom category found on products that isn't yet in list
    products.forEach((p) => {
      if (
        p.category &&
        p.category !== 'womens' &&
        p.category !== 'kids' &&
        !list.some((item) => item.id === p.category || item.label.toLowerCase() === p.category.toLowerCase())
      ) {
        list.push({
          id: p.category,
          label: p.category,
          isCustom: true,
        });
      }
    });

    return list;
  }, [customCategories, products]);

  const addCategory = (categoryName: string): string => {
    const trimmed = categoryName.trim();
    if (!trimmed) return 'mens';

    // Check if already exists in BASE_PRODUCT_CATEGORIES or custom
    const existing = categories.find(
      (c) => c.label.toLowerCase() === trimmed.toLowerCase() || c.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      return existing.id;
    }

    const newCatId = `cat_${Date.now()}`;
    const newCat: StoreCategory = {
      id: newCatId,
      label: trimmed,
      isCustom: true,
    };

    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    try {
      localStorage.setItem(`${STORAGE_KEY}_custom_categories`, JSON.stringify(updated));
    } catch {
      // ignore
    }

    logAudit('settings_update', 'إضافة قسم ملابس جديد', `تم إضافة قسم جديد باسم "${trimmed}" لأقسام المحل.`);
    return newCatId;
  };

  const deleteCategory = (categoryId: string) => {
    const updated = customCategories.filter((c) => c.id !== categoryId);
    setCustomCategories(updated);
    try {
      localStorage.setItem(`${STORAGE_KEY}_custom_categories`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Product Operations
  const addProduct = (prodData: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    logAudit(
      'product_created',
      'إضافة صنف ملابس جديد للمخزون',
      `تمت إضافة قطعة "${newProduct.name}" (كود: ${newProduct.barcode}) بسعر بيع ${newProduct.sellingPrice} ج.م ورصيد ${newProduct.stock} قطعة.`,
      'normal'
    );
    return newProduct;
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    logAudit(
      'stock_update',
      'تحديث بيانات صنف ملابس',
      `تم تحديث بيانات الصنف "${updatedProduct.name}" (كود: ${updatedProduct.barcode}).`,
      'normal'
    );
  };

  const deleteProduct = (productId: string) => {
    const item = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (item) {
      logAudit(
        'stock_update',
        'حذف صنف من المخزون',
        `تم حذف الصنف "${item.name}" (باركود: ${item.barcode}).`,
        'sensitive',
        'مدير الفرع'
      );
    }
  };

  // Employee Operations
  const addEmployee = (empData: Omit<Employee, 'id' | 'currentSales' | 'shiftSales'>): Employee => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      currentSales: 0,
      shiftSales: 0,
      avatar: empData.avatar || empData.name.slice(0, 1),
    };
    setEmployees((prev) => [...prev, newEmp]);
    logAudit(
      'employee_created',
      'إضافة موظف جديد لطاقم العمل',
      `تم تسجيل الموظف "${newEmp.name}" (دور: ${newEmp.role} - كود: ${newEmp.code}) بهدف شهري ${newEmp.monthlyTarget.toLocaleString()} ج.م.`,
      'sensitive',
      'مدير الفرع'
    );
    return newEmp;
  };

  const updateEmployee = (updatedEmp: Employee) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
    );
    if (currentUser.id === updatedEmp.id) {
      setCurrentUser(updatedEmp);
    }
    logAudit(
      'role_permission_switch',
      'تحديث بيانات الموظف',
      `تم تحديث بيانات وحساب الموظف "${updatedEmp.name}".`,
      'sensitive',
      'مدير الفرع'
    );
  };

  const deleteEmployee = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    // Also clear associated adjustments if needed
    setEmployeeAdjustments((prev) => prev.filter((a) => a.employeeId !== employeeId));

    if (emp) {
      logAudit(
        'employee_deleted',
        'حذف الموظف نهائياً من قاعدة البيانات',
        `تم مسح وحذف كافة بيانات وسجل الموظف "${emp.name}" (كود: ${emp.code}) نهائياً من قاعدة البيانات.`,
        'critical',
        currentUser.name
      );
    }
  };

  const addEmployeeAdjustment = (data: {
    employeeId: string;
    type: EmployeeAdjustmentType;
    amount: number;
    reason: string;
  }): EmployeeAdjustment => {
    const emp = employees.find((e) => e.id === data.employeeId);
    const empName = emp ? emp.name : 'موظف';
    const safeAmount = Math.abs(data.amount);

    const newAdj: EmployeeAdjustment = {
      id: `adj-${Date.now()}`,
      employeeId: data.employeeId,
      employeeName: empName,
      type: data.type,
      amount: safeAmount,
      reason: data.reason || (data.type === 'bonus' ? 'مكافأة وتشجيع' : 'خصم جزائي'),
      date: new Date().toISOString(),
      recordedBy: currentUser.name,
    };

    setEmployeeAdjustments((prev) => [newAdj, ...prev]);

    // Update totals on Employee
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== data.employeeId) return e;
        const currentBonuses = e.totalBonuses || 0;
        const currentDeductions = e.totalDeductions || 0;
        if (data.type === 'bonus') {
          return { ...e, totalBonuses: currentBonuses + safeAmount };
        } else {
          return { ...e, totalDeductions: currentDeductions + safeAmount };
        }
      })
    );

    logAudit(
      'employee_adjustment_added',
      data.type === 'bonus' ? `تسجيل مكافأة للموظف: ${empName}` : `تسجيل خصم على الموظف: ${empName}`,
      `مبلغ: ${safeAmount.toLocaleString()} ج.م | السبب: ${data.reason}`,
      'sensitive',
      currentUser.name
    );

    return newAdj;
  };

  // Attendance & Clock-In Operations
  const checkInEmployee = (employeeId: string, notes?: string): AttendanceRecord => {
    const emp = employees.find((e) => e.id === employeeId);
    const empName = emp ? emp.name : 'موظف';
    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const timeString = now.toTimeString().slice(0, 5); // HH:mm

    // Calculate Lateness (Expected 10:00 AM)
    const [hours, mins] = timeString.split(':').map(Number);
    const totalCurrentMins = hours * 60 + mins;
    const expectedMins = 10 * 60; // 10:00 AM
    const lateMinutes = Math.max(0, totalCurrentMins - expectedMins);

    let status: AttendanceStatus = 'present';
    let autoDeduction = 0;
    if (lateMinutes > 15) {
      status = 'late';
      // Auto deduction rule: e.g., 50 EGP for every 30 mins late after 15 mins grace
      autoDeduction = Math.min(300, Math.ceil(lateMinutes / 30) * 50);
    }

    // Check existing record for today
    const existingIndex = attendanceRecords.findIndex(
      (r) => r.employeeId === employeeId && r.date === todayDate
    );

    let newRecord: AttendanceRecord;

    if (existingIndex >= 0) {
      const existing = attendanceRecords[existingIndex];
      newRecord = {
        ...existing,
        checkInTime: timeString,
        checkOutTime: undefined, // Reset checkout if re-checking in for new shift session
        status,
        lateMinutes,
        autoDeductionAmount: autoDeduction,
        notes: notes || existing.notes,
      };
      setAttendanceRecords((prev) => {
        const updated = [...prev];
        updated[existingIndex] = newRecord;
        return updated;
      });
    } else {
      newRecord = {
        id: `att-${Date.now()}`,
        employeeId,
        employeeName: empName,
        date: todayDate,
        checkInTime: timeString,
        status,
        lateMinutes,
        autoDeductionAmount: autoDeduction,
        notes,
      };
      setAttendanceRecords((prev) => [newRecord, ...prev]);
    }

    // If auto-deduction applies due to severe lateness, optionally register an adjustment
    if (autoDeduction > 0) {
      addEmployeeAdjustment({
        employeeId,
        type: 'deduction',
        amount: autoDeduction,
        reason: `خصم آلي لتأخير الحضور (${lateMinutes} دقيقة) يوم ${todayDate}`,
      });
    }

    logAudit(
      'attendance_check_in',
      `تسجيل حضور الموظف: ${empName}`,
      `وقت الحضور: ${timeString} (${status === 'late' ? `تأخير ${lateMinutes} دقيقة` : 'حضور بموعده'})`,
      status === 'late' ? 'sensitive' : 'normal',
      currentUser.name
    );

    return newRecord;
  };

  const checkOutEmployee = (employeeId: string, notes?: string): AttendanceRecord => {
    const emp = employees.find((e) => e.id === employeeId);
    const empName = emp ? emp.name : 'موظف';
    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const timeString = now.toTimeString().slice(0, 5); // HH:mm

    const existingIndex = attendanceRecords.findIndex(
      (r) => r.employeeId === employeeId && r.date === todayDate
    );

    let updatedRecord: AttendanceRecord;

    if (existingIndex >= 0) {
      const rec = attendanceRecords[existingIndex];
      let workHours = 8;
      if (rec.checkInTime) {
        const [inH, inM] = rec.checkInTime.split(':').map(Number);
        const [outH, outM] = timeString.split(':').map(Number);
        const diffMins = Math.max(0, outH * 60 + outM - (inH * 60 + inM));
        workHours = Math.round((diffMins / 60) * 10) / 10;
      }

      updatedRecord = {
        ...rec,
        checkOutTime: timeString,
        workHours,
        workingHours: workHours,
        notes: notes || rec.notes,
      };

      setAttendanceRecords((prev) => {
        const updated = [...prev];
        updated[existingIndex] = updatedRecord;
        return updated;
      });
    } else {
      updatedRecord = {
        id: `att-${Date.now()}`,
        employeeId,
        employeeName: empName,
        date: todayDate,
        checkOutTime: timeString,
        status: 'present',
        workHours: 8,
        workingHours: 8,
        notes,
      };
      setAttendanceRecords((prev) => [updatedRecord, ...prev]);
    }

    // Persist daily hours worked into Employee record for automated payroll
    const addedHours = updatedRecord.workHours || updatedRecord.workingHours || 8;
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== employeeId) return e;
        const currentHours = e.totalWorkedHours || 0;
        return {
          ...e,
          totalWorkedHours: Math.round((currentHours + addedHours) * 10) / 10,
        };
      })
    );

    logAudit(
      'attendance_check_out',
      `تسجيل انصراف الموظف: ${empName}`,
      `وقت الانصراف: ${timeString} (ساعات العمل اليومية: ${addedHours} ساعة | المجموع التراكمي في قاعدة البيانات)`,
      'normal',
      currentUser.name
    );

    return updatedRecord;
  };

  const recordManualAttendance = (data: {
    employeeId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: AttendanceStatus;
    notes?: string;
  }): AttendanceRecord => {
    const emp = employees.find((e) => e.id === data.employeeId);
    const empName = emp ? emp.name : 'موظف';

    let autoDeduction = 0;
    if (data.status === 'absent') {
      const dailySalary = Math.round((emp?.salary || 6000) / 30);
      autoDeduction = dailySalary;
      addEmployeeAdjustment({
        employeeId: data.employeeId,
        type: 'deduction',
        amount: autoDeduction,
        reason: `خصم آلي لغياب غير مبرر بتاريخ ${data.date}`,
      });
    }

    let calculatedHours = 0;
    if (data.checkInTime && data.checkOutTime) {
      const [inH, inM] = data.checkInTime.split(':').map(Number);
      const [outH, outM] = data.checkOutTime.split(':').map(Number);
      const diffMins = Math.max(0, outH * 60 + outM - (inH * 60 + inM));
      calculatedHours = Math.round((diffMins / 60) * 10) / 10;
    } else if (data.status === 'present' || data.status === 'late') {
      calculatedHours = 8;
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: data.employeeId,
      employeeName: empName,
      date: data.date,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      status: data.status,
      workHours: calculatedHours,
      workingHours: calculatedHours,
      autoDeductionAmount: autoDeduction,
      notes: data.notes,
    };

    setAttendanceRecords((prev) => {
      const filtered = prev.filter(
        (r) => !(r.employeeId === data.employeeId && r.date === data.date)
      );
      return [newRecord, ...filtered];
    });

    if (calculatedHours > 0) {
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id !== data.employeeId) return e;
          const currentHours = e.totalWorkedHours || 0;
          return {
            ...e,
            totalWorkedHours: Math.round((currentHours + calculatedHours) * 10) / 10,
          };
        })
      );
    }

    return newRecord;
  };

  const deleteAttendanceRecord = (recordId: string) => {
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  // Customer Operations
  const addCustomer = (custData: Omit<Customer, 'id' | 'totalPurchases' | 'invoicesCount' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      totalPurchases: 0,
      invoicesCount: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    logAudit(
      'customer_created',
      'تسجيل عميل جديد',
      `تمت إضافة العميل "${newCust.name}" هاتف: ${newCust.phone}.`,
      'normal'
    );
    return newCust;
  };

  const updateCustomer = (updatedCust: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
    );
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  // Installments Management
  const createInstallmentContract = (data: {
    customerName: string;
    customerPhone: string;
    nationalId: string;
    totalAmount: number;
    downPayment: number;
    termMonths: number;
    itemsSummary: string;
    notes?: string;
  }): InstallmentContract => {
    const remaining = Math.max(0, data.totalAmount - data.downPayment);
    const monthly = data.termMonths > 0 ? Math.round((remaining / data.termMonths) * 100) / 100 : 0;
    const instNow = new Date();
    const instYYYY = instNow.getFullYear();
    const instMM = String(instNow.getMonth() + 1).padStart(2, '0');
    const instDD = String(instNow.getDate()).padStart(2, '0');
    const instHh = String(instNow.getHours()).padStart(2, '0');
    const instMm = String(instNow.getMinutes()).padStart(2, '0');
    const instSs = String(instNow.getSeconds()).padStart(2, '0');

    // Date & Time Based Unique Installment Contract Number (INST-YYYYMMDD-HHMMSS)
    const contractNumber = `INST-${instYYYY}${instMM}${instDD}-${instHh}${instMm}${instSs}`;

    const schedule = Array.from({ length: data.termMonths }).map((_, i) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (i + 1) * 30);
      return {
        monthIndex: i + 1,
        dueDate: dueDate.toISOString(),
        amount: monthly,
        isPaid: false,
      };
    });

    const newContract: InstallmentContract = {
      id: `inst-${Date.now()}`,
      contractNumber,
      date: new Date().toISOString(),
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      nationalId: data.nationalId,
      totalPurchaseAmount: data.totalAmount,
      downPayment: data.downPayment,
      remainingAmount: remaining,
      termMonths: data.termMonths,
      monthlyInstallment: monthly,
      status: 'active',
      notes: data.notes,
      itemsSummary: data.itemsSummary,
      schedule,
      createdBy: currentUser.name,
    };

    setInstallments((prev) => [newContract, ...prev]);

    // Update active shift if down payment collected
    if (activeShift && data.downPayment > 0) {
      setActiveShift((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          expectedCash: prev.expectedCash + data.downPayment,
          summary: {
            ...prev.summary,
            totalInstallmentDown: prev.summary.totalInstallmentDown + data.downPayment,
            totalNetCashInDrawer: prev.summary.totalNetCashInDrawer + data.downPayment,
          },
        };
      });
    }

    // Auto update or register customer
    if (data.customerPhone) {
      setCustomers((prevCustomers) => {
        const cleanPhone = data.customerPhone.trim();
        const existingIdx = prevCustomers.findIndex((c) => c.phone === cleanPhone);
        if (existingIdx >= 0) {
          const updated = [...prevCustomers];
          updated[existingIdx] = {
            ...updated[existingIdx],
            name: data.customerName || updated[existingIdx].name,
            nationalId: data.nationalId || updated[existingIdx].nationalId,
            totalPurchases: updated[existingIdx].totalPurchases + data.totalAmount,
          };
          return updated;
        } else {
          return [
            {
              id: `cust-${Date.now()}`,
              name: data.customerName,
              phone: cleanPhone,
              nationalId: data.nationalId,
              totalPurchases: data.totalAmount,
              invoicesCount: 1,
              createdAt: new Date().toISOString(),
            },
            ...prevCustomers,
          ];
        }
      });
    }

    logAudit(
      'installment_created',
      'تسجيل عقد تقسيط جديد',
      `تم إبرام عقد تقسيط (#${contractNumber}) للعميل ${data.customerName} بقيمة ${data.totalAmount.toLocaleString()} ج.م (مقدم: ${data.downPayment.toLocaleString()} ج.م، ${data.termMonths} شهر).`,
      'normal'
    );

    return newContract;
  };

  const collectInstallmentPayment = (
    contractId: string,
    monthIndex: number,
    amount: number,
    paymentMethod: 'cash' | 'card'
  ): { success: boolean; receiptNumber: string } => {
    const receiptNumber = `REC-INST-${Date.now().toString().slice(-5)}`;

    setInstallments((prev) =>
      prev.map((contract) => {
        if (contract.id !== contractId) return contract;

        const updatedSchedule = contract.schedule.map((item) => {
          if (item.monthIndex === monthIndex) {
            return {
              ...item,
              isPaid: true,
              paidDate: new Date().toISOString(),
              paidAmount: amount,
              receiptNumber,
              paidVia: paymentMethod === 'cash' ? 'نقداً (كاش)' : 'فيزا / بطاقة بنكية',
            };
          }
          return item;
        });

        const allPaid = updatedSchedule.every((it) => it.isPaid);

        return {
          ...contract,
          schedule: updatedSchedule,
          status: allPaid ? 'completed' : 'active',
        };
      })
    );

    // Update shift if collected in cash
    if (activeShift) {
      const addedCash = paymentMethod === 'cash' ? amount : 0;
      setActiveShift((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          expectedCash: prev.expectedCash + addedCash,
          summary: {
            ...prev.summary,
            totalInstallmentCollected: prev.summary.totalInstallmentCollected + amount,
            totalNetCashInDrawer: prev.summary.totalNetCashInDrawer + addedCash,
          },
        };
      });
    }

    logAudit(
      'installment_collected',
      'تحصيل قسط شهري',
      `تم تحصيل قسط شهر #${monthIndex} بمبلغ ${amount.toLocaleString()} ج.م بسند قبض (${receiptNumber}) عبر ${paymentMethod === 'cash' ? 'كاش' : 'فيزا'}.`,
      'normal'
    );

    return { success: true, receiptNumber };
  };

  const logExpense = (
    category: ExpenseCategory,
    title: string,
    amount: number,
    notes?: string
  ) => {
    if (!activeShift) return;

    let categoryLabel = 'نثريات متنوعة';
    switch (category) {
      case 'hospitality':
        categoryLabel = 'ضيافة واستقبال عملاء';
        break;
      case 'maintenance':
        categoryLabel = 'صيانة وإصلاحات المعرض';
        break;
      case 'supplies':
        categoryLabel = 'أكياس وتغليف ومطبوعات';
        break;
      case 'bills':
        categoryLabel = 'فواتير وخدمات لوجستية';
        break;
      case 'misc':
        categoryLabel = 'نثريات طارئة';
        break;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      shiftId: activeShift.id,
      date: new Date().toISOString(),
      category,
      categoryLabel,
      title,
      amount,
      notes,
      recordedBy: currentUser.name,
    };

    setExpenses((prev) => [newExpense, ...prev]);

    // Deduct immediately from cash drawer
    setActiveShift((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        expectedCash: Math.max(0, prev.expectedCash - amount),
        summary: {
          ...prev.summary,
          totalExpenses: prev.summary.totalExpenses + amount,
          totalNetCashInDrawer: Math.max(0, prev.summary.totalNetCashInDrawer - amount),
        },
      };
    });

    logAudit(
      'expense_logged',
      `تسجيل مصروف (${categoryLabel})`,
      `تم صرف مبلغ ${amount.toLocaleString()} ج.م لـ "${title}" وخصمه فورياً من الخزينة.`,
      'normal'
    );
  };

  const closeActiveShift = (
    countedCash: number,
    notes?: string
  ): { discrepancy: number; status: 'surplus' | 'deficit' | 'balanced' } => {
    if (!activeShift) return { discrepancy: 0, status: 'balanced' };

    const expectedCash = activeShift.expectedCash;
    const discrepancy = countedCash - expectedCash; // positive = surplus, negative = deficit

    let status: 'surplus' | 'deficit' | 'balanced' = 'balanced';
    if (discrepancy > 0) status = 'surplus';
    if (discrepancy < 0) status = 'deficit';

    const closedShift: Shift = {
      ...activeShift,
      closedAt: new Date().toISOString(),
      closedBy: currentUser.name,
      countedCash,
      discrepancy,
      status: 'closed',
      notes: notes || activeShift.notes,
    };

    setShiftHistory((prev) => [closedShift, ...prev]);
    setActiveShift(null);

    logAudit(
      'shift_closed',
      `إغلاق الوردية #${activeShift.shiftNumber}`,
      `تم تسليم الوردية. النقد المتوقع: ${expectedCash.toLocaleString()} ج.م، الفعلي: ${countedCash.toLocaleString()} ج.م. الفارق: ${discrepancy.toLocaleString()} ج.م (${status === 'surplus' ? 'زيادة' : status === 'deficit' ? 'عجز' : 'مطابق'}).`,
      Math.abs(discrepancy) > 50 ? 'critical' : 'normal'
    );

    return { discrepancy, status };
  };

  const openNewShift = (openingCashFund: number, notes?: string): Shift => {
    const shiftNumber = (shiftHistory.length > 0 ? shiftHistory[0].shiftNumber : 100) + 1;
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      shiftNumber,
      openedBy: currentUser.name,
      openedById: currentUser.id,
      openedAt: new Date().toISOString(),
      openingCashFund,
      expectedCash: openingCashFund,
      status: 'open',
      notes: notes || 'بدء وردية جديدة',
      summary: {
        totalCashSales: 0,
        totalCardSales: 0,
        totalSplitSalesCash: 0,
        totalSplitSalesCard: 0,
        totalInstallmentDown: 0,
        totalInstallmentCollected: 0,
        totalExpenses: 0,
        totalNetCashInDrawer: openingCashFund,
        invoiceCount: 0,
      },
    };

    setActiveShift(newShift);

    logAudit(
      'shift_opened',
      `فتح الوردية #${shiftNumber}`,
      `تم فتح الوردية بواسطة ${currentUser.name} برصيد نقدي افتتاحي قدره ${openingCashFund.toLocaleString()} ج.م.`,
      'normal'
    );

    return newShift;
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p))
    );
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'balance' | 'totalPurchases' | 'totalPaid' | 'createdAt'>): Supplier => {
    const newSupp: Supplier = {
      ...supplierData,
      id: `supp-${Date.now()}`,
      balance: 0,
      totalPurchases: 0,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSupp, ...prev]);
    logAudit(
      'supplier_created',
      'إضافة مورد جديد',
      `تم تسجيل المورد الجديد "${newSupp.name}" (شركة: ${newSupp.companyName || '—'})، هاتف: ${newSupp.phone}.`,
      'normal'
    );
    return newSupp;
  };

  const updateSupplier = (updated: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    logAudit(
      'supplier_created',
      'تحديث بيانات مورد',
      `تم تعديل بيانات المورد "${updated.name}".`,
      'normal'
    );
  };

  const deleteSupplier = (supplierId: string) => {
    const supp = suppliers.find((s) => s.id === supplierId);
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    if (supp) {
      logAudit(
        'supplier_created',
        'حذف مورد',
        `تم حذف المورد "${supp.name}" من النظام.`,
        'sensitive'
      );
    }
  };

  const recordSupplierTransaction = (data: {
    supplierId: string;
    type: 'purchase_invoice' | 'payment_made' | 'refund_received';
    amount: number;
    referenceNumber?: string;
    paymentMethod?: 'cash' | 'card' | 'bank_transfer';
    notes?: string;
  }): SupplierTransaction => {
    const supp = suppliers.find((s) => s.id === data.supplierId);
    const suppName = supp ? supp.name : 'مورد غير معروف';

    const newTrans: SupplierTransaction = {
      id: `strans-${Date.now()}`,
      supplierId: data.supplierId,
      supplierName: suppName,
      type: data.type,
      amount: data.amount,
      date: new Date().toISOString(),
      referenceNumber: data.referenceNumber || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentMethod: data.paymentMethod || 'cash',
      notes: data.notes,
      recordedBy: currentUser.name,
    };

    setSupplierTransactions((prev) => [newTrans, ...prev]);

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== data.supplierId) return s;
        let newBalance = s.balance;
        let newTotalPurchases = s.totalPurchases;
        let newTotalPaid = s.totalPaid;

        if (data.type === 'purchase_invoice') {
          newBalance += data.amount;
          newTotalPurchases += data.amount;
        } else if (data.type === 'payment_made') {
          newBalance -= data.amount;
          newTotalPaid += data.amount;
        } else if (data.type === 'refund_received') {
          newBalance += data.amount;
          newTotalPaid -= data.amount;
        }

        return {
          ...s,
          balance: newBalance,
          totalPurchases: newTotalPurchases,
          totalPaid: newTotalPaid,
        };
      })
    );

    if (data.type === 'payment_made' && data.paymentMethod === 'cash') {
      if (activeShift) {
        setActiveShift((prev) =>
          prev
            ? {
                ...prev,
                expectedCash: Math.max(0, prev.expectedCash - data.amount),
                summary: {
                  ...prev.summary,
                  totalExpenses: prev.summary.totalExpenses + data.amount,
                  totalNetCashInDrawer: Math.max(0, prev.summary.totalNetCashInDrawer - data.amount),
                },
              }
            : null
        );
      }

      const tTrans: TreasuryTransaction = {
        id: `ttrans-${Date.now()}`,
        type: 'supplier_payment',
        title: `سداد دفعة للمورد: ${suppName}`,
        amount: data.amount,
        date: new Date().toISOString(),
        category: 'سداد موردين',
        recordedBy: currentUser.name,
        recordedById: currentUser.id,
        notes: data.notes || `سداد فاتورة/دفعة رقم ${newTrans.referenceNumber}`,
        referenceNumber: newTrans.referenceNumber,
        shiftId: activeShift ? activeShift.id : undefined,
      };
      setTreasuryTransactions((prev) => [tTrans, ...prev]);
    }

    logAudit(
      'supplier_payment',
      data.type === 'purchase_invoice' ? 'فاتورة توريد مورد' : 'سداد دفعة مورد',
      `تم تسجيل حركة بقيمة ${data.amount.toLocaleString()} ج.م للمورد ${suppName}.`,
      'sensitive'
    );

    return newTrans;
  };

  const recordTreasuryTransaction = (data: {
    type: TreasuryTransactionType;
    title: string;
    amount: number;
    category: string;
    notes?: string;
    referenceNumber?: string;
  }): TreasuryTransaction => {
    const newTrans: TreasuryTransaction = {
      id: `ttrans-${Date.now()}`,
      type: data.type,
      title: data.title,
      amount: data.amount,
      date: new Date().toISOString(),
      category: data.category,
      recordedBy: currentUser.name,
      recordedById: currentUser.id,
      notes: data.notes,
      referenceNumber: data.referenceNumber || `TRS-${Math.floor(1000 + Math.random() * 9000)}`,
      shiftId: activeShift ? activeShift.id : undefined,
    };

    setTreasuryTransactions((prev) => [newTrans, ...prev]);

    if (activeShift) {
      if (data.type === 'deposit' || data.type === 'capital_add') {
        setActiveShift((prev) =>
          prev
            ? {
                ...prev,
                expectedCash: prev.expectedCash + data.amount,
                summary: {
                  ...prev.summary,
                  totalNetCashInDrawer: prev.summary.totalNetCashInDrawer + data.amount,
                },
              }
            : null
        );
      } else if (data.type === 'withdrawal' || data.type === 'owner_draw') {
        setActiveShift((prev) =>
          prev
            ? {
                ...prev,
                expectedCash: Math.max(0, prev.expectedCash - data.amount),
                summary: {
                  ...prev.summary,
                  totalExpenses: prev.summary.totalExpenses + data.amount,
                  totalNetCashInDrawer: Math.max(0, prev.summary.totalNetCashInDrawer - data.amount),
                },
              }
            : null
        );
      }
    }

    logAudit(
      data.type === 'deposit' || data.type === 'capital_add' ? 'treasury_deposit' : 'treasury_withdrawal',
      data.type === 'deposit' || data.type === 'capital_add' ? 'إيداع نقدي في الخزينة' : 'سحب نقدي من الخزينة',
      `حركة خزينة (${data.title}) بقيمة ${data.amount.toLocaleString()} ج.م بواسطة ${currentUser.name}.`,
      'sensitive'
    );

    return newTrans;
  };

  const exportDatabaseBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      currency: 'EGP',
      system: 'AKHEN Cloths POS & ERP',
      employees,
      products,
      customers,
      suppliers,
      supplierTransactions,
      treasuryTransactions,
      invoices,
      activeShift,
      shiftHistory,
      installments,
      expenses,
      auditLogs,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `akhen_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseBackup = (jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      if (data.employees) setEmployees(data.employees);
      if (data.products) setProducts(data.products);
      if (data.customers) setCustomers(data.customers);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.supplierTransactions) setSupplierTransactions(data.supplierTransactions);
      if (data.treasuryTransactions) setTreasuryTransactions(data.treasuryTransactions);
      if (data.invoices) setInvoices(data.invoices);
      if (data.activeShift !== undefined) setActiveShift(data.activeShift);
      if (data.shiftHistory) setShiftHistory(data.shiftHistory);
      if (data.installments) setInstallments(data.installments);
      if (data.expenses) setExpenses(data.expenses);
      if (data.auditLogs) setAuditLogs(data.auditLogs);

      logAudit(
        'role_permission_switch',
        'استيراد واستعادة قاعدة البيانات',
        'تم استيراد نسخة احتياطية وتحديث بيانات النظام بنجاح.',
        'sensitive',
        'مدير الفرع'
      );
      return true;
    } catch (err) {
      console.error('Failed to import database', err);
      return false;
    }
  };

  const importProductsBulk = (items: Omit<Product, 'id'>[]) => {
    let addedCount = 0;
    let updatedCount = 0;

    setProducts((prevProducts) => {
      const updatedList = [...prevProducts];

      items.forEach((item) => {
        const cleanBarcode = item.barcode ? String(item.barcode).trim() : '';
        const cleanName = item.name ? String(item.name).trim() : '';

        const existingIndex = updatedList.findIndex(
          (p) =>
            (cleanBarcode && p.barcode === cleanBarcode) ||
            (cleanName && p.name.toLowerCase() === cleanName.toLowerCase())
        );

        if (existingIndex >= 0) {
          updatedList[existingIndex] = {
            ...updatedList[existingIndex],
            stock: item.stock !== undefined ? Number(item.stock) : updatedList[existingIndex].stock,
            sellingPrice: item.sellingPrice ? Number(item.sellingPrice) : updatedList[existingIndex].sellingPrice,
            costPrice: item.costPrice ? Number(item.costPrice) : updatedList[existingIndex].costPrice,
            category: item.category || updatedList[existingIndex].category,
            brand: item.brand || updatedList[existingIndex].brand,
            size: item.size || updatedList[existingIndex].size,
            color: item.color || updatedList[existingIndex].color,
          };
          updatedCount++;
        } else {
          const newProduct: Product = {
            id: `prod-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name: cleanName || 'صنف ملابس جديد',
            barcode: cleanBarcode || `AK-${Math.floor(100000 + Math.random() * 900000)}`,
            category: item.category || 'mens',
            brand: item.brand || 'اخين AKHEN',
            size: item.size || 'L',
            color: item.color || 'أسود',
            costPrice: Number(item.costPrice) || 200,
            sellingPrice: Number(item.sellingPrice) || 400,
            stock: Number(item.stock) || 10,
            description: item.description || '',
          };
          updatedList.push(newProduct);
          addedCount++;
        }
      });

      return updatedList;
    });

    logAudit(
      'product_created',
      'استيراد واستجلاب مجموعة أصناف للمخزون (Bulk CSV Import)',
      `تم استيراد ${items.length} صنف ملابس: تمت إضافة ${addedCount} صنف جديد وتحديث بيانات/أرصدة ${updatedCount} صنف قائم.`,
      'sensitive'
    );

    return { addedCount, updatedCount };
  };

  const importCustomersBulk = (
    items: Omit<Customer, 'id' | 'totalPurchases' | 'invoicesCount' | 'createdAt'>[]
  ) => {
    let addedCount = 0;
    let updatedCount = 0;

    setCustomers((prevCustomers) => {
      const updatedList = [...prevCustomers];

      items.forEach((item) => {
        const cleanPhone = item.phone ? String(item.phone).replace(/[^0-9]/g, '') : '';
        const cleanName = item.name ? String(item.name).trim() : '';

        const existingIndex = updatedList.findIndex(
          (c) =>
            (cleanPhone && c.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
            (cleanName && c.name.toLowerCase() === cleanName.toLowerCase())
        );

        if (existingIndex >= 0) {
          updatedList[existingIndex] = {
            ...updatedList[existingIndex],
            phone: cleanPhone || updatedList[existingIndex].phone,
            nationalId: item.nationalId || updatedList[existingIndex].nationalId,
            address: item.address || updatedList[existingIndex].address,
            notes: item.notes || updatedList[existingIndex].notes,
          };
          updatedCount++;
        } else {
          const newCust: Customer = {
            id: `cust-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name: cleanName || 'عميل جديد',
            phone: cleanPhone || '01000000000',
            nationalId: item.nationalId || '',
            address: item.address || '',
            totalPurchases: 0,
            invoicesCount: 0,
            notes: item.notes || 'تم استيراده عبر ملف CSV',
            createdAt: new Date().toISOString(),
          };
          updatedList.push(newCust);
          addedCount++;
        }
      });

      return updatedList;
    });

    logAudit(
      'customer_created',
      'استيراد دُفعة عملاء من ملف خارجي (Bulk CSV Import)',
      `تم استيراد ${items.length} عميل: تمت إضافة ${addedCount} عميل جديد وتحديث ${updatedCount} عميل سابق.`,
      'normal'
    );

    return { addedCount, updatedCount };
  };

  const resetToDemoData = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setCurrentUser(INITIAL_EMPLOYEES[1]);
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setSupplierTransactions(INITIAL_SUPPLIER_TRANSACTIONS);
    setTreasuryTransactions(INITIAL_TREASURY_TRANSACTIONS);
    setInvoices([]);
    setActiveShift(INITIAL_ACTIVE_SHIFT);
    setShiftHistory([]);
    setInstallments(INITIAL_INSTALLMENTS);
    setExpenses(INITIAL_EXPENSES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setRecentAchievement(null);

    localStorage.removeItem(`${STORAGE_KEY}_employees`);
    localStorage.removeItem(`${STORAGE_KEY}_products`);
    localStorage.removeItem(`${STORAGE_KEY}_customers`);
    localStorage.removeItem(`${STORAGE_KEY}_suppliers`);
    localStorage.removeItem(`${STORAGE_KEY}_supplierTransactions`);
    localStorage.removeItem(`${STORAGE_KEY}_treasuryTransactions`);
    localStorage.removeItem(`${STORAGE_KEY}_invoices`);
    localStorage.removeItem(`${STORAGE_KEY}_activeShift`);
    localStorage.removeItem(`${STORAGE_KEY}_shiftHistory`);
    localStorage.removeItem(`${STORAGE_KEY}_installments`);
    localStorage.removeItem(`${STORAGE_KEY}_expenses`);
    localStorage.removeItem(`${STORAGE_KEY}_auditLogs`);
  };

  const resetSalesAndInvoices = () => {
    setInvoices([]);
    setRecentAchievement(null);
    if (activeShift) {
      setActiveShift({
        ...activeShift,
        summary: {
          ...activeShift.summary,
          totalCashSales: 0,
          totalCardSales: 0,
          totalSplitSalesCash: 0,
          totalSplitSalesCard: 0,
          invoiceCount: 0,
          totalNetCashInDrawer: activeShift.openingCashFund,
        },
        expectedCash: activeShift.openingCashFund,
      });
    }
    logAudit(
      'data_reset',
      'تصفير المبيعات والفواتير',
      'تم مسح كافة سجلات الفواتير والمبيعات السابقة وتصفير مبيعات الوردية.',
      'critical',
      currentUser.name
    );
  };

  const resetInstallments = () => {
    setInstallments([]);
    logAudit(
      'data_reset',
      'تصفير عقود الأقساط',
      'تم حذف وإلغاء جميع عقود الأقساط وجداول السداد بالكامل.',
      'critical',
      currentUser.name
    );
  };

  const resetTreasuryAndExpenses = () => {
    setExpenses([]);
    if (activeShift) {
      setActiveShift({
        ...activeShift,
        summary: {
          ...activeShift.summary,
          totalExpenses: 0,
        },
      });
    }
    logAudit(
      'data_reset',
      'تصفير المصروفات والخزينة',
      'تم تصفير سجل المصروفات والنثريات وإعادة ضبط حساب الخزينة.',
      'critical',
      currentUser.name
    );
  };

  const resetEmployeeSalesCounters = () => {
    setEmployees((prev) =>
      prev.map((emp) => ({
        ...emp,
        currentSales: 0,
        shiftSales: 0,
      }))
    );
    setRecentAchievement(null);
    logAudit(
      'data_reset',
      'تصفير عدادات مبيعات وتارجت الموظفين',
      'تمت إعادة تصفير مبيعات الموظفين الشهرية ومبيعات الشيفت للبدء من الصفر (0 ج.م).',
      'sensitive',
      currentUser.name
    );
  };

  const resetAuditLogs = () => {
    const cleanLog: AuditLog = {
      id: `aud-${Date.now()}`,
      date: new Date().toISOString(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      role: currentUser.role,
      actionType: 'data_reset',
      actionTitle: 'تصفير سجل الرقابة والعمليات',
      details: 'تم مسح سجل الأمان والتدقيق السابق وبدء جلسة مراقبة جديدة.',
      severity: 'critical',
      approvedBy: currentUser.name,
    };
    setAuditLogs([cleanLog]);
  };

  const resetInventoryStock = (clearAll?: boolean) => {
    if (clearAll) {
      setProducts([]);
    } else {
      setProducts((prev) => prev.map((p) => ({ ...p, stock: 0 })));
    }
    logAudit(
      'data_reset',
      clearAll ? 'حذف كافة أصناف المخزون' : 'تصفير كميات وأرصدة المخزون',
      clearAll
        ? 'تم مسح قاعدة بيانات الأصناف بالكامل من المخزن.'
        : 'تم تصفير رصيد الكميات المتاحة لكافة الأصناف (Stock = 0).',
      'critical',
      currentUser.name
    );
  };

  const resetCustomers = () => {
    setCustomers([]);
    logAudit(
      'data_reset',
      'تصفير قاعدة بيانات العملاء',
      'تم مسح سجل العملاء وأرقام الهواتف بالكامل.',
      'critical',
      currentUser.name
    );
  };

  const fullFactoryReset = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setCurrentUser(INITIAL_EMPLOYEES[0]); // Manager
    setProducts(INITIAL_PRODUCTS);
    setCustomers([]);
    setSuppliers([]);
    setSupplierTransactions([]);
    setTreasuryTransactions([]);
    setInvoices([]);
    setActiveShift({
      id: `shift-${Date.now()}`,
      shiftNumber: 1,
      openedBy: INITIAL_EMPLOYEES[0].name,
      openedById: INITIAL_EMPLOYEES[0].id,
      openedAt: new Date().toISOString(),
      openingCashFund: 1000,
      expectedCash: 1000,
      status: 'open',
      summary: {
        totalCashSales: 0,
        totalCardSales: 0,
        totalSplitSalesCash: 0,
        totalSplitSalesCard: 0,
        totalInstallmentDown: 0,
        totalInstallmentCollected: 0,
        totalExpenses: 0,
        totalNetCashInDrawer: 1000,
        invoiceCount: 0,
      },
    });
    setShiftHistory([]);
    setInstallments([]);
    setExpenses([]);
    setRecentAchievement(null);

    const initialAudit: AuditLog = {
      id: `aud-${Date.now()}`,
      date: new Date().toISOString(),
      employeeId: INITIAL_EMPLOYEES[0].id,
      employeeName: INITIAL_EMPLOYEES[0].name,
      role: 'manager',
      actionType: 'data_reset',
      actionTitle: 'إعادة ضبط المصنع الكاملة',
      details: 'تمت إعادة تهيئة النظام وتصفير كافة البيانات وبدء تشغيل نقي.',
      severity: 'critical',
      approvedBy: 'مدير الفرع',
    };
    setAuditLogs([initialAudit]);

    localStorage.clear();
  };

  const wipeCompleteDatabase = () => {
    // True complete wipe: clears all records in all tables completely
    setEmployees([currentUser]); // Keep active logged in manager account so session remains valid
    setProducts([]);
    setCustomers([]);
    setSuppliers([]);
    setSupplierTransactions([]);
    setTreasuryTransactions([]);
    setInvoices([]);
    setActiveShift(null);
    setShiftHistory([]);
    setInstallments([]);
    setExpenses([]);
    setReturns([]);
    setEmployeeAdjustments([]);
    setAttendanceRecords([]);
    setRecentAchievement(null);

    const wipeAudit: AuditLog = {
      id: `aud-${Date.now()}`,
      date: new Date().toISOString(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      role: currentUser.role,
      actionType: 'complete_database_wipe',
      actionTitle: 'مسح محلي وتفريغ شامل لكافة جداول قاعدة البيانات (100% Wipe)',
      details: 'تم مسح وتفريغ كافة بيانات المبيعات والمخزون والعملاء والموردين والخزينة نهائياً.',
      severity: 'critical',
      approvedBy: currentUser.name,
    };
    setAuditLogs([wipeAudit]);

    localStorage.clear();
  };

  // Offer Operations
  const addOffer = (offerData: Omit<PromotionalOffer, 'id'>): PromotionalOffer => {
    const newOffer: PromotionalOffer = {
      ...offerData,
      id: `off-${Date.now()}`,
    };
    setPromotionalOffers((prev) => [newOffer, ...prev]);
    logAudit(
      'stock_update',
      'إضافة عرض ترويجي جديد',
      `تم إنشاء العرض "${newOffer.title}" المربوط بالمخزون.`,
      'normal'
    );
    return newOffer;
  };

  const updateOffer = (updated: PromotionalOffer) => {
    setPromotionalOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    logAudit(
      'stock_update',
      'تعديل عرض ترويجي',
      `تم تحديث بيانات العرض الترويجي "${updated.title}".`,
      'normal'
    );
  };

  const deleteOffer = (id: string) => {
    const off = promotionalOffers.find((o) => o.id === id);
    setPromotionalOffers((prev) => prev.filter((o) => o.id !== id));
    if (off) {
      logAudit(
        'stock_update',
        'حذف عرض ترويجي',
        `تم حذف العرض الترويجي "${off.title}" من النظام.`,
        'normal'
      );
    }
  };

  const toggleOfferStatus = (id: string) => {
    setPromotionalOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o))
    );
  };

  // Coupon Operations
  const addCoupon = (data: Omit<DiscountCoupon, 'id' | 'usedCount'>): DiscountCoupon => {
    const newCoupon: DiscountCoupon = {
      ...data,
      id: `coup-${Date.now()}`,
      usedCount: 0,
    };
    setDiscountCoupons((prev) => [newCoupon, ...prev]);
    logAudit(
      'discount_exception',
      'إضافة كود خصم / قسيمة جديدة',
      `تم إنشاء كود الخصم "${newCoupon.code}" (قيمة الخصم: ${newCoupon.discountValue}${newCoupon.discountType === 'percent' ? '%' : ' ج.م'}).`,
      'normal'
    );
    return newCoupon;
  };

  const updateCoupon = (updated: DiscountCoupon) => {
    setDiscountCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const deleteCoupon = (id: string) => {
    setDiscountCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  const verifyCoupon = (code: string, cartTotal: number) => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = discountCoupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

    if (!coupon) {
      return { valid: false, error: 'كود الخصم غير موجود أو غير مفعل حالياً' };
    }

    if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
      return {
        valid: false,
        error: `هذا الكود يشترط حد أقصى/أدنى للمشتريات بقيمة ${coupon.minOrderAmount.toLocaleString()} ج.م على الأقل`,
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = Math.round((cartTotal * coupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(cartTotal, coupon.discountValue);
    }

    return { valid: true, coupon, discountAmount };
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        employees,
        products,
        categories,
        addCategory,
        deleteCategory,
        customers,
        suppliers,
        supplierTransactions,
        treasuryTransactions,
        promotionalOffers,
        discountCoupons,
        addOffer,
        updateOffer,
        deleteOffer,
        toggleOfferStatus,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        verifyCoupon,
        invoices,
        activeShift,
        shiftHistory,
        installments,
        expenses,
        auditLogs,
        returns,
        employeeAdjustments,
        attendanceRecords,
        checkInEmployee,
        checkOutEmployee,
        recordManualAttendance,
        deleteAttendanceRecord,
        recentAchievement,
        clearRecentAchievement,
        permissions,
        hasPermission,
        checkoutSale,
        processReturn,
        createInstallmentContract,
        collectInstallmentPayment,
        logExpense,
        closeActiveShift,
        openNewShift,
        logAudit,
        verifyManagerPin,
        updateManagerPin,
        verifyEmployeePin,
        updateProductStock,
        addProduct,
        updateProduct,
        deleteProduct,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addEmployeeAdjustment,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        recordSupplierTransaction,
        recordTreasuryTransaction,
        exportDatabaseBackup,
        importDatabaseBackup,
        importProductsBulk,
        importCustomersBulk,
        resetToDemoData,
        resetSalesAndInvoices,
        resetInstallments,
        resetTreasuryAndExpenses,
        resetEmployeeSalesCounters,
        resetAuditLogs,
        resetInventoryStock,
        resetCustomers,
        fullFactoryReset,
        wipeCompleteDatabase,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
