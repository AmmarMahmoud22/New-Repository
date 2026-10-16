import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  CreditCard,
  MapPin,
  ShoppingBag,
  FileText,
  Share2,
  Edit,
  Trash2,
  X,
} from 'lucide-react';

interface CustomerManagerProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  onOpenPinModal,
}) => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    invoices,
    installments,
    currentUser,
    permissions,
  } = useStore();

  const isReadOnly = permissions?.readOnly;

  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nationalId: '',
    address: '',
    notes: '',
  });

  const filteredCustomers = customers.filter((cust) => {
    return (
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.phone.includes(searchQuery) ||
      (cust.nationalId && cust.nationalId.includes(searchQuery)) ||
      (cust.address && cust.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      nationalId: '',
      address: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone,
      nationalId: cust.nationalId || '',
      address: cust.address || '',
      notes: cust.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        ...formData,
      });
    } else {
      addCustomer({
        ...formData,
      });
    }
    setShowModal(false);
  };

  const handleDelete = (cust: Customer) => {
    if (confirm(`هل أنت متأكد من حذف العميل "${cust.name}"؟`)) {
      deleteCustomer(cust.id);
    }
  };

  const handleOpenWhatsApp = (cust: Customer) => {
    const phone = cust.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '20' + phone.substring(1) : phone;
    const msg = `أهلاً بك عميلنا العزيز ${cust.name}، معك *اخين AKHEN* للأزياء والملابس. نسعد دائماً بخدمتكم! ✨👔`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Aggregates
  const totalCustomersCount = customers.length;
  const totalCustomerSpending = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              دليل وسجل العملاء
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            تسجيل بيانات العملاء، أرقام الهواتف والتواصل عبر واتساب، الأرقام القومية للتقسيط،
            ومتابعة إجمالي مشتريات وسجل فواتير كل عميل.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 text-[10px]">إجمالي العملاء</div>
              <div className="text-slate-900 font-mono font-bold">{totalCustomersCount} عميل</div>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <div className="text-slate-500 text-[10px]">إجمالي مشترياتهم</div>
              <div className="text-amber-600 font-mono font-bold tabular-nums">
                {totalCustomerSpending.toLocaleString()} ج.م
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل عميل جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>قائمة العملاء المسجلين</span>
            <span className="text-xs text-amber-800 font-mono bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              {filteredCustomers.length} عميل
            </span>
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف أو الرقم القومي..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 pr-2 font-bold">العميل</th>
                <th className="pb-3 font-bold">رقم الهاتف (واتساب)</th>
                <th className="pb-3 font-bold">الرقم القومي</th>
                <th className="pb-3 font-bold">العنوان / المنطقة</th>
                <th className="pb-3 font-bold">إجمالي المشتريات</th>
                <th className="pb-3 text-left pl-2 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    لا يوجد عملاء مسجلين يطابقون البحث.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="font-bold text-slate-900 text-xs">{cust.name}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        آخر عملية: {invoices.filter(inv => inv.customerName === cust.name).length} عملية شرائية
                      </div>
                      {cust.notes && (
                        <div className="text-[10px] text-slate-500">{cust.notes}</div>
                      )}
                    </td>
                    <td className="py-3 font-mono text-emerald-700 font-bold">
                      <button
                        onClick={() => handleOpenWhatsApp(cust)}
                        className="hover:underline flex items-center gap-1"
                        title="مراسلة العميل عبر واتساب"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{cust.phone}</span>
                      </button>
                    </td>
                    <td className="py-3 font-mono text-slate-600">
                      {cust.nationalId || '—'}
                    </td>
                    <td className="py-3 text-slate-600">
                      {cust.address ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.address}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-600 tabular-nums">
                      {(cust.totalPurchases ?? 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 text-left pl-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenWhatsApp(cust)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] flex items-center gap-1 transition-colors font-semibold"
                          title="واتساب"
                        >
                          <Share2 className="w-3 h-3 text-emerald-600" />
                          <span>واتساب</span>
                        </button>

                        {!isReadOnly && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(cust)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] flex items-center gap-1 transition-colors border border-slate-200"
                              title="تعديل بيانات العميل"
                            >
                              <Edit className="w-3 h-3 text-sky-600" />
                              <span>تعديل</span>
                            </button>

                            <button
                              onClick={() => handleDelete(cust)}
                              className="p-1 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg transition-colors border border-slate-200"
                              title="حذف العميل"
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

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <span>{editingCustomer ? 'تعديل بيانات العميل' : 'تسجيل عميل جديد'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">اسم العميل بالكامل *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: محمد سعيد الألفي"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">رقم الهاتف (واتساب) *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">الرقم القومي (14 رقم)</label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="29XXXXXXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">العنوان / المنطقة</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="مثال: القاهرة - مصر الجديدة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="تفضيلات المقاس، عميل مميز..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 resize-none font-medium"
                />
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
                  {editingCustomer ? 'حفظ التعديل' : 'تسجيل العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
