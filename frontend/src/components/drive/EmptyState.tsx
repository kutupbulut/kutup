import { Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface Props {
  canUpload: boolean
  onClick: () => void
}

export default function EmptyState({ canUpload, onClick }: Props) {
  const { t } = useTranslation()
  return (
    <section className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-sunken/50 px-6 py-12 text-center">
      <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary-faint text-primary">
        <Upload className="h-5 w-5" aria-hidden="true" />
      </span>
      {canUpload ? (
        <>
          <h2 className="font-display text-base font-semibold text-foreground">
            {t('drive.emptyFolderTitle')}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t('drive.emptyFolderDescription')}
          </p>
          <Button variant="outline" className="mt-5 gap-2" onClick={onClick}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            {t('drive.uploadFilesAction')}
          </Button>
        </>
      ) : (
        <>
          <h2 className="font-display text-base font-semibold text-foreground">
            {t('drive.emptyReadOnlyTitle')}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t('drive.emptyReadOnlyDescription')}
          </p>
        </>
      )}
    </section>
  )
}
