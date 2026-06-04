import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  stepAmount?: number
  minValue?: number
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { className, stepAmount, minValue = 0, step = 'any', disabled, onChange, ...props },
  ref,
) {
  const innerRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => innerRef.current as HTMLInputElement)

  function resolveStep(): number {
    if (stepAmount != null) return stepAmount
    if (step === 'any') return 1
    const parsed = Number(step)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  }

  function notifyChange(el: HTMLInputElement) {
    onChange?.({
      target: el,
      currentTarget: el,
    } as ChangeEvent<HTMLInputElement>)
  }

  function adjust(direction: 1 | -1) {
    const el = innerRef.current
    if (!el || disabled) return

    const increment = resolveStep()
    const current = Number.parseFloat(el.value)
    const base = Number.isFinite(current) ? current : 0
    const next = Math.max(minValue, base + direction * increment)
    const nextText = Number.isInteger(increment) && Number.isInteger(next) ? String(next) : String(next)

    el.value = nextText
    notifyChange(el)
  }

  return (
    <div className={cn('number-input', disabled && 'number-input--disabled')}>
      <input
        ref={innerRef}
        type="number"
        step={step}
        min={minValue}
        disabled={disabled}
        className={cn('number-input__field', className)}
        onChange={onChange}
        {...props}
      />
      <div className="number-input__stepper" role="group" aria-label="Zmiana ilości">
        <button
          type="button"
          className="number-input__btn"
          disabled={disabled}
          aria-label="Zmniejsz"
          onClick={() => adjust(-1)}
        >
          −
        </button>
        <button
          type="button"
          className="number-input__btn"
          disabled={disabled}
          aria-label="Zwiększ"
          onClick={() => adjust(1)}
        >
          +
        </button>
      </div>
    </div>
  )
})
