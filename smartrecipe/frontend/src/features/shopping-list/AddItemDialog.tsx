import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { addShoppingItem } from '@/api/shopping-list'
import { IngredientCombobox } from '@/components/domain/IngredientCombobox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UnitCombobox } from '@/components/domain/UnitCombobox'
import { DEFAULT_UNIT } from '@/lib/unit-options'
import type { Ingredient } from '@/types/domain'

const schema = z.object({
  quantityNeeded: z.coerce.number().positive(),
  unit: z.string().min(1).max(50),
})

type FormValues = z.infer<typeof schema>

interface AddItemDialogProps {
  trigger: React.ReactNode
}

export function AddItemDialog({ trigger }: AddItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [ingredient, setIngredient] = useState<Ingredient | null>(null)
  const qc = useQueryClient()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantityNeeded: 1, unit: DEFAULT_UNIT },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      addShoppingItem({
        ingredientId: ingredient!.id,
        quantityNeeded: values.quantityNeeded,
        unit: values.unit,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'shopping-list' }] })
      setOpen(false)
      reset()
      setIngredient(null)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj pozycję ręcznie</DialogTitle>
        </DialogHeader>
        <IngredientCombobox value={ingredient} onChange={setIngredient} />
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
        >
          <div>
            <Label htmlFor="qty">Ilość</Label>
            <Input id="qty" type="number" step="any" {...register('quantityNeeded')} />
            {errors.quantityNeeded ? (
              <p className="text-sm text-[var(--color-destructive)]">{errors.quantityNeeded.message}</p>
            ) : null}
          </div>
          <div>
            <Label id="shopping-unit-label">Jednostka</Label>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <UnitCombobox
                  id="unit"
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-labelledby="shopping-unit-label"
                />
              )}
            />
          </div>
          <Button type="submit" disabled={!ingredient || mutation.isPending}>
            Dodaj
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
