import { Checkbox } from '@/components/ui/checkbox'
import { formatUnit } from '@/lib/utils'
import type { ShoppingListItem } from '@/types/domain'

interface ShoppingItemRowProps {
  item: ShoppingListItem
  onToggle: (item: ShoppingListItem, purchased: boolean) => void
  onDelete: (item: ShoppingListItem) => void
  disabled?: boolean
}

export function ShoppingItemRow({ item, onToggle, onDelete, disabled }: ShoppingItemRowProps) {
  const name = item.ingredient?.name ?? item.ingredientId
  const qty = formatUnit(Number(item.quantityNeeded), item.unit)

  return (
    <li
      className={`shopping-row${item.purchased ? ' shopping-row--done' : ''}`}
      data-purchased={item.purchased ? 'true' : 'false'}
    >
      <Checkbox
        className="shopping-row__check"
        checked={item.purchased}
        disabled={disabled}
        onCheckedChange={(v) => onToggle(item, v === true)}
        aria-label={`Kupione: ${name}`}
      />
      <span className="shopping-row__label">
        {name}
        <span className="shopping-row__qty"> - {qty}</span>
      </span>
      <button
        type="button"
        className="shopping-row__remove"
        disabled={disabled}
        onClick={() => onDelete(item)}
      >
        Usuń
      </button>
    </li>
  )
}
