import { useMemo } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { isKnownUnit, UNIT_OPTIONS } from '@/lib/unit-options'

interface UnitComboboxProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  'aria-labelledby'?: string
  className?: string
}

export function UnitCombobox({
  id,
  value,
  onValueChange,
  'aria-labelledby': ariaLabelledBy,
  className,
}: UnitComboboxProps) {
  const options = useMemo(() => {
    if (value && !isKnownUnit(value)) {
      return [{ value, label: value }, ...UNIT_OPTIONS]
    }
    return UNIT_OPTIONS
  }, [value])

  return (
    <Combobox
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      allowSearch={false}
      placeholder="Wybierz jednostkę"
      emptyText="Brak jednostek."
      aria-labelledby={ariaLabelledBy}
      className={className}
    />
  )
}
