"use client"

import { FileSpreadsheet, FileText, Printer } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const exportOptions = [
  {
    id: "csv",
    name: "CSV",
    description: "Comma-separated values",
    icon: FileSpreadsheet,
  },
  {
    id: "excel",
    name: "Excel",
    description: "Microsoft Excel format",
    icon: FileSpreadsheet,
  },
  {
    id: "pdf",
    name: "PDF",
    description: "PDF document format",
    icon: FileText,
  },
  {
    id: "print",
    name: "Print",
    description: "Print directly",
    icon: Printer,
  },
]

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  function handleExport(format: string) {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Choose your preferred export format
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          {exportOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleExport(option.id)}
                className="flex w-full flex-col items-center gap-2 rounded-lg border border-input p-4 text-center transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
              >
                <Icon className="size-8 text-muted-foreground" />
                <span className="text-sm font-medium">{option.name}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
