import { Check, ChevronsUpDown } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  value: string
  onValueChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  id?: string
  'aria-labelledby'?: string
  className?: string
  allowSearch?: boolean
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = 'Wybierz...',
  searchPlaceholder = 'Szukaj...',
  emptyText = 'Brak wyników.',
  id,
  'aria-labelledby': ariaLabelledBy,
  className,
  allowSearch = true,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const listboxId = useId()
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          id={id}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            'combobox-trigger',
            open && 'combobox-trigger--open',
            !selected && 'combobox-trigger--placeholder',
            className,
          )}
        >
          <span className="combobox-trigger__label">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="combobox-trigger__icon" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="combobox-popover w-[var(--radix-popover-trigger-width)] min-w-[12rem]"
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        onWheel={(e) => e.stopPropagation()}
      >
        <Command id={listboxId} loop className="combobox-command">
          {allowSearch ? (
            <CommandInput placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
          ) : (
            <div className="combobox-popover__header">
              <p className="combobox-popover__header-label">Wybierz opcję</p>
            </div>
          )}
          <CommandList
            className="combobox-command__list"
            data-scroll-lock-scrollable=""
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isChosen = value === option.value
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    className={cn(isChosen && 'combobox-item--chosen')}
                    onSelect={() => {
                      onValueChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <span
                      className={cn(
                        'combobox-item__check',
                        isChosen && 'combobox-item__check--on',
                      )}
                      aria-hidden="true"
                    >
                      <Check className={cn('size-3.5', !isChosen && 'opacity-0')} />
                    </span>
                    <span className="combobox-item__label">{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
