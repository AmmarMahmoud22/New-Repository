import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface PinModalProps {
  isOpen: boolean;
  actionTitle: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  actionTitle,
  onSuccess,
  onClose,
}) => {
  const { verifyManagerPin, logAudit } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verifyManagerPin(pin)) {
      setError(false);
      setPin('');
      logAudit(
        'discount_exception',
        'موافقة أمنية برقم PIN للمدير',
        `تم تأكيد الصلاحية بنجاح لتنفيذ: ${actionTitle}`,
        'sensitive',
        'مدير الفرع'
      );
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleDigitClick = (num: number) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setError(false);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  // Physical keyboard typing listener
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keyboard if user is typing in an input element outside modal
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        if ((e.target as HTMLElement).id !== 'pinModalHiddenInput') {
          return;
        }
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setPin((prev) => (prev.length < 4 ? prev + e.key : prev));
        setError(false);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPin((prev) => prev.slice(0, -1));
        setError(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === 4 && verifyManagerPin(pin)) {
          setError(false);
          setPin('');
          logAudit(
            'discount_exception',
            'موافقة أمنية برقم PIN للمدير',
            `تم تأكيد الصلاحية بنجاح لتنفيذ: ${actionTitle}`,
            'sensitive',
            'مدير الفرع'
          );
          onSuccess();
          onClose();
        } else if (pin.length === 4) {
          setError(true);
          setPin('');
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, verifyManagerPin, actionTitle, onSuccess, onClose, logAudit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            صلاحية مدير الفرع مطلوبة
          </h3>
          <p className="text-xs text-slate-500">
            {actionTitle}
          </p>
        </div>

        {/* PIN Indicators & Direct Keyboard Input */}
        <div className="space-y-3 mb-5">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border transition-all ${
                  pin.length > idx
                    ? 'bg-amber-500 border-amber-500 shadow-sm'
                    : 'bg-slate-100 border-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="text-center">
            <input
              id="pinModalHiddenInput"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(val);
                setError(false);
              }}
              placeholder="أدخل الرمز السري..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-center text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              يمكنك الكتابة مباشرة بالضغط على مفاتيح الأرقام بالكيبورد (0-9)
            </p>
          </div>
        </div>

        {error && (
          <div className="text-center text-xs text-rose-700 mb-4 bg-rose-50 p-2 rounded-lg border border-rose-200 font-medium">
            الرمز السري غير صحيح! يرجى إعادة المحاولة.
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitClick(num)}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-mono text-lg font-bold border border-slate-200 active:scale-95 transition-all shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold border border-slate-200 transition-all"
          >
            مسح
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick(0)}
            className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-mono text-lg font-bold border border-slate-200 active:scale-95 transition-all shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pin.length !== 4}
            className="h-12 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 text-xs font-bold transition-all shadow-xs"
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
};
