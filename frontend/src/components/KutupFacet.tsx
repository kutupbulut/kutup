import { cn } from '@/lib/utils'

export type KutupFacetDestination = 'files' | 'messages' | 'account'

interface KutupFacetProps {
  active?: KutupFacetDestination
  className?: string
  label?: string
  size?: number
}

const FACETS: Array<{
  destination: KutupFacetDestination
  points: string
}> = [
  { destination: 'files', points: '8,3 14,14 8,25 2,14' },
  { destination: 'messages', points: '22,1 30,14 22,27 14,14' },
  { destination: 'account', points: '37,4 43,14 37,24 31,14' },
]

/**
 * The Polar Workspace signature mark. Its three facets encode the mobile
 * information architecture—Files, Messages, and Account—using the geometry of
 * Kutup's protected three-diamond logo without replacing that brand asset.
 */
export function KutupFacet({
  active,
  className,
  label,
  size = 44,
}: KutupFacetProps) {
  return (
    <svg
      viewBox="0 0 45 28"
      width={size}
      height={(size / 45) * 28}
      fill="none"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('shrink-0 text-primary', className)}
      data-testid="kutup-facet"
    >
      {FACETS.map((facet, index) => (
        <polygon
          key={facet.destination}
          points={facet.points}
          className={cn(
            'transition-[fill,opacity] duration-150',
            active == null || active === facet.destination
              ? 'fill-current'
              : 'fill-current opacity-20',
            active == null && index === 0 && 'opacity-65',
            active == null && index === 2 && 'opacity-35',
          )}
          data-facet={facet.destination}
        />
      ))}
    </svg>
  )
}
