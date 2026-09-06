import { useEffect, useRef } from 'react'
import {
  Download,
  FileText,
  Globe,
  Link2,
  Pencil,
  Share2,
  Trash2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatBytes } from '@/lib/format'
import type { Collection, DecryptedFile } from '@/types/drive'
import { DEFAULT_FOLDER_COLOR, FOLDER_COLORS, FolderIcon } from './FolderIcon'

function isCollection(item: Collection | DecryptedFile): item is Collection {
  return 'ownerUserId' in item
}

interface Props {
  item: Collection | DecryptedFile | null
  canDelete: boolean
  onClose: () => void
  onDownload?: (file: DecryptedFile) => void
  onDownloadFolder?: (col: Collection) => void
  onDelete?: (item: Collection | DecryptedFile) => void
  onRename?: (col: Collection) => void
  onRenameFile?: (file: DecryptedFile) => void
  onColor?: (col: Collection, color: string | null) => void
  onShare?: (col: Collection) => void
  onPublicLink?: (col: Collection) => void
  onEnter?: (col: Collection) => void
}

export default function DetailsPanel({
  item,
  canDelete,
  onClose,
  onDownload,
  onDownloadFolder,
  onDelete,
  onRename,
  onRenameFile,
  onColor,
  onShare,
  onPublicLink,
  onEnter,
}: Props) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const isOpen = item !== null

  useEffect(() => {
    if (!isOpen) return

    returnFocusRef.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    return () => {
      returnFocusRef.current?.focus()
      returnFocusRef.current = null
    }
  }, [isOpen])

  if (!item) return null

  const isFolder = isCollection(item)
  const folder = isFolder ? item : null
  const file = isFolder ? null : item
  const itemName = item.decryptedName ?? (isFolder ? '…' : '[encrypted]')
  const showColorRow = !!folder && !folder.isRemote && !!onColor

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      aria-labelledby="files-details-title"
      className="absolute inset-y-0 right-0 z-30 flex h-full w-[min(22rem,calc(100%-1rem))] shrink-0 flex-col border-l border-border bg-background shadow-2xl outline-none xl:static xl:z-auto xl:w-80 xl:shadow-none"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <h2 id="files-details-title" className="font-display text-lg font-semibold tracking-tight">
          {t('details.title')}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('common.close')}
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
        <div className="flex flex-col items-center gap-3 py-5">
          {folder ? (
            <FolderIcon color={folder.color} size={72} />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          <p className="break-all px-2 text-center text-sm font-semibold text-foreground">
            {itemName}
          </p>
          {folder?.isRemote && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {t('details.federatedShare')}
            </p>
          )}
        </div>

        {file && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-y border-border py-4 text-sm">
            <dt className="text-muted-foreground">{t('details.size')}</dt>
            <dd className="text-right font-medium">
              {file.decryptedSize != null ? formatBytes(file.decryptedSize) : '—'}
            </dd>
            <dt className="text-muted-foreground">{t('details.created')}</dt>
            <dd className="text-right font-medium">
              {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : '—'}
            </dd>
            <dt className="text-muted-foreground">{t('details.type')}</dt>
            <dd className="truncate text-right font-mono text-xs font-medium" title={file.decryptedMimeType}>
              {file.decryptedMimeType ?? '—'}
            </dd>
          </dl>
        )}

        {showColorRow && folder && onColor && (
          <fieldset className="border-y border-border py-4">
            <legend className="sr-only">{t('details.folderColor')}</legend>
            <div className="flex items-center justify-center gap-3">
              {FOLDER_COLORS.map((folderColor) => (
                <button
                  key={folderColor.value}
                  type="button"
                  title={folderColor.label}
                  aria-label={t('details.setColor', { color: folderColor.label })}
                  aria-pressed={folder.color === folderColor.value}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: folderColor.hex,
                    outline: folder.color === folderColor.value ? '2px solid var(--ring)' : 'none',
                    outlineOffset: 2,
                  }}
                  onClick={() => onColor(folder, folderColor.value)}
                />
              ))}
              <button
                type="button"
                title={t('details.defaultColor')}
                aria-label={t('details.defaultColor')}
                aria-pressed={!folder.color}
                className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                style={{
                  background: DEFAULT_FOLDER_COLOR,
                  outline: !folder.color ? '2px solid var(--ring)' : 'none',
                  outlineOffset: 2,
                }}
                onClick={() => onColor(folder, null)}
              />
            </div>
          </fieldset>
        )}

        <Separator className={file || showColorRow ? 'hidden' : undefined} />

        <div className="flex flex-1 flex-col gap-2 pt-5">
          {folder ? (
            <>
              <Button onClick={() => { onEnter?.(folder); onClose() }}>
                {t('details.openFolder')}
              </Button>
              <Button variant="outline" onClick={() => { onDownloadFolder?.(folder); onClose() }}>
                <Download aria-hidden="true" />
                {t('details.downloadFolder')}
              </Button>
              {!folder.isRemote && (
                <>
                  <Button variant="outline" onClick={() => { onRename?.(folder); onClose() }}>
                    <Pencil aria-hidden="true" />
                    {t('details.rename')}
                  </Button>
                  <Button variant="outline" onClick={() => { onShare?.(folder); onClose() }}>
                    <Share2 aria-hidden="true" />
                    {t('details.share')}
                  </Button>
                  <Button variant="outline" onClick={() => { onPublicLink?.(folder); onClose() }}>
                    <Link2 aria-hidden="true" />
                    {t('details.copyPublicLink')}
                  </Button>
                </>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  className="mt-auto"
                  onClick={() => { onDelete?.(folder); onClose() }}
                >
                  <Trash2 aria-hidden="true" />
                  {t('details.deleteFolder')}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={() => { if (file) onDownload?.(file) }}>
                <Download aria-hidden="true" />
                {t('details.download')}
              </Button>
              {canDelete && onRenameFile && (
                <Button
                  variant="outline"
                  onClick={() => { if (file) onRenameFile(file); onClose() }}
                >
                  <Pencil aria-hidden="true" />
                  {t('details.rename')}
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  className="mt-auto"
                  onClick={() => { if (file) onDelete?.(file); onClose() }}
                >
                  <Trash2 aria-hidden="true" />
                  {t('details.delete')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
