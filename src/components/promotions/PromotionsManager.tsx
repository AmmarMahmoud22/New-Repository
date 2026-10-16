import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PromotionalOffer, DiscountCoupon, OfferType, ProductCategory } from '../../types';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Percent,
  Gift,
  Package,
  Calendar,
  X,
  Search,
  DollarSign,
  Ticket,
} from 'lucide-react';

interface PromotionsManagerProps {
  onOpenPinModal?: (actionTitle: string, onSuccess: () => void) => void;
}

export const PromotionsManager: React.FC<PromotionsManagerProps> = ({
  onOpenPinModal,
}) => {
  const {
    promotionalOffers,
    discountCoupons,
    products,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    currentUser,
    permissions,
  } = useStore();

  const isReadOnly = permissions.readOnly;

  // Active Sub-Tab: 'offers' (العروض المربوطة بالمخزون) vs 'coupons' (أكواد وقسائم الخصم)
  const [activeSubTab, setActiveSubTab] = useState<'offers' | 'coupons'>('offers');

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingEmployeeOffer] = useState<PromotionalOffer | null>(null);
  const [offerForm, setOfferForm] = useState<{
    title: string;
    type: OfferType;
    productIds: string[];
    category: ProductCategory;
    discountPercent: number;
    discountAmount: number;
    bundlePrice: number;
    minQuantity: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    notes: string;
  }>({
    title: '',
    type: 'bundle',
    productIds: [],
    category: 'mens',
    discountPercent: 10,
    discountAmount: 100,
    bundlePrice: 1500,
    minQuantity: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isActive: true,
    notes: '',
  });

  // Coupon Modal State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);
  const [couponForm, setCouponForm] = useState<{
    code: string;
    title: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    maxUses: number;
    isActive: boolean;
  }>({
    code: '',
    title: '',
    discountType: 'percent',
    discountValue: 10,
    minOrderAmount: 500,
    maxUses: 100,
    isActive: true,
  });

  // Open Offer Modal
  const handleOpenAddOffer = () => {
    setEditingEmployeeOffer(null);
    setOfferForm({
      title: '',
      type: 'bundle',
      productIds: products.slice(0, 2).map((p) => p.id),
      category: 'mens',
      discountPercent: 15,
      discountAmount: 100,
      bundlePrice: 1200,
      minQuantity: 1,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      isActive: true,
      notes: '',
    });
    setShowOfferModal(true);
  };

  const handleOpenEditOffer = (offer: PromotionalOffer) => {
    setEditingEmployeeOffer(offer);
    setOfferForm({
      title: offer.title,
      type: offer.type,
      productIds: offer.productIds || [],
      category: offer.category || 'mens',
      discountPercent: offer.discountPercent || 10,
      discountAmount: offer.discountAmount || 100,
      bundlePrice: offer.bundlePrice || 1000,
      minQuantity: offer.minQuantity || 1,
      startDate: offer.startDate || new Date().toISOString().slice(0, 10),
      endDate: offer.endDate || new Date().toISOString().slice(0, 10),
      isActive: offer.isActive,
      notes: offer.notes || '',
    });
    setShowOfferModal(true);
  };

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.title.trim()) return;

    if (editingOffer) {
      updateOffer({
        ...editingOffer,
        ...offerForm,
      });
    } else {
      addOffer({
        ...offerForm,
      });
    }
    setShowOfferModal(false);
  };

  // Open Coupon Modal
  const handleOpenAddCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: `AKHEN${Math.floor(10 + Math.random() * 90)}`,
      title: '',
      discountType: 'percent',
      discountValue: 10,
      minOrderAmount: 500,
      maxUses: 100,
      isActive: true,
    });
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = (coupon: DiscountCoupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxUses: coupon.maxUses || 0,
      isActive: coupon.isActive,
    });
    setShowCouponModal(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim() || !couponForm.title.trim()) return;

    if (editingCoupon) {
      updateCoupon({
        ...editingCoupon,
        ...couponForm,
      });
    } else {
      addCoupon({
        ...couponForm,
      });
    }
    setShowCouponModal(false);
  };

  const filteredOffers = promotionalOffers.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.notes && o.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCoupons = discountCoupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              إدارة العروض والخصومات والمبيعات الترويجية
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            ربط الأصناف بباكجات وعروض تجميعية، إنشاء أكواد وقسائم خصم سريعة لاستخدامها في POS،
            وتحديد صلاحيات العروض الترويجية لزيادة المبيعات.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2 shrink-0">
            {activeSubTab === 'offers' ? (
              <button
                onClick={handleOpenAddOffer}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عرض مجمع / خصم صنف</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddCoupon}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء كود / قسيمة خصم</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('offers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'offers'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>العروض والباكجات المربوطة بالمخزون ({promotionalOffers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('coupons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'coupons'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>أكواد وقسائم الخصم ({discountCoupons.length})</span>
          </button>
        </div>

        <div className="relative w-64 hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في العروض وأكواد الخصم..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Sub-Tab 1: Promotional Offers Linked to Inventory */}
      {activeSubTab === 'offers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOffers.length === 0 ? (
              <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium">
                لا توجد عروض ترويجية مسجلة حالياً. اضغط على زر "إضافة عرض مجمع" لإنشاء عرض جديد!
              </div>
            ) : (
              filteredOffers.map((offer) => {
                const linkedProducts = products.filter((p) =>
                  offer.productIds?.includes(p.id)
                );

                return (
                  <div
                    key={offer.id}
                    className={`bg-white border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-xs ${
                      offer.isActive
                        ? 'border-amber-300 hover:border-amber-400'
                        : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                            <Gift className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {offer.title}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-500">
                              {offer.type === 'bundle'
                                ? '📦 عرض حزمة مجمعة'
                                : offer.type === 'product_discount'
                                ? '🏷️ خصم على صنف محدد'
                                : '📂 خصم على قسم'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleOfferStatus(offer.id)}
                          className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            offer.isActive
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {offer.isActive ? 'مفعل 🟢' : 'معطل ⚪'}
                        </button>
                      </div>

                      {/* Offer Value Badge */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 space-y-1">
                        {offer.type === 'bundle' ? (
                          <div className="flex justify-between items-center text-amber-900">
                            <span>سعر الحزمة المجمعة:</span>
                            <span className="font-mono text-sm font-black">
                              {offer.bundlePrice?.toLocaleString()} ج.م
                            </span>
                          </div>
                        ) : offer.discountPercent ? (
                          <div className="flex justify-between items-center text-emerald-800">
                            <span>نسبة الخصم المحددة:</span>
                            <span className="font-mono text-sm font-black">
                              {offer.discountPercent}% خصم
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center text-emerald-800">
                            <span>قيمة الخصم المباشر:</span>
                            <span className="font-mono text-sm font-black">
                              {offer.discountAmount?.toLocaleString()} ج.م
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[11px] text-slate-500 font-normal">
                          <span>الحد الأدنى للقطع: {offer.minQuantity || 1} قطعة</span>
                          <span>الصلاحية: حتى {offer.endDate || 'مفتوح'}</span>
                        </div>
                      </div>

                      {/* Linked Inventory Items */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block">
                          الأصناف المرتبطة من المخزون:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {linkedProducts.length === 0 ? (
                            <span className="text-[10px] text-slate-400">
                              كل الأصناف المتاحة
                            </span>
                          ) : (
                            linkedProducts.map((p) => (
                              <span
                                key={p.id}
                                className="bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-medium px-2 py-0.5 rounded-lg"
                              >
                                {p.name} ({p.sellingPrice} ج.م)
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {offer.notes && (
                        <p className="text-[11px] text-slate-500 italic">
                          "{offer.notes}"
                        </p>
                      )}
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenEditOffer(offer)}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل العرض</span>
                        </button>

                        <button
                          onClick={() => deleteOffer(offer.id)}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1 border border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Discount Coupons & Promo Codes */}
      {activeSubTab === 'coupons' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-600" />
                <span>أكواد وقسائم الخصم السريعة (Discount Coupons)</span>
              </h3>
              <p className="text-xs text-slate-500">
                يمكن استخدام هذه الأكواد مباشرة في نافذة البيع والكاشير لتطبيق الخصم تلقائياً عند طلب العميل.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود الخصم (Coupon Code)</th>
                    <th className="p-3">عنوان العرض / القسيمة</th>
                    <th className="p-3">نوع وقيمة الخصم</th>
                    <th className="p-3">الحد الأدنى للفاتورة</th>
                    <th className="p-3">عدد مرات الاستخدام</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        لا توجد أكواد خصم مسجلة حالياً. اضغط على زر "إنشاء كود / قسيمة خصم" للبدء.
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-black text-sm text-emerald-700">
                          <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            {coupon.code}
                          </span>
                        </td>

                        <td className="p-3 font-bold text-slate-900">
                          {coupon.title}
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-800">
                          {coupon.discountType === 'percent'
                            ? `%${coupon.discountValue} خصم`
                            : `${coupon.discountValue.toLocaleString()} ج.م خصم`}
                        </td>

                        <td className="p-3 font-mono text-slate-600">
                          {coupon.minOrderAmount
                            ? `${coupon.minOrderAmount.toLocaleString()} ج.م`
                            : 'بدون حد أدنى'}
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-800">
                          {coupon.usedCount} مرة
                        </td>

                        <td className="p-3">
                          {coupon.isActive ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              مفعل وساري 🟢
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              غير مفعل ⚪
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {!isReadOnly && (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditCoupon(coupon)}
                                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="تعديل القسيمة"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteCoupon(coupon.id)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="حذف القسيمة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🎁 Modal: Add/Edit Promotional Offer */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <span>{editingOffer ? 'تعديل العرض الترويجي' : 'إضافة عرض ترويجي جديد'}</span>
              </h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">
                  عنوان اسم العرض الترويجي *
                </label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  placeholder="مثال: عرض حزمة العريس - بدلة رسمية + قميص كلاسيك"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">
                    نوع العرض الترويجي *
                  </label>
                  <select
                    value={offerForm.type}
                    onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value as OfferType })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="bundle">حزمة مجمعة (Combo Bundle Price)</option>
                    <option value="product_discount">خصم على أصناف محددة</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">
                    {offerForm.type === 'bundle'
                      ? 'سعر الحزمة المجمعة (ج.م) *'
                      : 'نسبة الخصم المئوية (%) *'}
                  </label>
                  {offerForm.type === 'bundle' ? (
                    <input
                      type="number"
                      required
                      min={1}
                      value={offerForm.bundlePrice}
                      onChange={(e) => setOfferForm({ ...offerForm, bundlePrice: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <input
                      type="number"
                      required
                      min={1}
                      max={90}
                      value={offerForm.discountPercent}
                      onChange={(e) => setOfferForm({ ...offerForm, discountPercent: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              </div>

              {/* Product Picker */}
              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">
                  حدد الأصناف المرتبطة من المخزون:
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {products.map((p) => {
                    const isSelected = offerForm.productIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isSelected ? 'bg-amber-100 border border-amber-300 font-bold text-slate-900' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setOfferForm({ ...offerForm, productIds: [...offerForm.productIds, p.id] });
                              } else {
                                setOfferForm({ ...offerForm, productIds: offerForm.productIds.filter((id) => id !== p.id) });
                              }
                            }}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span>{p.name}</span>
                        </div>
                        <span className="font-mono text-slate-500">{p.sellingPrice} ج.م</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    value={offerForm.startDate}
                    onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={offerForm.endDate}
                    onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">شرح وملاحظات العرض</label>
                <textarea
                  value={offerForm.notes}
                  onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                  rows={2}
                  placeholder="ملاحظات توضيحية للعميل أو فريق المبيعات..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  حفظ العرض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏷️ Modal: Add/Edit Coupon Code */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-600" />
                <span>{editingCoupon ? 'تعديل كود الخصم' : 'إنشاء كود خصم جديد'}</span>
              </h3>
              <button
                onClick={() => setShowCouponModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">
                  كود الخصم (Coupon Code) *
                </label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="مثال: AKHEN20"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold tracking-wider focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">
                  وصف / عنوان كود الخصم *
                </label>
                <input
                  type="text"
                  required
                  value={couponForm.title}
                  onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                  placeholder="مثال: خصم 20% بمناسبة الافتتاح"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">نوع الخصم *</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as 'percent' | 'fixed' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="percent">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">قيمة الخصم *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">
                  الحد الأدنى لقيمة الفاتورة لتطبيق الخصم (ج.م)
                </label>
                <input
                  type="number"
                  min={0}
                  value={couponForm.minOrderAmount}
                  onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) || 0 })}
                  placeholder="0 = بدون حد أدنى"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={couponForm.isActive}
                  onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="couponActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                  تفعيل قسيمة الخصم فوراً للاستخدام في POS
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  حفظ قسيمة الخصم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
