"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 pointer-events-none sm:max-w-md">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

const iconMap: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const styleMap: Record<ToastType, { icon: string; border: string }> = {
  success: { icon: "text-emerald-500", border: "border-emerald-500/20" },
  error: { icon: "text-red-500", border: "border-red-500/20" },
  info: { icon: "text-blue-500", border: "border-blue-500/20" },
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const Icon = iconMap[toast.type]
  const style = styleMap[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -60, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-2xl border backdrop-blur-xl bg-popover/80 shadow-2xl px-4 py-3",
        style.border
      )}
    >
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-background/80", style.icon)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-full p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}
