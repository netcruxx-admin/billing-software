'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DeleteButton } from '@/components/delete-button'
import {
  createInvoiceColumn,
  deleteInvoiceColumn,
  updateInvoiceColumn,
  type InvoiceColumn,
  type InvoiceColumnType,
} from '@/app/actions/invoice-columns'

const FIELD_TYPE_OPTIONS: { value: InvoiceColumnType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
]

const fieldTypeLabel = (type: string) => FIELD_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? 'Text'

interface InvoiceColumnManagerProps {
  businessId: string
  columns: InvoiceColumn[]
}

export function InvoiceColumnManager({ businessId, columns }: InvoiceColumnManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<InvoiceColumnType>('text')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editType, setEditType] = useState<InvoiceColumnType>('text')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    startTransition(async () => {
      await createInvoiceColumn(businessId, { label, fieldType: newType })
      setNewLabel('')
      setNewType('text')
      router.refresh()
    })
  }

  const startEdit = (column: InvoiceColumn) => {
    setEditingId(column.id)
    setEditLabel(column.label)
    setEditType(column.fieldType)
  }

  const handleSaveEdit = (columnId: string) => {
    const label = editLabel.trim()
    if (!label) return
    startTransition(async () => {
      await updateInvoiceColumn(columnId, businessId, { label, fieldType: editType })
      setEditingId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 bg-accent/20 border border-border rounded-lg p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-foreground mb-2">Column name</label>
          <Input
            placeholder="e.g. Batch No., Warranty Months"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-foreground mb-2">Type</label>
          <Select value={newType} onValueChange={(value) => setNewType((value as InvoiceColumnType) ?? 'text')}>
            <SelectTrigger className="w-full">
              <SelectValue>{(value: string) => fieldTypeLabel(value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isPending || !newLabel.trim()}>
          <Plus className="size-4" />
          Add Column
        </Button>
      </form>

      {columns.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No custom columns yet. Add one above — it will appear as an extra column on every new invoice's item table for
          this business.
        </p>
      ) : (
        <div className="rounded-lg border border-border divide-y divide-border">
          {columns.map((column) => (
            <div key={column.id} className="flex items-center gap-3 p-4">
              {editingId === column.id ? (
                <>
                  <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="flex-1" autoFocus />
                  <Select value={editType} onValueChange={(value) => setEditType((value as InvoiceColumnType) ?? 'text')}>
                    <SelectTrigger className="w-32">
                      <SelectValue>{(value: string) => fieldTypeLabel(value)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="sm" disabled={isPending} onClick={() => handleSaveEdit(column.id)}>
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{column.label}</p>
                    <p className="text-xs text-muted-foreground">{fieldTypeLabel(column.fieldType)}</p>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(column)}>
                    <Pencil className="size-4" />
                  </Button>
                  <DeleteButton
                    action={() => deleteInvoiceColumn(column.id, businessId)}
                    confirmMessage={`Delete the "${column.label}" column? Past invoices keep their saved values, but it will no longer appear on new invoices.`}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
