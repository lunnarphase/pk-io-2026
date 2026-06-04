import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn('flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-paper)]', className)}
      {...props}
    />
  )
}

export function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      className="flex items-center gap-2 border-b border-[var(--color-rule)] px-3 py-2"
      cmdk-input-wrapper=""
    >
      <Search className="size-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
      <CommandPrimitive.Input
        className={cn(
          'flex h-10 w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]',
          className,
        )}
        {...props}
      />
    </div>
  )
}

export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn('max-h-72 overflow-y-auto overflow-x-hidden p-2', className)}
      {...props}
    />
  )
}

export function CommandEmpty({ ...props }: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      className="px-3 py-8 text-center text-sm text-[var(--color-muted)]"
      {...props}
    />
  )
}

export function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn('flex flex-col gap-0.5 text-[var(--color-ink)]', className)}
      {...props}
    />
  )
}

export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        'flex min-h-10 cursor-default select-none items-center gap-3 text-sm text-[var(--color-ink)] outline-none',
        'data-[selected=true]:bg-[color-mix(in_oklch,var(--color-accent)_14%,var(--color-paper-2))]',
        'data-[selected=true]:text-[var(--color-ink)]',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
