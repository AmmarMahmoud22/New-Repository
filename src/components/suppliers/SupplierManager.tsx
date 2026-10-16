import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Supplier, SupplierTransaction } from '../../types';
import {
  Truck,
  Search,
  Plus,
  Phone,
  Building2,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Printer,
  X,
  CreditCard,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Layers,
} from 'lucide-react';

interface SupplierManagerProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({
  onOpenPinModal,
}) => {
  const {
    suppliers,
    supplierTransactions,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    recordSupplierTransaction,
    currentUser,
    permissions,
  } = useStore();

  const isReadOnly = permissions?.readOnly;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due' | 'settled'>('all');

  // Modals state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    contactPerson: '',
    address: '',
    notes: '',
  });

  // Transaction Modal State
  const [showTransModal, setShowTransModal] = useState(false);
  const [selectedSupplierForTrans, setSelectedSupplierForTrans] = useState<Supplier | null>(null);
  const [transData, setTransData] = useState({
    type: 'payment_made' as 'purchase_invoice' | 'payment_made' | 'refund_received',
    amount: 1000,
    referenceNumber: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer',
    notes: '',
  });

  // Statement Modal State
  const [selectedSupplierForStatement, setSelectedSupplierForStatement] = useState<Supplier | null>(null);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q));

      const matchBalance =
        balanceFilter === 'all'
          ? true
          : balanceFilter === 'due'
          ? s.balance > 0
          : s.balance <= 0;

      return matchSearch && matchBalance;
    });
  }, [suppliers, searchQuery, balanceFilter]);

  // Overall Metrics
  const totalPayableToSuppliers = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + Math.max(0, s.balance), 0);
  }, [suppliers]);

  const totalPurchasesSum = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + s.totalPurchases, 0);
  }, [suppliers]);

  const totalPaidSum = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + s.totalPaid, 0);
  }, [suppliers]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      companyName: '',
      phone: '',
      contactPerson: '',
      address: '',
      notes: '',
    });
    setShowSupplierModal(true);
  };

  const handleOpenEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      companyName: s.companyName || '',
      phone: s.phone,
      contactPerson: s.contactPerson || '',
      address: s.address || '',
      notes: s.notes || '',
    });
    setShowSupplierModal(true);
  };

  const handleSubmitSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    if (editingSupplier) {
      updateSupplier({
        ...editingSupplier,
        ...formData,
      });
    } else {
      addSupplier(formData);
    }
    setShowSupplierModal(false);
  };

  const handleDeleteSupplier = (s: Supplier) => {
    if (currentUser.role !== 'manager') {
      onOpenPinModal(`حذف المورد: ${s.name}`, () => deleteSupplier(s.id));
    } else {
      if (window.confirm(`هل أنت تأكد من حذف المورد "${s.name}"؟`)) {
        deleteSupplier(s.id);
      }
    }
  };

  const handleOpenTransModal = (s: Supplier, defaultType: 'purchase_invoice' | 'payment_made' = 'payment_made') => {
    setSelectedSupplierForTrans(s);
    setTransData({
      type: defaultType,
      amount: defaultType === 'payment_made' && s.balance > 0 ? s.balance : 5000,
      referenceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      paymentMethod: 'cash',
      notes: defaultType === 'payment_made' ? 'سداد دفعة للمورد من الخزينة' : 'فاتورة توريد بضاعة جديدة',
    });
    setShowTransModal(true);
  };

  const handleSubmitTrans = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForTrans || transData.amount <= 0) return;

    recordSupplierTransaction({
      supplierId: selectedSupplierForTrans.id,
      type: transData.type,
      amount: transData.amount,
      referenceNumber: transData.referenceNumber,
      paymentMethod: transData.paymentMethod,
      notes: transData.notes,
    });

    setShowTransModal(false);
  };

  // Statement printable print
  const handlePrintStatement = (supplier: Supplier) => {
    const list = supplierTransactions.filter((t) => t.supplierId === supplier.id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>كشف حساب مورد - ${supplier.name}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .summary { margin-top: 20px; text-align: left; font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">اخين AKHEN - كشف حساب مورد تفصيلي</div>
            <div style="font-size: 12px; color: #64748b;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>
          <div class="info">
            <div>
              <strong>اسم المورد:</strong> ${supplier.name}<br/>
              <strong>الشركة:</strong> ${supplier.companyName || '—'}<br/>
              <strong>الهاتف:</strong> ${supplier.phone}
            </div>
            <div>
              <strong>إجمالي المشتريات:</strong> ${supplier.totalPurchases.toLocaleString()} ج.م<br/>
              <strong>إجمالي المسدد:</strong> ${supplier.totalPaid.toLocaleString()} ج.م<br/>
              <strong>الرصيد المستحق الحالي:</strong> ${supplier.balance.toLocaleString()} ج.م
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>نوع الحركة</th>
                <th>رقم المرجع/الفاتورة</th>
                <th>طريقة الدفع</th>
                <th>المبلغ (ج.م)</th>
                <th>الملاحظات</th>
                <th>المسجل بواسطة</th>
              </tr>
            </thead>
            <tbody>
              ${list
                .map(
                  (t) => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString('ar-EG')} ${new Date(t.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>${t.type === 'purchase_invoice' ? 'فاتورة توريد (+)' : t.type === 'payment_made' ? 'سداد دفعة (-)' : 'مرتجع (-)'}</td>
                  <td>${t.referenceNumber || '—'}</td>
                  <td>${t.paymentMethod === 'cash' ? 'نقداً' : t.paymentMethod === 'card' ? 'كارت/فيزا' : 'تحويل بنكي'}</td>
                  <td style="font-weight: bold;">${t.amount.toLocaleString()}</td>
                  <td>${t.notes || '—'}</td>
                  <td>${t.recordedBy}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="summary">
            صافي المستحق للمورد: ${supplier.balance.toLocaleString()} ج.م
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-5">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">عدد الموردين المعتمَدين</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
              {suppliers.length} مورد
            </span>
          </div>
          <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/40 to-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-700 font-medium block">إجمالي المستحقات للموردين</span>
            <span className="text-2xl font-bold font-mono text-rose-700 mt-1 block tabular-nums">
              {totalPayableToSuppliers.toLocaleString()} ج.م
            </span>
          </div>
          <div className="w-11 h-11 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">إجمالي المشتريات والتوريدات</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block tabular-nums">
              {totalPurchasesSum.toLocaleString()} ج.م
            </span>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">إجمالي السدادات والدفعات</span>
            <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block tabular-nums">
              {totalPaidSum.toLocaleString()} ج.م
            </span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Add Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم المورد، اسم الشركة، رقم الهاتف..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setBalanceFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                balanceFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setBalanceFilter('due')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                balanceFilter === 'due'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              علينا مستحقات
            </button>
            <button
              onClick={() => setBalanceFilter('settled')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                balanceFilter === 'settled'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مسدد بالكامل
            </button>
          </div>
        </div>

        {!isReadOnly && (
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مورد جديد</span>
          </button>
        )}
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3.5">اسم المورد والشركة</th>
                <th className="p-3.5">رقم الهاتف والتواصل</th>
                <th className="p-3.5">الشخص المسؤول</th>
                <th className="p-3.5">إجمالي التوريدات</th>
                <th className="p-3.5">إجمالي المسدد</th>
                <th className="p-3.5">الرصيد المستحق (علينا)</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا يوجد موردين مطبقين لهذا البحث.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{s.companyName || 'شركة غير محددة'}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono dir-ltr text-right">
                      <div className="flex items-center gap-1 justify-end text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                      {s.address && (
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {s.address}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-600">
                      {s.contactPerson || '—'}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-slate-900 tabular-nums">
                      {s.totalPurchases.toLocaleString()} ج.م
                    </td>

                    <td className="p-3.5 font-mono font-bold text-emerald-600 tabular-nums">
                      {s.totalPaid.toLocaleString()} ج.م
                    </td>

                    <td className="p-3.5">
                      {s.balance > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg text-xs">
                          {s.balance.toLocaleString()} ج.م
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px]">
                          <CheckCircle className="w-3 h-3" />
                          <span>خالي من المستحقات</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Statement Button */}
                        <button
                          onClick={() => setSelectedSupplierForStatement(s)}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                          title="عرض كشف حساب تفصيلي"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          <span>كشف حساب</span>
                        </button>

                        {!isReadOnly && (
                          <>
                            {/* Pay/Invoice Transaction Button */}
                            <button
                              onClick={() => handleOpenTransModal(s, s.balance > 0 ? 'payment_made' : 'purchase_invoice')}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                              title="تسجيل سداد دفعة أو فاتورة توريد"
                            >
                              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                              <span>دفع/توريد</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditModal(s)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="تعديل بيانات المورد"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteSupplier(s)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف المورد"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>{editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</span>
              </h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم المورد *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: مصنع ميلانو للملابس"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">اسم الشركة / المؤسسة</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="شركة ميلانو للنسيج"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">رقم الهاتف *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الشخص المسؤول</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="المهندس أحمد مصطفى"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">العنوان / المنطقة</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="العاشر من رمضان - المنطقة الصناعية"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="مورد متكفل ببدل رجالي تركية وقسومات خصم..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-xs"
                >
                  {editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Transaction Modal (Purchase Invoice or Payment) */}
      {showTransModal && selectedSupplierForTrans && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>تسجيل حركة للمورد: {selectedSupplierForTrans.name}</span>
              </h3>
              <button
                onClick={() => setShowTransModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
              <span>الرصيد المستحق حالياً:</span>
              <span className="font-mono font-bold text-rose-600">
                {selectedSupplierForTrans.balance.toLocaleString()} ج.م
              </span>
            </div>

            <form onSubmit={handleSubmitTrans} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">نوع الحركة *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransData({ ...transData, type: 'payment_made' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      transData.type === 'payment_made'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>سداد دفعة للمورد</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransData({ ...transData, type: 'purchase_invoice' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      transData.type === 'purchase_invoice'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>فاتورة توريد بضاعة</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">المبلغ (ج.م) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transData.amount}
                  onChange={(e) => setTransData({ ...transData, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">رقم الفاتورة / المرجع</label>
                  <input
                    type="text"
                    value={transData.referenceNumber}
                    onChange={(e) => setTransData({ ...transData, referenceNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">طريقة الوسيلة</label>
                  <select
                    value={transData.paymentMethod}
                    onChange={(e) =>
                      setTransData({
                        ...transData,
                        paymentMethod: e.target.value as 'cash' | 'card' | 'bank_transfer',
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="cash">نقداً من الخزينة</option>
                    <option value="card">كارت / فيزا</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ملاحظات وتفاصيل الحركة</label>
                <input
                  type="text"
                  value={transData.notes}
                  onChange={(e) => setTransData({ ...transData, notes: e.target.value })}
                  placeholder="سداد دفعة تحت الحساب لمورد البدلية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  تأكيد وتسجيل الحركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal / Printable Statement */}
      {selectedSupplierForStatement && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600" />
                  <span>كشف حساب مورد: {selectedSupplierForStatement.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  عرض كافه التوريدات والسدادات والرصيد المتبقي
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintStatement(selectedSupplierForStatement)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة كشف الحساب</span>
                </button>
                <button
                  onClick={() => setSelectedSupplierForStatement(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Header info card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">اسم الشركة:</span>
                <span className="font-bold text-slate-900">{selectedSupplierForStatement.companyName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">رقم الهاتف:</span>
                <span className="font-bold font-mono text-slate-900 dir-ltr">{selectedSupplierForStatement.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">إجمالي التوريدات:</span>
                <span className="font-bold font-mono text-slate-900">{selectedSupplierForStatement.totalPurchases.toLocaleString()} ج.م</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">الرصيد المستحق الحالي:</span>
                <span className="font-bold font-mono text-rose-600">{selectedSupplierForStatement.balance.toLocaleString()} ج.م</span>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">المرجع/الفاتورة</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">الملاحظات</th>
                    <th className="p-3">الموظف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {supplierTransactions.filter((t) => t.supplierId === selectedSupplierForStatement.id).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        لا توجد حركات مسجلة لهذا المورد بعد.
                      </td>
                    </tr>
                  ) : (
                    supplierTransactions
                      .filter((t) => t.supplierId === selectedSupplierForStatement.id)
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500 font-mono">
                            {new Date(t.date).toLocaleDateString('ar-EG')} {new Date(t.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3">
                            {t.type === 'purchase_invoice' ? (
                              <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold">
                                فاتورة توريد (+)
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                سداد دفعة (-)
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-600">{t.referenceNumber || '—'}</td>
                          <td className="p-3 font-mono font-bold text-slate-900 tabular-nums">
                            {t.amount.toLocaleString()} ج.م
                          </td>
                          <td className="p-3 text-slate-600">{t.notes || '—'}</td>
                          <td className="p-3 text-slate-500">{t.recordedBy}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSupplierForStatement(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
