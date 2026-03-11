import { createContext, useContext, useState, ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  type?: "success" | "error" | "info";
}

const ToastContext = createContext<(msg: string, type?: Toast["type"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded px-4 py-2 text-sm shadow ${
              t.type === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
