import { useTranslation } from 'react-i18next'
import { Icon, ICONS } from '@/components/mobile/Icon'
import { Surface } from '@/components/ui/surface'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'

/** A compact, read-only storage usage summary. */
interface StorageCardProps {
  used: number
  quota: number
  className?: string
}

export function StorageCard({ used, quota, className }: StorageCardProps) {
  const { t } = useTranslation()
  const pct = quota > 0 ? Math.min((used / quota) * 100, 100) : 0

  return (
    <Surface className={cn('p-3.5', className)}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-[10px] bg-primary-faint flex items-center justify-center text-primary shrink-0">
          <Icon d={ICONS.hardDrive} size={16} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-text-primary">
            {t('mobile.account.storage', 'Storage')}
          </div>
          <div className="text-[11.5px] text-text-tertiary">
            {t('mobile.item.e2eBadge', 'End-to-end encrypted')}
          </div>
        </div>
      </div>
      <div className="flex justify-between text-[11.5px] text-text-tertiary mb-1.5">
        <span className="font-medium">
          {t('mobile.account.storageUsed', '{{used}} used', {
            used: formatBytes(used),
          })}
        </span>
        <span>
          {t('mobile.account.storageOf', 'of {{total}}', {
            total: formatBytes(quota),
          })}
        </span>
      </div>
      <div
        className="h-[5px] bg-surface-sunken rounded-[3px] overflow-hidden"
        role="progressbar"
        aria-label={t('mobile.account.storage', 'Storage')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div
          className="h-full bg-primary rounded-[3px] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Surface>
  )
}
