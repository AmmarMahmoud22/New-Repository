import React, { useState } from 'react';
import { useStore, getCategoryLabel } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types';
import { exportInventoryToCSV } from '../../utils/csvExporter';
import {
  Package,
  Search,
  Plus,
  Tag,
  Barcode,
  RefreshCw,
  AlertCircle,
  Edit,
  Printer,
  Trash2,
  CheckCircle,
  X,
  Download,
} from 'lucide-react';

interface InventoryManagerProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  onOpenPinModal,
}) => {
  const {
    products,
    categories: storeCategories,
    addCategory,
    deleteCategory,
    updateProductStock,
    addProduct,
    updateProduct,
    deleteProduct,
    logAudit,
    currentUser,
    hasPermission,
    permissions,
  } = useStore();

  const isReadOnly = permissions?.readOnly;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  // Add / Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    sku: '',
    category: 'mens' as ProductCategory,
    brand: '',
    size: 'L',
    color: '',
    costPrice: 200,
    sellingPrice: 400,
    stock: 20,
    description: '',
  });

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      p.brand.toLowerCase().includes(q);

    const matchCategory =
      selectedCategory === 'all'
        ? true
        : p.category === selectedCategory ||
          (selectedCategory === 'youth' && (p.category === 'youth' || p.category === 'womens' || p.category === 'kids'));

    return matchSearch && matchCategory;
  });

  const handleStartStockEdit = (product: Product) => {
    setEditingStockId(product.id);
    setTempStockValue(product.stock);
  };

  const handleSaveStockEdit = (product: Product) => {
    const applySave = () => {
      updateProductStock(product.id, tempStockValue);
      logAudit(
        'stock_update',
        'تعديل كمية المخزون يدوياً',
        `تم تعديل رصيد الصنف "${product.name}" من ${product.stock} إلى ${tempStockValue} قطعة.`,
        'sensitive'
      );
      setEditingStockId(null);
    };

    if (currentUser.role !== 'manager') {
      onOpenPinModal(`تعديل رصيد المخزون للصنف: ${product.name}`, applySave);
    } else {
      applySave();
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsCustomCategoryMode(false);
    setCustomCategoryInput('');
    const randCode = Math.floor(100 + Math.random() * 899);
    setFormData({
      name: '',
      barcode: `${Math.floor(6220000 + Math.random() * 99999)}`,
      sku: `SKU-${randCode}`,
      category: 'mens',
      brand: 'اخين AKHEN',
      size: 'L',
      color: 'أسود',
      costPrice: 250,
      sellingPrice: 500,
      stock: 25,
      description: '',
    });
    setShowProductModal(true);
  };

  const handleOpenEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setIsCustomCategoryMode(false);
    setCustomCategoryInput('');
    setFormData({
      name: product.name,
      barcode: product.barcode,
      sku: product.sku || '',
      category: product.category,
      brand: product.brand,
      size: product.size,
      color: product.color,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      description: product.description || '',
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.barcode.trim()) return;

    let finalCategory = formData.category;
    if (isCustomCategoryMode && customCategoryInput.trim()) {
      finalCategory = addCategory(customCategoryInput.trim());
    }

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...formData,
        category: finalCategory,
      });
    } else {
      addProduct({
        ...formData,
        category: finalCategory,
      });
    }
    setShowProductModal(false);
  };

  const handleDeleteProduct = (product: Product) => {
    const confirmDelete = () => {
      if (confirm(`هل أنت متأكد من حذف الصنف "${product.name}"؟`)) {
        deleteProduct(product.id);
      }
    };

    if (currentUser.role !== 'manager') {
      onOpenPinModal(`حذف صنف من المخزون: ${product.name}`, confirmDelete);
    } else {
      confirmDelete();
    }
  };

  // Stock summary totals
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockCost = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const totalStockValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
  const lowStockCount = products.filter((p) => p.stock <= 10).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              المخزون
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            متابعة دقيقة وفورية لحركة قطع الملابس، أكواد الباركود، تكاليف المنتجات، وأسعار البيع
            بالجنيه المصري وإضافة قطع ملابس جديدة مع تنبيهات النواقص.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 text-[10px]">إجمالي القطع</div>
              <div className="text-slate-900 font-mono font-bold">{totalStockUnits.toLocaleString()} قطعة</div>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <div className="text-slate-500 text-[10px]">تنبيه النواقص (≤10)</div>
              <div className="text-rose-600 font-mono font-bold">{lowStockCount} أصناف</div>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <div className="text-slate-500 text-[10px]">القيمة البيعية</div>
              <div className="text-amber-600 font-mono font-bold tabular-nums">
                {totalStockValue.toLocaleString()} ج.م
              </div>
            </div>
          </div>

          <button
            onClick={() => exportInventoryToCSV(products)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs shrink-0"
            title="تصدير بيانات المخزون الحالية إلى ملف CSV إكسل"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير المخزون (CSV)</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قطعة ملابس جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>كافة الأقسام</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === 'all'
                    ? 'bg-slate-950/15 text-slate-950 font-bold'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {products.length}
              </span>
            </button>

            {storeCategories.map((c) => {
              const count = products.filter(
                (p) =>
                  p.category === c.id ||
                  (c.id === 'youth' && (p.category === 'youth' || p.category === 'womens' || p.category === 'kids'))
              ).length;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                    selectedCategory === c.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{c.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedCategory === c.id
                        ? 'bg-slate-950/15 text-slate-950 font-bold'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الباركود..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
        </div>

        {/* Product Stock Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 pr-2 font-bold">الباركود</th>
                <th className="pb-3 font-bold">الصنف والمواصفات</th>
                <th className="pb-3 font-bold">القسم / الماركة</th>
                <th className="pb-3 font-bold">سعر التكلفة</th>
                <th className="pb-3 font-bold">سعر البيع</th>
                <th className="pb-3 text-center font-bold">الرصيد المتاح</th>
                <th className="pb-3 text-left pl-2 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= 10;
                const isEditing = editingStockId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pr-2 font-mono text-slate-700">
                      <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-[11px] font-semibold">
                        {p.barcode}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-900">
                      <div>{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        المقاس: {p.size} · اللون: {p.color}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
                          {getCategoryLabel(p.category, storeCategories)}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {p.brand}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 font-mono tabular-nums text-slate-500">
                      {currentUser.role === 'manager' ? (
                        `${(p.costPrice ?? 0).toLocaleString()} ج.م`
                      ) : (
                        <span className="text-slate-400 text-[11px]">محمي (مدير)</span>
                      )}
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-600 tabular-nums">
                      {(p.sellingPrice ?? 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={tempStockValue}
                            onChange={(e) => setTempStockValue(Number(e.target.value))}
                            className="w-16 bg-white border border-amber-500 rounded p-1 text-center font-mono font-bold text-slate-900 text-xs"
                          />
                          <button
                            onClick={() => handleSaveStockEdit(p)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => setEditingStockId(null)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono font-bold text-[11px] ${
                            p.stock === 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isLow
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {p.stock} قطعة
                          {isLow && p.stock > 0 && <AlertCircle className="w-3 h-3 text-amber-600" />}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-left pl-2">
                      {!isReadOnly && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartStockEdit(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] flex items-center gap-1 transition-colors border border-slate-200"
                            title="تعديل سريع لرصيد المخزون"
                          >
                            <Edit className="w-3 h-3 text-amber-600" />
                            <span>جرد</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditProductModal(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] flex items-center gap-1 transition-colors border border-slate-200"
                            title="تعديل بيانات الصنف والأسعار"
                          >
                            <Tag className="w-3 h-3 text-sky-600" />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg transition-colors border border-slate-200"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                <span>{editingProduct ? 'تعديل بيانات قطعة الملابس' : 'إضافة قطعة ملابس جديدة للمخزون'}</span>
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">اسم القطعة والموديل *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: قميص أكسفورد قطن كاجوال"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">كود الباركود *</label>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-700 font-bold block">القسم والتصنيف *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategoryMode(!isCustomCategoryMode);
                        if (!isCustomCategoryMode) setCustomCategoryInput('');
                      }}
                      className="text-[11px] text-amber-700 hover:text-amber-800 font-bold transition-colors"
                    >
                      {isCustomCategoryMode ? '← اختيار قسم موجود' : '➕ كتابة قسم جديد'}
                    </button>
                  </div>

                  {!isCustomCategoryMode ? (
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCustomCategoryMode(true);
                          setCustomCategoryInput('');
                        } else {
                          setFormData({ ...formData, category: e.target.value as ProductCategory });
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                    >
                      {storeCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} {c.isCustom ? '(قسم مخصص)' : ''}
                        </option>
                      ))}
                      <option value="__NEW__" className="font-bold text-amber-700">
                        ➕ كتابة وإضافة قسم جديد آخر...
                      </option>
                    </select>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="اكتب اسم القسم (مثال: أحذية، ملابس بحر...)"
                        className="w-full bg-amber-50/60 border border-amber-400 rounded-xl p-2.5 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        autoFocus
                      />
                      <p className="text-[10px] text-slate-500">
                        ✨ سيظهر هذا القسم تلقائياً في التبويبات بالأعلى وفي الكاشير فور الحفظ.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">الماركة / البراند</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">المقاس</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="L, XL, 52..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">اللون</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="كحلي، أسود..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">سعر التكلفة (ج.م) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">سعر البيع (ج.م) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">الكمية המتاحة *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة القطعة للمخزن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
