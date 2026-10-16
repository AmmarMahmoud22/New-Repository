import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, CartItem, PaymentMethod } from '../../types';
import { ReceiptModal } from './ReceiptModal';
import { PosReturnModal } from './PosReturnModal';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Split,
  CalendarDays,
  Percent,
  User,
  Phone,
  AlertCircle,
  Tag,
  CheckCircle,
  Edit2,
  ShieldAlert,
  RotateCcw,
  Printer,
} from 'lucide-react';

interface PosCheckoutProps {
  onOpenPinModal: (actionTitle: string, onSuccess: () => void) => void;
  onNavigateToInstallments: (cartTotal: number, itemsSummary: string) => void;
}

export const PosCheckout: React.FC<PosCheckoutProps> = ({
  onOpenPinModal,
  onNavigateToInstallments,
}) => {
  const {
    products,
    categories: storeCategories,
    employees,
    customers,
    currentUser,
    activeShift,
    checkoutSale,
    hasPermission,
    permissions,
    verifyCoupon,
    promotionalOffers,
  } = useStore();

  const isReadOnly = permissions?.readOnly;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>(() => {
    return currentUser.role === 'salesman'
      ? currentUser.id
      : employees.find((e) => e.role === 'salesman')?.id || employees[0]?.id || '';
  });
  const [salesmanPinInput, setSalesmanPinInput] = useState<string>(() => {
    const defaultEmp = employees.find((e) => e.id === selectedSalesmanId);
    return defaultEmp?.pinCode || defaultEmp?.code || '';
  });
  const [pinMatchToast, setPinMatchToast] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Payment & Discount State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [splitCashAmount, setSplitCashAmount] = useState<number>(0);
  const [splitCardAmount, setSplitCardAmount] = useState<number>(0);

  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [managerApprovedDiscount, setManagerApprovedDiscount] = useState<boolean>(false);

  // Coupon Code State
  const [couponInputCode, setCouponInputCode] = useState('');
  const [couponStatusMsg, setCouponStatusMsg] = useState<string | null>(null);

  const handleApplyCouponCode = () => {
    if (!couponInputCode.trim()) return;
    const res = verifyCoupon(couponInputCode, subtotal);
    if (res.valid && res.coupon && res.discountAmount !== undefined) {
      if (res.coupon.discountType === 'percent') {
        setDiscountType('percent');
        setDiscountValue(res.coupon.discountValue);
      } else {
        setDiscountType('fixed');
        setDiscountValue(res.coupon.discountValue);
      }
      setCouponStatusMsg(`✅ تم تطبيق كود الخصم "${res.coupon.code}" بخصم ${res.discountAmount.toLocaleString()} ج.م!`);
      setTimeout(() => setCouponStatusMsg(null), 4000);
    } else {
      setCouponStatusMsg(`⚠️ ${res.error || 'كود الخصم غير صحيح'}`);
      setTimeout(() => setCouponStatusMsg(null), 4000);
    }
  };

  // Price Edit State
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [tempEditedPrice, setTempEditedPrice] = useState<number>(0);

  // Completed Invoice for Modal
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Helper function to find a product by barcode, SKU, or ID
  const findProductByCode = (code: string): Product | undefined => {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return undefined;
    return products.find(
      (p) =>
        p.barcode.toLowerCase() === trimmed ||
        (p.sku && p.sku.toLowerCase() === trimmed) ||
        p.id.toLowerCase() === trimmed
    );
  };

  // Products filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        p.brand.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);

      const matchCat =
        selectedCategory === 'all'
          ? true
          : p.category === selectedCategory ||
            (selectedCategory === 'youth' && (p.category === 'youth' || p.category === 'womens' || p.category === 'kids'));

      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  // Calculated Discount
  const totalDiscount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.round(((subtotal * discountValue) / 100) * 100) / 100;
    }
    return Math.min(subtotal, discountValue);
  }, [subtotal, discountType, discountValue]);

  const afterDeductions = Math.max(0, subtotal - totalDiscount);
  const taxRate = 0;
  const taxTotal = 0;
  const grandTotal = Math.round(afterDeductions * 100) / 100;

  // Split payment auto calculation
  const handleSelectSplitPayment = () => {
    setPaymentMethod('split');
    const defaultCash = grandTotal >= 1000 ? 1000 : grandTotal;
    setSplitCashAmount(defaultCash);
    setSplitCardAmount(Math.max(0, grandTotal - defaultCash));
  };

  const handleSplitCashChange = (val: number) => {
    setSplitCashAmount(val);
    setSplitCardAmount(Math.max(0, grandTotal - val));
  };

  const handleSplitCardChange = (val: number) => {
    setSplitCardAmount(val);
    setSplitCashAmount(Math.max(0, grandTotal - val));
  };

  useEffect(() => {
    if (paymentMethod === 'split') {
      setSplitCardAmount(Math.max(0, grandTotal - splitCashAmount));
    }
  }, [grandTotal]);

  // Change calculation for cash payment
  const changeDue = Math.max(0, cashTendered - grandTotal);

  // Handlers
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      setErrorMessage(`عذراً، الصنف "${product.name}" نفد من المخزون!`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setErrorMessage(`لا يمكن إضافة المزيد، الرصيد المتاح بالمخزن ${product.stock} فقط!`);
          setTimeout(() => setErrorMessage(null), 2500);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.sellingPrice,
            originalPrice: product.sellingPrice,
            discountPercent: 0,
          },
        ];
      }
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = findProductByCode(barcodeInput);

    if (matched) {
      handleAddToCart(matched);
      setSuccessToast(`تمت إضافة "${matched.name}" إلى السلة 🛒`);
      setTimeout(() => setSuccessToast(null), 2500);
      setBarcodeInput('');
    } else {
      setErrorMessage(`لم يتم العثور على صنف بالباركود أو SKU: ${barcodeInput}`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Global Event Listener for Hardware Barcode Scanner & SKU Detection
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = 0;
    let timer: any = null;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore system shortcuts and modifier keys
      if (
        e.key === 'Shift' ||
        e.key === 'Control' ||
        e.key === 'Alt' ||
        e.key === 'Meta' ||
        e.key === 'Tab' ||
        e.key === 'Escape'
      ) {
        return;
      }

      const activeElem = document.activeElement as HTMLElement | null;
      const isInputFocused =
        activeElem &&
        (activeElem.tagName === 'INPUT' ||
          activeElem.tagName === 'TEXTAREA' ||
          activeElem.isContentEditable);

      const currentTime = Date.now();
      const timeDelta = lastKeyTime > 0 ? currentTime - lastKeyTime : 999;
      const isRapidTyping = timeDelta < 50; // Hardware scanners send key events in < 50ms gaps

      if (e.key === 'Enter') {
        const candidate = buffer.trim();
        if (candidate.length >= 2) {
          const matched = findProductByCode(candidate);
          if (matched) {
            if (isInputFocused) {
              e.preventDefault();
            }
            handleAddToCart(matched);
            setSuccessToast(`📷 تم مسح الباركود تلقائياً: تمت إضافة "${matched.name}" إلى السلة!`);
            setTimeout(() => setSuccessToast(null), 3000);
            buffer = '';
            lastKeyTime = 0;
            if (timer) clearTimeout(timer);
            return;
          } else if (!isInputFocused || isRapidTyping) {
            setErrorMessage(`⚠️ لم يتم العثور على منتج بالباركود / SKU: ${candidate}`);
            setTimeout(() => setErrorMessage(null), 3000);
            buffer = '';
            lastKeyTime = 0;
            if (timer) clearTimeout(timer);
            return;
          }
        }
        buffer = '';
        lastKeyTime = 0;
        return;
      }

      if (e.key.length === 1) {
        if (timeDelta > 200 && isInputFocused) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
        lastKeyTime = currentTime;

        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (!isInputFocused && buffer.trim().length >= 2) {
            const matched = findProductByCode(buffer.trim());
            if (matched) {
              handleAddToCart(matched);
              setSuccessToast(`📷 كاشف الباركود: تمت إضافة "${matched.name}" إلى السلة!`);
              setTimeout(() => setSuccessToast(null), 3000);
            }
          }
          buffer = '';
          lastKeyTime = 0;
        }, 250);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      if (timer) clearTimeout(timer);
    };
  }, [products]);

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              setErrorMessage(`الكمية المطلوبة تتجاوز رصيد المخزن المتاح (${item.product.stock})!`);
              setTimeout(() => setErrorMessage(null), 2500);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Price Edit Handler
  const handleStartPriceEdit = (index: number) => {
    const item = cart[index];
    setEditingItemIndex(index);
    setTempEditedPrice(item.unitPrice);
  };

  const handleSavePriceEdit = () => {
    if (editingItemIndex === null) return;
    const item = cart[editingItemIndex];

    const applyEdit = () => {
      setCart((prev) =>
        prev.map((it, idx) =>
          idx === editingItemIndex
            ? {
                ...it,
                unitPrice: tempEditedPrice,
                priceEdited: tempEditedPrice !== it.originalPrice,
              }
            : it
        )
      );
      setEditingItemIndex(null);
    };

    if (currentUser.role !== 'manager' && tempEditedPrice !== item.originalPrice) {
      onOpenPinModal(`تعديل سعر بيع يدوي للصنف: ${item.product.name} (PIN المدير)`, applyEdit);
    } else {
      applyEdit();
    }
  };

  // Discount Check
  const handleDiscountChange = (val: number) => {
    setDiscountValue(val);
    const effectivePercent =
      discountType === 'percent' ? val : subtotal > 0 ? (val / subtotal) * 100 : 0;

    if (effectivePercent > 10 && currentUser.role !== 'manager' && !managerApprovedDiscount) {
      onOpenPinModal(
        `الموافقة على خصم استثنائي مرتفع (${Math.round(effectivePercent)}%) - PIN المدير`,
        () => {
          setManagerApprovedDiscount(true);
        }
      );
    }
  };

  // Checkout Execution
  const handleCheckout = () => {
    if (!activeShift) {
      setErrorMessage('لا يوجد وردية مفتوحة حالياً. يرجى فتح شيفت واستلام العهدة.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('سلة المشتريات فارغة!');
      return;
    }

    // Split validation
    if (paymentMethod === 'split') {
      const splitTotal = Number(splitCashAmount) + Number(splitCardAmount);
      if (Math.abs(splitTotal - grandTotal) > 1) {
        setErrorMessage(
          `مجموع الدفع المجزأ (${splitTotal.toLocaleString()} ج.م) لا يطابق إجمالي الفاتورة (${grandTotal.toLocaleString()} ج.م)!`
        );
        return;
      }
    }

    const res = checkoutSale({
      items: cart,
      salesmanId: selectedSalesmanId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      paymentMethod,
      cashPaid: paymentMethod === 'split' ? splitCashAmount : paymentMethod === 'cash' ? grandTotal : 0,
      cardPaid: paymentMethod === 'split' ? splitCardAmount : paymentMethod === 'card' ? grandTotal : 0,
      discountTotal: totalDiscount,
      managerApprovedDiscount,
    });

    if (res.success && res.invoice) {
      setCompletedInvoice(res.invoice);
      setShowReceiptModal(true);
      // Reset POS state
      setCart([]);
      setDiscountValue(0);
      setManagerApprovedDiscount(false);
      setCustomerName('');
      setCustomerPhone('');
      setCashTendered(0);
      setSplitCashAmount(0);
      setSplitCardAmount(0);
    } else {
      setErrorMessage(res.error || 'فشلت عملية البيع.');
    }
  };

  // Direct installment redirect
  const handleDirectInstallment = () => {
    if (cart.length === 0) {
      setErrorMessage('يرجى إضافة قطع الملابس للسلة أولاً لتحويلها إلى عقد تقسيط.');
      return;
    }
    const summary = cart.map((c) => `${c.product.name} (عدد ${c.quantity})`).join(' + ');
    onNavigateToInstallments(grandTotal, summary);
  };

  // Direct 80mm Print Invoice
  const handleDirectPrintCurrentCart = () => {
    if (cart.length === 0) {
      setErrorMessage('سلة المشتريات فارغة! اختر قطع الملابس أولاً لطباعة الفاتورة.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const selectedSalesman = employees.find((e) => e.id === selectedSalesmanId);
    const salesmanName = selectedSalesman ? selectedSalesman.name : currentUser.name;

    const draftInvoice: any = {
      id: `print-${Date.now()}`,
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString(),
      items: cart,
      subtotal,
      discountTotal: totalDiscount,
      taxTotal,
      grandTotal,
      paymentMethod,
      cashPaid: paymentMethod === 'split' ? splitCashAmount : paymentMethod === 'cash' ? grandTotal : 0,
      cardPaid: paymentMethod === 'split' ? splitCardAmount : paymentMethod === 'card' ? grandTotal : 0,
      salesmanId: selectedSalesmanId,
      salesmanName,
      cashierName: currentUser.name,
      customerName: customerName.trim() || 'عميل نقدي',
      customerPhone: customerPhone.trim() || '—',
      status: 'completed',
      whatsappReceiptText: `فاتورة كاشير - AKHEN\nرقم الفاتورة: PREVIEW\nالإجمالي: ${grandTotal} ج.م`,
    };

    setCompletedInvoice(draftInvoice);
    setShowReceiptModal(true);
  };

  const posCategories = useMemo(() => {
    return [
      { id: 'all', label: 'كافة الأقسام' },
      ...storeCategories,
    ];
  }, [storeCategories]);

  return (
    <div className="space-y-4">
      {/* Top Banner Alert if Shift is closed */}
      {!activeShift && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between text-rose-800 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span className="font-semibold">
              تنبيه رقابي: لا يوجد شيفت كاشير مفتوح حالياً. لا يمكن تنفيذ عمليات بيع حتى يتم فتح
              وردية واستلام العهدة بالدرج.
            </span>
          </div>
        </div>
      )}

      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-emerald-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 font-bold px-1">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Column POS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Catalog & Barcode Scanner) - 7 cols */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Barcode Scanner Bar */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="امسح الباركود بجهاز القارئ أو اكتب الكود واضغط Enter..."
                className="w-full bg-white border border-slate-300 rounded-xl pr-10 pl-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:border-amber-500 focus:outline-none shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>إدخال</span>
            </button>
          </form>

          {/* Categories Tab Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {posCategories.map((c) => {
              const count =
                c.id === 'all'
                  ? products.length
                  : products.filter(
                      (p) =>
                        p.category === c.id ||
                        (c.id === 'youth' && (p.category === 'youth' || p.category === 'womens' || p.category === 'kids'))
                    ).length;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedCategory === c.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{c.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedCategory === c.id
                        ? 'bg-slate-950/15 text-slate-950 font-bold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الماركة، المقاس، اللون..."
              className="w-full bg-white border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                  className={`p-3 rounded-xl border transition-all text-right flex flex-col justify-between ${
                    isOutOfStock
                      ? 'bg-slate-100/60 border-slate-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md cursor-pointer shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                        {product.sku ? `${product.barcode} · ${product.sku}` : product.barcode}
                      </span>
                      <span className="text-[10px] font-bold text-sky-700">
                        {product.brand}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h4>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                      <span>المقاس: {product.size}</span>
                      <span>·</span>
                      <span>{product.color}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">السعر</div>
                      <div className="text-xs font-mono font-bold text-amber-600 tabular-nums">
                        {product.sellingPrice.toLocaleString()} ج.م
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-[10px] text-slate-400 font-medium">المخزن</div>
                      <div
                        className={`text-[11px] font-mono font-bold ${
                          product.stock <= 5
                            ? 'text-rose-600'
                            : product.stock <= 10
                            ? 'text-amber-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {product.stock} ق
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (Cart, Invoice calculation & Checkout Panel) - 5 cols */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-4">
          <div className="space-y-3">
            {/* Salesman & Customer Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-600 font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>البائع / الكاشير:</span>
                  </label>
                  <span className="text-[9px] text-amber-700 font-mono font-semibold">أو كود PIN</span>
                </div>

                <div className="flex gap-1.5">
                  <select
                    value={selectedSalesmanId}
                    onChange={(e) => {
                      setSelectedSalesmanId(e.target.value);
                      const matched = employees.find((emp) => emp.id === e.target.value);
                      if (matched) setSalesmanPinInput(matched.pinCode || matched.code || '');
                    }}
                    className="flex-1 min-w-0 bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role === 'salesman' ? 'بائع' : emp.role === 'cashier' ? 'كاشير' : 'مدير'})
                      </option>
                    ))}
                  </select>

                  <div className="relative w-20 shrink-0">
                    <input
                      type="text"
                      value={salesmanPinInput}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setSalesmanPinInput(val);
                        const matched = employees.find(
                          (emp) =>
                            (emp.pinCode && emp.pinCode === val) ||
                            emp.code.toLowerCase() === val.toLowerCase()
                        );
                        if (matched) {
                          setSelectedSalesmanId(matched.id);
                          setPinMatchToast(`تم اختيار البائع: ${matched.name}`);
                          setTimeout(() => setPinMatchToast(null), 2500);
                        }
                      }}
                      placeholder="PIN"
                      maxLength={8}
                      className="w-full bg-amber-50 border border-amber-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono font-bold text-center focus:outline-none focus:border-amber-500"
                      title="اكتب كود PIN الخاص بالبائع ليتم اختياره فورياً للفاتورة دون تبديل المستخدم علوياً"
                    />
                  </div>
                </div>

                {pinMatchToast && (
                  <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{pinMatchToast}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>العميل:</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const cust = customers.find(c => c.id === e.target.value);
                    if (cust) {
                      setCustomerName(cust.name);
                      setCustomerPhone(cust.phone);
                    } else {
                      setCustomerName('');
                      setCustomerPhone('');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">عميل نقدي</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-600 font-bold flex items-center gap-1 mb-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>رقم واتساب العميل:</span>
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  سلة المشتريات فارغة. امسح الباركود أو اختر المنتجات من الكتالوج.
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={item.product.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {item.product.name}
                        </span>
                        {item.priceEdited && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1 rounded font-bold">
                            سعر يدوي
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                        <span>مقاس: {item.product.size}</span>
                        <span>·</span>
                        {editingItemIndex === index ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={tempEditedPrice}
                              onChange={(e) => setTempEditedPrice(Number(e.target.value))}
                              className="w-16 bg-white border border-amber-500 rounded px-1 text-xs text-slate-900 font-mono"
                            />
                            <button
                              onClick={handleSavePriceEdit}
                              className="text-[10px] text-emerald-700 font-bold"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => setEditingItemIndex(null)}
                              className="text-[10px] text-slate-500"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 font-mono">
                            {item.unitPrice.toLocaleString()} ج.م
                            {!isReadOnly && (
                              <button
                                onClick={() => handleStartPriceEdit(index)}
                                className="text-slate-400 hover:text-amber-600"
                                title="تعديل السعر يدويًا (يتطلب PIN)"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-2 py-1 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="text-slate-600 hover:text-slate-900 p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-900 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="text-slate-600 hover:text-slate-900 p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-left font-mono tabular-nums text-xs font-bold text-slate-900 min-w-[55px]">
                      {(item.unitPrice * item.quantity).toLocaleString()} ج.م
                    </div>

                    {!isReadOnly && (
                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Discount Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-bold flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-600" />
                  <span>تطبيق خصم تجاري:</span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('fixed');
                      setDiscountValue(0);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      discountType === 'fixed'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-600 bg-white border border-slate-200'
                    }`}
                  >
                    مبلغ (ج.م)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('percent');
                      setDiscountValue(0);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      discountType === 'percent'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-600 bg-white border border-slate-200'
                    }`}
                  >
                    نسبة (%)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2 font-mono focus:outline-none focus:border-amber-500"
                />
                {totalDiscount > 0 && (
                  <span className="text-rose-600 font-mono text-xs font-bold whitespace-nowrap">
                    -{totalDiscount.toLocaleString()} ج.م
                  </span>
                )}
              </div>

              {/* Coupon Code Entry */}
              <div className="pt-1 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={couponInputCode}
                    onChange={(e) => setCouponInputCode(e.target.value.toUpperCase())}
                    placeholder="أدخل كود الخصم"
                    className="flex-1 min-w-0 bg-white border border-emerald-300 text-xs text-slate-900 rounded-lg p-1.5 font-mono font-bold tracking-wider focus:outline-none focus:border-emerald-600"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCouponCode();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCouponCode}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
                  >
                    تطبيق
                  </button>
                </div>

                {couponStatusMsg && (
                  <div className="text-[10px] font-bold text-emerald-800 mt-1 flex items-center gap-1">
                    <span>{couponStatusMsg}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-600 font-bold">طريقة الدفع:</label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Banknote className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                  <span className="text-[11px] block">كاش (نقداً)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-sky-700" />
                  <span className="text-[11px] block">فيزا / بطاقة</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectSplitPayment}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    paymentMethod === 'split'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Split className="w-4 h-4 mx-auto mb-1 text-amber-700" />
                  <span className="text-[11px] block">دفع مجزأ</span>
                </button>

                <button
                  type="button"
                  onClick={handleDirectInstallment}
                  className="p-2 rounded-xl border text-center transition-all bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100"
                >
                  <CalendarDays className="w-4 h-4 mx-auto mb-1 text-sky-600" />
                  <span className="text-[11px] block font-bold">تحويل لأقساط</span>
                </button>
              </div>
            </div>

            {/* Conditional Payment Inputs */}
            {paymentMethod === 'cash' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600">المبلغ المدفوع من العميل:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    placeholder={grandTotal.toString()}
                    className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-mono text-left font-bold"
                  />
                  {cashTendered > grandTotal && (
                    <span className="text-emerald-700 font-mono text-[11px] font-bold">
                      الباقي: {changeDue.toLocaleString()} ج.م
                    </span>
                  )}
                </div>
              </div>
            )}

            {paymentMethod === 'split' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 font-bold block mb-1">المبلغ كاش (ج.م):</label>
                    <input
                      type="number"
                      value={splitCashAmount}
                      onChange={(e) => handleSplitCashChange(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-bold block mb-1">المبلغ فيزا / شبكة (ج.م):</label>
                    <input
                      type="number"
                      value={splitCardAmount}
                      onChange={(e) => handleSplitCardChange(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-amber-900 font-mono text-center font-bold">
                  المجموع المجزأ: {(splitCashAmount + splitCardAmount).toLocaleString()} ج.م من أصل {grandTotal.toLocaleString()} ج.م
                </div>
              </div>
            )}
          </div>

          {/* Totals Summary & Submit Checkout */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            {!isReadOnly && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="w-full py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>تسجيل مرتجع فاتورة / استرداد صنف (مرتجع)</span>
              </button>
            )}
            <div className="space-y-1 text-xs font-medium">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono tabular-nums font-bold text-slate-800">{subtotal.toLocaleString()} ج.م</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>الخصم الممنوح:</span>
                  <span className="font-mono tabular-nums font-bold">-{totalDiscount.toLocaleString()} ج.م</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>المبلغ الإجمالي المطلوب:</span>
                <span className="text-amber-600 font-mono tabular-nums text-lg font-black">
                  {grandTotal.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleDirectPrintCurrentCart}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  cart.length === 0
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 border-amber-400 text-amber-800 active:scale-[0.99] shadow-xs'
                }`}
                title="معاينة وطباعة إيصال الفاتورة الحالية حرارياً (80mm)"
              >
                <Printer className="w-4 h-4 text-amber-600" />
                <span>طباعة الفاتورة (80mm)</span>
              </button>

              <button
                type="button"
                disabled={cart.length === 0 || !activeShift}
                onClick={handleCheckout}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                  cart.length === 0 || !activeShift
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-[0.99]'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>إتمام البيع وحفظ الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thermal Receipt & WhatsApp Modal */}
      {showReceiptModal && completedInvoice && (
        <ReceiptModal
          invoice={completedInvoice}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* POS Return / Refund Modal */}
      {showReturnModal && (
        <PosReturnModal
          onClose={() => setShowReturnModal(false)}
          onOpenPinModal={onOpenPinModal}
        />
      )}
    </div>
  );
};
