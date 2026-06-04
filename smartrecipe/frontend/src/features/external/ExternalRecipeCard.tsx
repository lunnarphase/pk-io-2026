import { useLayoutEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importExternalRecipe } from '@/api/external'
import { cn } from '@/lib/utils'
import type { ExternalRecipeHit } from '@/types/domain'
import { toast } from 'sonner'

interface ExternalRecipeCardProps {
  hit: ExternalRecipeHit
}

function sourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host
  } catch {
    return 'Źródło'
  }
}

function ExternalCardTitle({ title }: { title: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [truncated, setTruncated] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => setTruncated(el.scrollHeight > el.clientHeight + 1)
    check()

    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [title])

  return (
    <h2
      className={cn('external-card__title-wrap', truncated && 'external-card__title-wrap--tip')}
      {...(truncated
        ? {
            'data-tooltip': title,
            tabIndex: 0,
            'aria-label': title,
          }
        : {})}
    >
      <span ref={ref} className="external-card__title">
        {title}
      </span>
    </h2>
  )
}

export function ExternalRecipeCard({ hit }: ExternalRecipeCardProps) {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => importExternalRecipe(hit.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'recipes' }] })
      toast.success('Przepis zaimportowany jako szkic')
    },
    onError: () => toast.error('Import nie powiódł się'),
  })

  return (
    <li>
      <article className="external-card">
        <span className="external-card__badge">Katalog zewnętrzny</span>
        <ExternalCardTitle title={hit.title} />
        {hit.sourceUrl ? (
          <a
            href={hit.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="external-card__source"
            title={hit.sourceUrl}
          >
            {sourceLabel(hit.sourceUrl)}
          </a>
        ) : (
          <span className="external-card__source-placeholder" aria-hidden="true" />
        )}
        <div className="external-card__actions">
          <button
            type="button"
            className="external-card__import"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Import...' : 'Importuj jako szkic'}
          </button>
        </div>
      </article>
    </li>
  )
}
