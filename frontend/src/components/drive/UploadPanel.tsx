import { Progress } from '@/components/ui/progress'
import { useTranslation } from 'react-i18next'
import { formatSpeed } from '@/lib/format'
import type { UploadState } from '@/types/drive'

interface Props {
  state: UploadState
}

export default function UploadPanel({ state }: Props) {
  const { t } = useTranslation()
  if (!state.active) return null

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label={t('upload.progressLabel', {
        current: state.currentFile,
        total: state.totalFiles,
        percent: state.overallPercent,
      })}
      className="fixed bottom-24 right-3 z-40 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-popover/95 p-4 shadow-xl backdrop-blur md:bottom-6 md:right-6"
    >
      <p className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        {t('upload.progress')}{' '}
        <span className="font-medium text-foreground">
          {state.currentFile} / {state.totalFiles}
        </span>
      </p>
      <Progress
        value={state.overallPercent}
        aria-label={t('upload.overallProgress')}
        className="mb-2 h-1.5"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{state.overallPercent}%</span>
        <span>{formatSpeed(state.speedBps)}</span>
      </div>
    </section>
  )
}
