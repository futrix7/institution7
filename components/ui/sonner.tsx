"use client"

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner"

function toast(message: string, opts?: { variant?: "default" | "success" | "destructive" | "info"; action?: { label: string; onClick: () => void } }) {
  const options = opts?.action ? { action: opts.action } : undefined
  switch (opts?.variant) {
    case "success":
      sonnerToast.success(message, options)
      break
    case "destructive":
      sonnerToast.error(message, options)
      break
    case "info":
      sonnerToast.info(message, options)
      break
    default:
      sonnerToast(message, options)
  }
}

function useToast() {
  return { toast }
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SonnerToaster
        position="bottom-right"
        theme="system"
        closeButton
        duration={4000}
        offset={16}
        toastOptions={{
          style: {
            background: "var(--card)",
            color: "var(--card-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "0.75rem",
          },
        }}
      />
    </>
  )
}

export { toast, useToast, ToastProvider }
