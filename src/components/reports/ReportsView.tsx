import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ReportsSalesCharts } from './ReportsSalesCharts';
import { PerformanceAnalysisTab } from './PerformanceAnalysisTab';
import {
  exportInventoryToCSV,
  exportSalesToCSV,
  exportComprehensiveReportCSV,
  exportEmployeesPerformanceCSV,
  exportCustomersToCSV,
  exportShiftsToCSV,
  exportInstallmentsToCSV,
} from '../../utils/csvExporter';
import {
  parseProductsFromCSV,
  parseCustomersFromCSV,
  downloadProductsCSVTemplate,
  downloadCustomersCSVTemplate,
} from '../../utils/csvImporter';
import {
  FileSpreadsheet,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ReportsViewProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenPinModal }) => {
  const {
    products,
    invoices,
    customers,
    employees,
    shiftHistory,
    activeShift,
    installments,
    returns,
    expenses,
    exportDatabaseBackup,
    importDatabaseBackup,
    importProductsBulk,
    importCustomersBulk,
    currentUser,
    permissions,
  } = useStore();

  const isReadOnly = permissions?.readOnly;

  // Active sub-tab in Reports Center
  const [activeReportSection, setActiveReportSection] = useState<
    'sales' | 'performance' | 'inventory' | 'customers' | 'employees' | 'shifts' | 'import'
  >('sales');

  // Search/Filters inside Reports
  const [salesSearch, setSalesSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

  // Bulk Import state
  const [importType, setImportType] = useState<'products' | 'customers' | 'json'>('products');
  const [importedProductPreview, setImportedProductPreview] = useState<any[]>([]);
  const [importedCustomerPreview, setImportedCustomerPreview] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [rawJsonText, setRawJsonText] = useState('');

  // Financial Summary Aggregates
  const totalInvoices = invoices.length;
  const grossSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalDiscounts = invoices.reduce((sum, inv) => sum + inv.discountTotal, 0);
  const totalRefunds = returns.reduce((sum, ret) => sum + ret.totalRefundAmount, 0);
  const netSales = grossSales - totalRefunds;

  const totalProductsCount = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockValueSelling = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
  const totalStockValueCost = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);

  // File Upload Handlers
  const handleProductCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { items, errors } = parseProductsFromCSV(text);
      setImportedProductPreview(items);
      setParseErrors(errors);
      setImportStatusMessage(`تم العثور على ${items.length} صنف ملابس جاهز للاستيراد.`);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCustomerCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { items, errors } = parseCustomersFromCSV(text);
      setImportedCustomerPreview(items);
      setParseErrors(errors);
      setImportStatusMessage(`تم العثور على ${items.length} عميل جاهز للاستيراد.`);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCommitProductsImport = () => {
    if (importedProductPreview.length === 0) return;
    const executeImport = () => {
      const res = importProductsBulk(importedProductPreview);
      setImportStatusMessage(
        `🎉 تم الاستيراد بنجاح! تمت إضافة ${res.addedCount} صنف جديد وتحديث ${res.updatedCount} صنف قائم.`
      );
      setImportedProductPreview([]);
    };

    if (currentUser.role !== 'manager') {
      onOpenPinModal('اعتماد استيراد دُفعة أصناف للمخزون (Bulk Import)', executeImport);
    } else {
      executeImport();
    }
  };

  const handleCommitCustomersImport = () => {
    if (importedCustomerPreview.length === 0) return;
    const executeImport = () => {
      const res = importCustomersBulk(importedCustomerPreview);
      setImportStatusMessage(
        `🎉 تم استيراد العملاء بنجاح! تمت إضافة ${res.addedCount} عميل جديد وتحديث ${res.updatedCount} عميل سابق.`
      );
      setImportedCustomerPreview([]);
    };

    if (currentUser.role !== 'manager') {
      onOpenPinModal('اعتماد استيراد دُفعة عملاء من ملف خارجي', executeImport);
    } else {
      executeImport();
    }
  };

  const handleCommitJSONRestore = () => {
    if (!rawJsonText.trim()) return;
    const executeRestore = () => {
      const ok = importDatabaseBackup(rawJsonText);
      if (ok) {
        setImportStatusMessage('🎉 تم استعادة نسخة النظام الاحتياطية وتحديث قاعدة البيانات بنجاح!');
        setRawJsonText('');
      } else {
        setImportStatusMessage('❌ خطأ: محتوى الملف غير صحيح أو لا يطابق صيغة JSON المطلوبة.');
      }
    };

    onOpenPinModal('استعادة واستيراد نسخة احتياطية كاملة للنظام', executeRestore);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-mono text-[11px] text-amber-700 uppercase tracking-widest font-bold">
                AKHEN REPORTS & DATA INTEGRATION CENTER
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              <span>مركز التقارير الشاملة والاستيراد والتصدير</span>
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              تحليل مالي ومحاسبي متكامل لحركة المبيعات والمخزون، إمكانية تصدير كافة بيانات النظام بصيغة CSV و
              Excel بترميز لغة عربية سليمة، مع أداة استيراد سريعة لرفع بضاعة وقوائم عملاء جديدة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => exportComprehensiveReportCSV(products, invoices, returns)}
              className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير الميزانية الشاملة (CSV)</span>
            </button>

            <button
              onClick={exportDatabaseBackup}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>نسخة JSON احتياطية</span>
            </button>
          </div>
        </div>

        {/* Realtime KPI Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-200 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">إجمالي فواتير البيع:</div>
            <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
              {totalInvoices} <span className="text-[10px] text-slate-500">فاتورة</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">إجمالي مبيعات الفواتير:</div>
            <div className="font-mono font-bold text-amber-700 text-sm mt-0.5 tabular-nums">
              {grossSales.toLocaleString()} ج.م
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">مبالغ المرتجعات المستردة:</div>
            <div className="font-mono font-bold text-rose-600 text-sm mt-0.5 tabular-nums">
              -{totalRefunds.toLocaleString()} ج.م
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">صافي المبيعات والإيراد:</div>
            <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5 tabular-nums">
              {netSales.toLocaleString()} ج.م
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">إجمالي قطع المخزون:</div>
            <div className="font-mono font-bold text-sky-700 text-sm mt-0.5">
              {totalStockUnits} <span className="text-[10px] text-slate-500">قطعة</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">قيمة بضاعة المحل (بيع):</div>
            <div className="font-mono font-bold text-purple-700 text-sm mt-0.5 tabular-nums">
              {totalStockValueSelling.toLocaleString()} ج.م
            </div>
          </div>
        </div>
      </div>

      {/* Reports Section Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveReportSection('sales')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeReportSection === 'sales'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>تقارير المبيعات والفواتير</span>
        </button>

        <button
          onClick={() => setActiveReportSection('performance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeReportSection === 'performance'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>تحليل الأداء والتوقعات</span>
        </button>

        <button
          onClick={() => setActiveReportSection('inventory')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeReportSection === 'inventory'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>تقارير المخزون والأصناف</span>
        </button>

        <button
          onClick={() => setActiveReportSection('customers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeReportSection === 'customers'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>تقارير العملاء والتقسيط</span>
        </button>

        <button
          onClick={() => setActiveReportSection('employees')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeReportSection === 'employees'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>تقارير أداء الموظفين</span>
        </button>

        <button
          onClick={() => setActiveReportSection('shifts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeReportSection === 'shifts'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>تقارير الخزينة والورديات</span>
        </button>

        <button
          onClick={() => setActiveReportSection('import')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
            activeReportSection === 'import'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <Upload className="w-4 h-4 text-emerald-600" />
          <span>مركز استيراد البيانات (CSV / JSON Import)</span>
        </button>
      </div>

      {/* 1. PERFORMANCE ANALYSIS TAB */}
      {activeReportSection === 'performance' && <PerformanceAnalysisTab />}

      {/* 2. SALES REPORTS SECTION */}
      {activeReportSection === 'sales' && (
        <div className="space-y-6">
          <ReportsSalesCharts />

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span>سجل تقارير الفواتير والمبيعات التفصيلي</span>
              </h3>
              <p className="text-xs text-slate-500">
                قائمة كافـة الفواتير الصادرة مع إمكانية التصفية والتصدير الفوري.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  placeholder="بحث بالفاتورة أو العميل أو البائع..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <button
                onClick={() => exportSalesToCSV(invoices)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير المبيعات (CSV)</span>
              </button>
            </div>
          </div>

          {/* Sales Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-2 font-bold">رقم الفاتورة</th>
                  <th className="pb-3 font-bold">التاريخ والوقت</th>
                  <th className="pb-3 font-bold">العميل</th>
                  <th className="pb-3 font-bold">البائع المسؤول</th>
                  <th className="pb-3 font-bold">طريقة الدفع</th>
                  <th className="pb-3 font-bold">الخصم</th>
                  <th className="pb-3 font-bold">الإجمالي النهائي</th>
                  <th className="pb-3 text-left pl-2 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices
                  .filter(
                    (inv) =>
                      inv.invoiceNumber.toLowerCase().includes(salesSearch.toLowerCase()) ||
                      inv.customerName.toLowerCase().includes(salesSearch.toLowerCase()) ||
                      inv.salesmanName.toLowerCase().includes(salesSearch.toLowerCase())
                  )
                  .map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-2 font-mono font-bold text-amber-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 font-mono text-slate-600">
                        {new Date(inv.date).toLocaleDateString('ar-EG')}{' '}
                        <span className="text-[10px] text-slate-400">
                          ({new Date(inv.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </td>
                      <td className="py-3 text-slate-900 font-bold">
                        {inv.customerName || 'عميل نقدي'}
                      </td>
                      <td className="py-3 text-slate-700">{inv.salesmanName}</td>
                      <td className="py-3">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-semibold text-slate-700">
                          {inv.paymentMethod === 'cash'
                            ? 'كاش'
                            : inv.paymentMethod === 'card'
                            ? 'فيزا'
                            : inv.paymentMethod === 'split'
                            ? 'مزدوج'
                            : 'تقسيط'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-rose-600 font-bold">
                        {inv.discountTotal > 0 ? `-${inv.discountTotal.toLocaleString()} ج.م` : '—'}
                      </td>
                      <td className="py-3 font-mono font-bold text-emerald-700 tabular-nums">
                        {inv.grandTotal.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 text-left pl-2">
                        {inv.status === 'returned' ? (
                          <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                            مرتجعة بالكامل
                          </span>
                        ) : inv.status === 'partially_returned' ? (
                          <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                            مرتجعة جزئياً
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                            مكتملة ومسددة
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* 2. INVENTORY REPORTS SECTION */}
      {activeReportSection === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-sky-600" />
                <span>تقرير جرد الأصناف المتاحة ومقياس القيمة المالية</span>
              </h3>
              <p className="text-xs text-slate-500">
                عرض تقرير الأرصدة المتاحة بالمخزن مع تقييم رأس المال بسعر التكلفة وسعر البيع.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="بحث بالصنف أو الباركود..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <button
                onClick={() => exportInventoryToCSV(products)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير المخزون (CSV)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-2 font-bold">الباركود</th>
                  <th className="pb-3 font-bold">اسم قطعة الملابس</th>
                  <th className="pb-3 font-bold">الماركة / القسم</th>
                  <th className="pb-3 font-bold">سعر التكلفة</th>
                  <th className="pb-3 font-bold">سعر البيع</th>
                  <th className="pb-3 font-bold">الرصيد المتاح</th>
                  <th className="pb-3 text-left pl-2 font-bold">إجمالي قيمة الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products
                  .filter(
                    (p) =>
                      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                      p.barcode.toLowerCase().includes(inventorySearch.toLowerCase())
                  )
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-2 font-mono text-slate-700 font-semibold">{p.barcode}</td>
                      <td className="py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 text-slate-600">{p.brand} ({p.size})</td>
                      <td className="py-3 font-mono text-slate-500">
                        {currentUser.role === 'manager' ? `${p.costPrice.toLocaleString()} ج.م` : 'محمي'}
                      </td>
                      <td className="py-3 font-mono font-bold text-amber-600">
                        {p.sellingPrice.toLocaleString()} ج.م
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold ${
                            p.stock <= 5
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {p.stock} قطعة
                        </span>
                      </td>
                      <td className="py-3 text-left pl-2 font-mono font-bold text-emerald-700">
                        {(p.stock * p.sellingPrice).toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CUSTOMERS & INSTALLMENTS SECTION */}
      {activeReportSection === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>سجل دليل العملاء الأكثر شراءً</span>
              </h3>
              <button
                onClick={() => exportCustomersToCSV(customers)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> CSV العملاء
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-bold">اسم العميل</th>
                    <th className="pb-2 font-bold">الهاتف</th>
                    <th className="pb-2 text-left font-bold">إجمالي المشتريات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customers.slice(0, 15).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-900">{c.name}</td>
                      <td className="py-2.5 font-mono text-emerald-700 font-bold">{c.phone}</td>
                      <td className="py-2.5 text-left font-mono font-bold text-amber-600">
                        {(c.totalPurchases ?? 0).toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-600" />
                <span>تقرير متابعة عقود الأقساط الشهرية</span>
              </h3>
              <button
                onClick={() => exportInstallmentsToCSV(installments)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> CSV العقود
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-bold">رقم العقد</th>
                    <th className="pb-2 font-bold">العميل</th>
                    <th className="pb-2 font-bold">المبلغ المتبقي</th>
                    <th className="pb-2 text-left font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {installments.map((ins) => (
                    <tr key={ins.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono text-amber-700 font-bold">{ins.contractNumber}</td>
                      <td className="py-2.5 font-bold text-slate-900">{ins.customerName}</td>
                      <td className="py-2.5 font-mono font-bold text-sky-700">
                        {ins.remainingAmount.toLocaleString()} ج.م
                      </td>
                      <td className="py-2.5 text-left">
                        {ins.status === 'completed' ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                            مسدد بالكامل
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                            ساري ({ins.termMonths} شهور)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. EMPLOYEES PERFORMANCE SECTION */}
      {activeReportSection === 'employees' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>تقرير أداء الموظفين وإحصائيات تحقيق التارجت والعمولات</span>
              </h3>
              <p className="text-xs text-slate-500">
                متابعة دقيقة لمبيعات البائعين والكاشير وتحديد العمولات المستحقة.
              </p>
            </div>

            <button
              onClick={() => exportEmployeesPerformanceCSV(employees)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير تقرير أداء الموظفين (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-2 font-bold">الموظف</th>
                  <th className="pb-3 font-bold">الدور</th>
                  <th className="pb-3 font-bold">الهدف الشهري (التارجت)</th>
                  <th className="pb-3 font-bold">المبيعات المحققة</th>
                  <th className="pb-3 font-bold">نسبة الإنجاز</th>
                  <th className="pb-3 text-left pl-2 font-bold">الحوافز والعمولات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.map((emp) => {
                  const achievementPercent = Math.round(((emp.currentSales ?? 0) / (emp.monthlyTarget || 1)) * 100);
                  const isAchieved = (emp.currentSales ?? 0) >= (emp.monthlyTarget ?? 0);
                  const bonusEarned = isAchieved ? Math.round(((emp.salary ?? 6000) * (emp.targetBonusPercent || 20)) / 100) : 0;
                  const commissionEarned = Math.round(((emp.currentSales ?? 0) * (emp.commissionRate || 2)) / 100);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-2 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-xs">
                          {emp.name.slice(0, 1)}
                        </div>
                        <div>
                          <div>{emp.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{emp.code}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-semibold text-slate-700">
                          {emp.role === 'manager' ? 'مدير' : emp.role === 'cashier' ? 'كاشير' : 'بائع'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-600">
                        {(emp.monthlyTarget ?? 0).toLocaleString()} ج.م
                      </td>
                      <td className="py-3 font-mono font-bold text-emerald-700">
                        {(emp.currentSales ?? 0).toLocaleString()} ج.م
                      </td>
                      <td className="py-3 font-mono font-bold text-amber-700">
                        {achievementPercent}%
                      </td>
                      <td className="py-3 text-left pl-2 font-mono font-bold text-emerald-700">
                        +{(bonusEarned + commissionEarned).toLocaleString()} ج.م
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SHIFT & TREASURY REPORTS SECTION */}
      {activeReportSection === 'shifts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>تقرير سجل إغلاقات الورديات وحركة النقدية بالدرج</span>
              </h3>
              <p className="text-xs text-slate-500">
                بيان بأرصدة الخزينة وتسويات العجز والزيادة لكافة الورديات السابقة.
              </p>
            </div>

            <button
              onClick={() => exportShiftsToCSV(shiftHistory)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير الورديات (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-2 font-bold">رقم الوردية</th>
                  <th className="pb-3 font-bold">المسؤول</th>
                  <th className="pb-3 font-bold">تاريخ ووقت الإغلاق</th>
                  <th className="pb-3 font-bold">النقد المتوقع</th>
                  <th className="pb-3 font-bold">الدرج الفعلي</th>
                  <th className="pb-3 text-left pl-2 font-bold">الفارق والتسوية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {shiftHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-2 font-mono font-bold text-amber-700">#{s.shiftNumber}</td>
                    <td className="py-3 font-bold text-slate-900">{s.openedBy}</td>
                    <td className="py-3 font-mono text-slate-600">
                      {s.closedAt ? new Date(s.closedAt).toLocaleString('ar-EG') : 'نشطة'}
                    </td>
                    <td className="py-3 font-mono text-slate-600">
                      {s.expectedCash.toLocaleString()} ج.م
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-700">
                      {(s.countedCash ?? s.expectedCash).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 text-left pl-2 font-mono font-bold">
                      {s.discrepancy === 0 ? (
                        <span className="text-emerald-700">مطابق ✓</span>
                      ) : (s.discrepancy ?? 0) > 0 ? (
                        <span className="text-sky-700">+{s.discrepancy?.toLocaleString()} ج.م (زيادة)</span>
                      ) : (
                        <span className="text-rose-600">{s.discrepancy?.toLocaleString()} ج.م (عجز)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. IMPORT DATA CENTER SECTION (CSV / JSON IMPORT) */}
      {activeReportSection === 'import' && (
        <div className="space-y-6">
          {/* Status Alert Banner */}
          {importStatusMessage && (
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{importStatusMessage}</span>
              </div>
              <button
                onClick={() => setImportStatusMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs underline"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Sub Navigation Selector for Import Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setImportType('products')}
              className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between ${
                importType === 'products'
                  ? 'bg-amber-50 border-amber-400 text-slate-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="font-bold text-xs flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>1. استيراد أصناف المخزون (Products CSV)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  رفع ملف CSV تحوي أصناف وبضاعة جديدة لتحديث الأرصدة والأسعار والباركود.
                </p>
              </div>
            </button>

            <button
              onClick={() => setImportType('customers')}
              className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between ${
                importType === 'customers'
                  ? 'bg-amber-50 border-amber-400 text-slate-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="font-bold text-xs flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>2. استيراد دليل العملاء (Customers CSV)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  رفع قائمة عملاء خارجية متضمنة الأسماء وأرقام الهواتف والأرقام القومية.
                </p>
              </div>
            </button>

            <button
              onClick={() => setImportType('json')}
              className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between ${
                importType === 'json'
                  ? 'bg-amber-50 border-amber-400 text-slate-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="font-bold text-xs flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span>3. استعادة النسخة الاحتياطية (Full JSON Backup)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  استعادة شاملة لكافة بيانات النظام والسجلات والفواتير من ملف JSON محفوظ.
                </p>
              </div>
            </button>
          </div>

          {/* 1. IMPORT PRODUCTS CSV BOX */}
          {importType === 'products' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    <span>رفع واستيراد الأصناف من ملف CSV / Excel</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    يمكنك تنزيل النموذج المعتمد، تعبئة البضاعة الجديدة في الإكسل، ثم رفع الملف ليتم دمجها فورياً بالنظام.
                  </p>
                </div>

                <button
                  onClick={downloadProductsCSVTemplate}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs shrink-0"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>تحميل نموذج إكسل جاهز (أصناف المخزون)</span>
                </button>
              </div>

              {/* Upload Dropzone Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50 p-8 rounded-2xl text-center space-y-3 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleProductCSVUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-10 h-10 text-amber-600 mx-auto animate-bounce" />
                <div className="text-xs font-bold text-slate-900">
                  اضغط هنا لاختيار ملف CSV من جهازك أو اسحب الملف وقم بإسقاطه هنا
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  الصيغ المتاحة: CSV (Comma / Tab delimited) بترميز UTF-8
                </p>
              </div>

              {/* Preview Table for Imported Products */}
              {importedProductPreview.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>معاينة البيانات المستخرجة ({importedProductPreview.length} صنف جاهز):</span>
                    </h4>

                    {!isReadOnly && (
                      <button
                        onClick={handleCommitProductsImport}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        <span>اعتماد واستيراد الأصناف إلى قاعدة البيانات</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2.5">الباركود</th>
                          <th className="p-2.5">اسم صنف الملابس</th>
                          <th className="p-2.5">القسم</th>
                          <th className="p-2.5">الماركة</th>
                          <th className="p-2.5">التكلفة</th>
                          <th className="p-2.5">سعر البيع</th>
                          <th className="p-2.5">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {importedProductPreview.slice(0, 50).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-100">
                            <td className="p-2.5 font-mono text-slate-700 font-semibold">{p.barcode}</td>
                            <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                            <td className="p-2.5 text-slate-600">{p.category}</td>
                            <td className="p-2.5 text-slate-600">{p.brand}</td>
                            <td className="p-2.5 font-mono text-slate-600">{p.costPrice} ج.م</td>
                            <td className="p-2.5 font-mono text-amber-700 font-bold">{p.sellingPrice} ج.م</td>
                            <td className="p-2.5 font-mono text-emerald-700 font-bold">{p.stock} قطعة</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. IMPORT CUSTOMERS CSV BOX */}
          {importType === 'customers' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span>رفع واستيراد دليل العملاء من ملف CSV</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    قم برفع ملف الإكسل متضمناً أسماء العملاء، أرقام الموبايل والواتساب، والأرقام القومية.
                  </p>
                </div>

                <button
                  onClick={downloadCustomersCSVTemplate}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-emerald-900 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs shrink-0"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>تحميل نموذج إكسل جاهز (دليل العملاء)</span>
                </button>
              </div>

              {/* Upload Dropzone Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 p-8 rounded-2xl text-center space-y-3 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCustomerCSVUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                <div className="text-xs font-bold text-slate-900">
                  اضغط هنا لاختيار ملف CSV لأسماء وأرقام العملاء من جهازك
                </div>
              </div>

              {/* Preview Table for Imported Customers */}
              {importedCustomerPreview.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>معاينة بيانات العملاء المستخرجة ({importedCustomerPreview.length} عميل):</span>
                    </h4>

                    {!isReadOnly && (
                      <button
                        onClick={handleCommitCustomersImport}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        <span>اعتماد واستيراد العملاء لحسابات النظام</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2.5">اسم العميل</th>
                          <th className="p-2.5">رقم الهاتف (واتساب)</th>
                          <th className="p-2.5">الرقم القومي</th>
                          <th className="p-2.5">العنوان</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {importedCustomerPreview.slice(0, 50).map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-100">
                            <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                            <td className="p-2.5 font-mono text-emerald-700 font-bold">{c.phone}</td>
                            <td className="p-2.5 font-mono text-slate-600">{c.nationalId || '—'}</td>
                            <td className="p-2.5 text-slate-600">{c.address || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. FULL JSON RESTORE BOX */}
          {importType === 'json' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="space-y-1 border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>استعادة واستيراد النسخة الاحتياطية الشاملة (Full System JSON Restore)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  قم بلصق محتوى ملف النسخة الاحتياطية بصيغة JSON لاسترجاع النظام بالكامل.
                </p>
              </div>

              <textarea
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
                placeholder="قم بلصق نص ملف النسخة الاحتياطية JSON هنا..."
                rows={8}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-emerald-800 font-mono focus:outline-none focus:border-amber-500 font-medium"
              />

              {!isReadOnly && (
                <button
                  onClick={handleCommitJSONRestore}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>بدء استعادة واستيراد قاعدة البيانات الآن (يتطلب PIN)</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
