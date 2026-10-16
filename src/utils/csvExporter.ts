import { Product, Invoice, Employee, Customer, Shift, ReturnRecord } from '../types';

/**
 * Utility to download CSV files formatted with UTF-8 BOM for full Arabic character support in Microsoft Excel.
 */
export const downloadCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows || rows.length === 0) {
    alert('لا توجد بيانات متاحة للتصدير حالياً.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? '';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ];

  // \uFEFF is UTF-8 Byte Order Mark (BOM) to force Excel to open with Arabic encoding
  const csvString = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 1. Export Inventory Products to CSV
export const exportInventoryToCSV = (products: Product[]) => {
  const categoryLabels: Record<string, string> = {
    mens: 'رجالي كاجوال',
    youth: 'شبابي وعصري',
    formal: 'رسمي وبدل',
  };

  const rows = products.map((p) => ({
    'كود الباركود': p.barcode,
    'اسم صنف الملابس': p.name,
    'القسم': categoryLabels[p.category] || p.category,
    'الماركة / العلامة': p.brand,
    'المقاس': p.size,
    'اللون': p.color,
    'سعر التكلفة (ج.م)': p.costPrice ?? 0,
    'سعر البيع (ج.م)': p.sellingPrice ?? 0,
    'الرصيد المتاح (قطع)': p.stock,
    'إجمالي قيمة المخزون بسعر البيع (ج.م)': (p.sellingPrice ?? 0) * p.stock,
    'حالة المخزون': p.stock === 0 ? 'نفذت الكمية' : p.stock <= 10 ? 'رصيد منخفض (نواقص)' : 'متوفر بكثرة',
  }));

  downloadCSV('تقرير_المخزون_والأصناف_AKHEN', rows);
};

// 2. Export Sales Invoices to CSV
export const exportSalesToCSV = (invoices: Invoice[]) => {
  const paymentMethodLabels: Record<string, string> = {
    cash: 'نقدي (كاش)',
    card: 'بطاقة إلكترونية (فيزا)',
    split: 'مزدوج (كاش + فيزا)',
    installment: 'تقسيط شهري',
  };

  const rows = invoices.map((inv) => {
    const itemsSummary = inv.items
      .map((item) => `${item.product.name} [كمية: ${item.quantity} × ${item.unitPrice} ج.م]`)
      .join(' | ');

    return {
      'رقم الفاتورة': inv.invoiceNumber,
      'تاريخ ووقت الفاتورة': new Date(inv.date).toLocaleString('ar-EG'),
      'البائع المسؤول': inv.salesmanName || 'غير محدد',
      'الكاشير المنفذ': inv.cashierName || 'غير محدد',
      'اسم العميل': inv.customerName || 'عميل نقدي',
      'رقم هاتف العميل': inv.customerPhone || '—',
      'طريقة الدفع': paymentMethodLabels[inv.paymentMethod] || inv.paymentMethod,
      'بيان المنتجات والمبيعات': itemsSummary,
      'المجموع الفرعي (ج.م)': inv.subtotal,
      'إجمالي الخصم الممنوح (ج.م)': inv.discountTotal,
      'ضريبة القيمة المضافة (ج.م)': inv.taxTotal,
      'الإجمالي النهائي (ج.م)': inv.grandTotal,
      'حالة الفاتورة': inv.status === 'returned' ? 'مرتجعة بالكامل' : inv.status === 'partially_returned' ? 'مرتجعة جزئياً' : 'مدفوعة ومكتملة',
    };
  });

  downloadCSV('تقرير_مبيعات_الفواتير_AKHEN', rows);
};

// 3. Export Sales & Inventory Comprehensive Summary Report to CSV
export const exportComprehensiveReportCSV = (
  products: Product[],
  invoices: Invoice[],
  returns: ReturnRecord[]
) => {
  // Combine sales summary metrics
  const totalInvoices = invoices.length;
  const totalSalesRevenue = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalDiscounts = invoices.reduce((sum, i) => sum + i.discountTotal, 0);
  const totalReturnsCount = returns.length;
  const totalRefundsAmount = returns.reduce((sum, r) => sum + r.totalRefundAmount, 0);
  const netRevenue = totalSalesRevenue - totalRefundsAmount;

  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);

  const summaryRows = [
    {
      'المؤشر / البيان': 'إجمالي عدد فواتير المبيعات الصادرة',
      'القيمة الرقمية': totalInvoices,
      'وصف وحدات القياس': 'فاتورة بيع',
    },
    {
      'المؤشر / البيان': 'إجمالي إيرادات المبيعات (Gross Sales)',
      'القيمة الرقمية': totalSalesRevenue,
      'وصف وحدات القياس': 'جنيه مصري (ج.م)',
    },
    {
      'المؤشر / البيان': 'إجمالي الخصومات والتخفيضات التجارية',
      'القيمة الرقمية': totalDiscounts,
      'وصف وحدات القياس': 'جنيه مصري (ج.م)',
    },
    {
      'المؤشر / البيان': 'إجمالي عدد عمليات المرتجع والاسترجاع',
      'القيمة الرقمية': totalReturnsCount,
      'وصف وحدات القياس': 'عملية مرتجع',
    },
    {
      'المؤشر / البيان': 'إجمالي مبالغ المرتجعات المستردة للعملاء',
      'القيمة الرقمية': totalRefundsAmount,
      'وصف وحدات القياس': 'جنيه مصري (ج.م)',
    },
    {
      'المؤشر / البيان': 'صافي إيرادات المبيعات المحققة (Net Revenue)',
      'القيمة الرقمية': netRevenue,
      'وصف وحدات القياس': 'جنيه مصري (ج.م)',
    },
    {
      'المؤشر / البيان': 'إجمالي عدد قطـع الملابس بالمخزن',
      'القيمة الرقمية': totalStockUnits,
      'وصف وحدات القياس': 'قطعة ملابس',
    },
    {
      'المؤشر / البيان': 'إجمالي القيمة المادية للبضاعة بالمخزن بسعر البيع',
      'القيمة الرقمية': totalStockValue,
      'وصف وحدات القياس': 'جنيه مصري (ج.م)',
    },
  ];

  downloadCSV('تقرير_ملخص_المبيعات_والمخزون_AKHEN', summaryRows);
};

// 4. Export Employees KPI & Sales Performance to CSV
export const exportEmployeesPerformanceCSV = (employees: Employee[]) => {
  const rows = employees.map((emp) => {
    const achievementPercent = Math.round(((emp.currentSales ?? 0) / (emp.monthlyTarget || 1)) * 100);
    const bonusEarned = emp.currentSales >= emp.monthlyTarget ? Math.round(((emp.salary ?? 6000) * (emp.targetBonusPercent || 20)) / 100) : 0;
    const commissionEarned = Math.round(((emp.currentSales ?? 0) * (emp.commissionRate || 2)) / 100);

    return {
      'كود الموظف': emp.code,
      'اسم الموظف': emp.name,
      'الدور الوظيفي': emp.role === 'manager' ? 'مدير فرع' : emp.role === 'cashier' ? 'كاشير' : 'مستشار مبيعات',
      'رقم الهاتف': emp.phone,
      'الراتب الأساسي (ج.م)': emp.salary ?? 6000,
      'الهدف الشهري (التارجت ج.م)': emp.monthlyTarget,
      'المبيعات المحققة (ج.م)': emp.currentSales ?? 0,
      'نسبة إنجاز التارجت (%)': `${achievementPercent}%`,
      'حافز التارجت المستحق (ج.م)': bonusEarned,
      'عمولة المبيعات الفردية (ج.م)': commissionEarned,
      'إجمالي الاستحقاق المالي الحافز (ج.م)': bonusEarned + commissionEarned,
    };
  });

  downloadCSV('تقرير_أداء_وعمولات_الموظفين_AKHEN', rows);
};

// 5. Export Customers Directory to CSV
export const exportCustomersToCSV = (customers: Customer[]) => {
  const rows = customers.map((c) => ({
    'اسم العميل': c.name,
    'رقم الهاتف': c.phone,
    'الرقم القومي': c.nationalId || '—',
    'العنوان': c.address || '—',
    'إجمالي قيمة المشتريات (ج.م)': c.totalPurchases ?? 0,
    'عدد الفواتير': c.invoicesCount ?? 0,
    'تاريخ التسجيل': new Date(c.createdAt).toLocaleDateString('ar-EG'),
    'ملاحظات': c.notes || '—',
  }));

  downloadCSV('تقرير_سجل_العملاء_AKHEN', rows);
};

// 6. Export Shifts & Treasury Log to CSV
export const exportShiftsToCSV = (shiftHistory: Shift[]) => {
  const rows = shiftHistory.map((s) => ({
    'رقم الوردية': s.shiftNumber,
    'فتح بواسطة': s.openedBy,
    'تاريخ ووقت الفتح': new Date(s.openedAt).toLocaleString('ar-EG'),
    'أغلق بواسطة': s.closedBy || '—',
    'تاريخ ووقت الإغلاق': s.closedAt ? new Date(s.closedAt).toLocaleString('ar-EG') : 'نشطة حالياً',
    'النقدية الافتتاحية (ج.م)': s.openingCashFund,
    'النقدية المتوقعة (ج.م)': s.expectedCash,
    'النقدية الفعلية بالدرج (ج.م)': s.countedCash ?? 0,
    'الفارق والتسوية (ج.م)': s.discrepancy ?? 0,
    'عدد الفواتير': s.summary?.invoiceCount ?? 0,
    'إجمالي مبيعات الكاش': s.summary?.totalCashSales ?? 0,
    'إجمالي مبيعات الفيزا': s.summary?.totalCardSales ?? 0,
    'إجمالي المصروفات النثرية': s.summary?.totalExpenses ?? 0,
    'حالة الوردية': s.status === 'open' ? 'نشطة' : 'مغلقة',
  }));

  downloadCSV('تقرير_سجل_الورديات_والخزينة_AKHEN', rows);
};

// 7. Export Installments Contracts to CSV
export const exportInstallmentsToCSV = (installments: any[]) => {
  const rows = installments.map((ins) => {
    const paidItems = ins.schedule ? ins.schedule.filter((s: any) => s.isPaid).length : 0;
    const totalItems = ins.schedule ? ins.schedule.length : ins.termMonths;

    return {
      'رقم العقد': ins.contractNumber,
      'اسم العميل': ins.customerName,
      'رقم الهاتف': ins.customerPhone,
      'الرقم القومي': ins.nationalId,
      'تاريخ العقد': new Date(ins.date).toLocaleDateString('ar-EG'),
      'إجمالي المبلغ (ج.م)': ins.totalPurchaseAmount,
      'المقدم المسدد (ج.م)': ins.downPayment,
      'المتبقي للتقسيط (ج.م)': ins.remainingAmount,
      'عدد الشهور': ins.termMonths,
      'القسط الشهري (ج.م)': ins.monthlyInstallment,
      'عدد الأقساط المسددة': `${paidItems} من ${totalItems}`,
      'حالة العقد': ins.status === 'completed' ? 'مكتمل بالكامل' : ins.status === 'defaulted' ? 'متأخر سداد' : 'ساري ونشط',
      'بيان المشتريات': ins.itemsSummary || '—',
    };
  });

  downloadCSV('تقرير_عقود_التقسيط_AKHEN', rows);
};
