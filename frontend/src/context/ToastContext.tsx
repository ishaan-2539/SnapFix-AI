import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  push: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5200);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons: Record<ToastVariant, ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-ok-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-danger-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-600 shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "flex items-start gap-3 bg-white border border-ink-200 rounded-xl p-4 shadow-floating",
              "animate-in slide-in-from-bottom-2 fade-in duration-300"
            )}
            style={{ animation: "toast-in 0.25s ease-out" }}
          >
            {icons[t.variant]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900">{t.title}</p>
              {t.description && <p className="text-sm text-ink-600 mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-ink-400 hover:text-ink-700 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
