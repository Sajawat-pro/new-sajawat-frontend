"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Set());
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const toast = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts(current => [...current.slice(-3), { id, message, type }]);
    const timer = setTimeout(() => { setToasts(current => current.filter(item => item.id !== id)); timers.current.delete(timer); }, type === "error" ? 8000 : 4500);
    timers.current.add(timer);
  }, []);
  return <ToastContext.Provider value={toast}>{children}<div className="toast-stack" aria-live="polite" aria-atomic="false">{toasts.map(item => <div key={item.id} className={`toast toast-${item.type}`} role={item.type === "error" ? "alert" : "status"}><span>{item.type === "error" ? "!" : "✓"}</span><p>{item.message}</p><button aria-label="Dismiss notification" onClick={() => setToasts(current => current.filter(toast => toast.id !== item.id))}>×</button></div>)}</div></ToastContext.Provider>;
}
