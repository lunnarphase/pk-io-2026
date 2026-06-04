import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PantryItem } from '@/types/domain'

interface PantryItemRowProps {
  item: PantryItem
  editTrigger: React.ReactNode
  onDelete: (item: PantryItem) => void
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1)
}

function PantryCardName({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [truncated, setTruncated] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => setTruncated(el.scrollWidth > el.clientWidth + 1)
    check()

    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [name])

  return (
    <h2
      className={cn('pantry-card__name-wrap', truncated && 'pantry-card__name-wrap--tip')}
      {...(truncated
        ? {
            'data-tooltip': name,
            tabIndex: 0,
            'aria-label': name,
          }
        : {})}
    >
      <span ref={ref} className="pantry-card__name">
        {name}
      </span>
    </h2>
  )
}

export function PantryItemRow({ item, editTrigger, onDelete }: PantryItemRowProps) {
  const name = item.ingredient?.name ?? item.ingredientId
  const qty = Number(item.quantity)

  return (
    <li>
      <article className="pantry-card">
        <PantryCardName name={name} />
        <p className="pantry-card__qty">
          {formatQuantity(qty)}
          <span className="pantry-card__unit"> {item.unit}</span>
        </p>
        <div className="pantry-card__actions">
          {editTrigger}
          <button
            type="button"
            className="pantry-card__btn pantry-card__btn--danger"
            onClick={() => onDelete(item)}
          >
            Usuń
          </button>
        </div>
      </article>
    </li>
  )
}
