import type { ComboboxOption } from '@/components/ui/combobox'

export function MockCombobox({
  id,
  value,
  onValueChange,
  options,
  'aria-labelledby': labelledBy,
}: {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: ComboboxOption[]
  'aria-labelledby'?: string
}) {
  return (
    <select
      id={id}
      role="combobox"
      aria-labelledby={labelledBy}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
