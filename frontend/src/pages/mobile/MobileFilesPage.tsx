import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, ICONS } from '@/components/mobile/Icon'
import { FolderSVG } from '@/components/mobile/FolderSVG'
import { FileTypeIcon } from '@/components/mobile/FileTypeIcon'
import { MobilePageHeader } from '@/components/mobile/MobilePageHeader'
import { MobileSearchInput } from '@/components/mobile/MobileSearchInput'
import { IconButton } from '@/components/ui/icon-button'
import { Surface } from '@/components/ui/surface'
import { SectionLabel } from '@/components/ui/section-label'
import { PressableRow } from '@/components/ui/pressable-row'
import { StorageCard } from '@/components/ui/storage-card'
import { EmptyState } from '@/components/ui/empty-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { SheetAction } from '@/components/ui/sheet-action'
import { formatBytes } from '@/lib/format'
import { formatDateShort, formatDateLong } from '@/components/mobile/dateFormat'
import type { Collection, DecryptedFile } from '@/types/drive'
import type { FolderColorName } from '@/components/mobile/FolderSVG'
import { cn } from '@/lib/utils'

/**
 * MobileFilesPage — direct port of the design's Files screen.
 *
 * Renders the existing Drive data (folders + files at the current level) with
 * the design's visual language: large title, storage card on root, 2-col
 * folder grid + file list, search slide-in, and an "Add to Kutup" sheet.
 *
 * Driven by props from `Drive.tsx` so its rich state (selection, breadcrumb
 * stack, upload pipeline, dialogs) stays the source of truth — no data
 * duplication. Every exposed action delegates to an existing Drive flow.
 */

interface MobileFilesPageProps {
  folders: Collection[]
  files: DecryptedFile[]
  currentFolder: Collection | null
  /** True at the root of the active My files or Shared with me view. */
  isAtRoot: boolean
  viewMode: 'myfiles' | 'shared'
  /** Total bytes used by this user. */
  usedBytes: number
  /** Storage quota in bytes. */
  quotaBytes: number
  onOpenFolder: (folder: Collection) => void
  onOpenFile: (file: DecryptedFile) => void
  onBack: () => void
  onViewModeChange: (view: 'myfiles' | 'shared') => void
  onOpenTrash: () => void
  /** Show item-action sheet for a folder or file. */
  onItemMore: (item: Collection | DecryptedFile) => void
  /** Add-sheet actions. */
  onUploadFiles: () => void
  onUploadFolder: () => void
  onNewFolder: () => void
  onNewNote: () => void
  onNewWhiteboard: () => void
  canCreate: boolean
  /** Optional remote-share intake. */
  onPasteEncryptedLink?: () => void
}

export function MobileFilesPage(props: MobileFilesPageProps) {
  const {
    folders,
    files,
    currentFolder,
    isAtRoot,
    viewMode,
    usedBytes,
    quotaBytes,
    onOpenFolder,
    onOpenFile,
    onBack,
    onViewModeChange,
    onOpenTrash,
    onItemMore,
    onUploadFiles,
    onUploadFolder,
    onNewFolder,
    onNewNote,
    onNewWhiteboard,
    canCreate,
    onPasteEncryptedLink,
  } = props
  const { t } = useTranslation()

  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const filteredFolders = useMemo(() => {
    if (!search) return folders
    const q = search.toLowerCase()
    return folders.filter((f) => (f.decryptedName ?? '').toLowerCase().includes(q))
  }, [folders, search])

  const filteredFiles = useMemo(() => {
    if (!search) return files
    const q = search.toLowerCase()
    return files.filter((f) => (f.decryptedName ?? '').toLowerCase().includes(q))
  }, [files, search])

  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0
  const showLargeTitle = isAtRoot && !searchOpen

  const titleText = isAtRoot
    ? t('nav.files', 'Files')
    : currentFolder?.decryptedName ?? ''
  const subtitleText = showLargeTitle
    ? t('mobile.files.subtitle', '{{folders}} folders · {{files}} files', {
        folders: folders.length,
        files: files.length,
      })
    : undefined

  return (
    <>
      <MobilePageHeader
        title={titleText}
        subtitle={subtitleText}
        large={showLargeTitle}
        back={!isAtRoot}
        onBack={onBack}
        right={
          searchOpen ? null : (
            <>
              <IconButton
                icon="search"
                onClick={() => setSearchOpen(true)}
                ariaLabel={t('mobile.files.search.placeholder', 'Search in Kutup…')}
              />
              {canCreate && (
                <IconButton
                  icon="plus"
                  onClick={() => setAddOpen(true)}
                  accent
                  ariaLabel={t('mobile.sheet.add.title', 'Add to Kutup')}
                />
              )}
            </>
          )
        }
      />

      {searchOpen && (
        <MobileSearchInput
          value={search}
          onChange={setSearch}
          onCancel={() => {
            setSearch('')
            setSearchOpen(false)
          }}
          autoFocus
        />
      )}

      <div className="flex-1 overflow-auto px-3.5 pt-3 pb-24">
        {isAtRoot && !searchOpen && (
          <div
            role="group"
            aria-label={t('mobile.files.views', 'Files views')}
            className="mb-4 flex items-center gap-1 rounded-xl bg-muted/70 p-1"
          >
            <button
              type="button"
              aria-pressed={viewMode === 'myfiles'}
              onClick={() => onViewModeChange('myfiles')}
              className={cn(
                'min-h-9 flex-1 rounded-lg px-3 text-sm font-medium transition-colors',
                viewMode === 'myfiles'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('nav.myFiles')}
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'shared'}
              onClick={() => onViewModeChange('shared')}
              className={cn(
                'min-h-9 flex-1 rounded-lg px-3 text-sm font-medium transition-colors',
                viewMode === 'shared'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('nav.sharedWithMe')}
            </button>
            <button
              type="button"
              onClick={onOpenTrash}
              aria-label={t('nav.trash')}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <Icon d={ICONS.trash} size={16} />
            </button>
          </div>
        )}

        {isAtRoot && viewMode === 'myfiles' && !searchOpen && (
          <div className="mb-4">
            <StorageCard used={usedBytes} quota={quotaBytes} />
          </div>
        )}

        {isEmpty && search && (
          <EmptyState
            icon="search"
            title={t('mobile.files.search.empty', 'No results for "{{q}}"', { q: search })}
            subtitle={t('mobile.files.empty.subtitle', 'Try a different search term')}
            tint="muted"
          />
        )}

        {isEmpty && !search && (
          <EmptyState
            icon={viewMode === 'shared' ? 'users' : 'folder'}
            title={viewMode === 'shared'
              ? t('mobile.shared.empty.title', 'Nothing shared yet')
              : t(canCreate ? 'drive.emptyFolderTitle' : 'drive.emptyReadOnlyTitle')}
            subtitle={viewMode === 'shared'
              ? t('drive.noSharedFolders')
              : t(canCreate ? 'drive.emptyFolderDescription' : 'drive.emptyReadOnlyDescription')}
            tint="muted"
          />
        )}

        {filteredFolders.length > 0 && (
          <div className="mb-5">
            <SectionLabel>
              {t('mobile.section.folders', 'Folders · {{n}}', { n: filteredFolders.length })}
            </SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {filteredFolders.map((folder) => (
                <FolderTile
                  key={folder.id}
                  folder={folder}
                  onOpen={onOpenFolder}
                  onMore={onItemMore}
                />
              ))}
            </div>
          </div>
        )}

        {filteredFiles.length > 0 && (
          <div>
            <SectionLabel>
              {t('mobile.section.files', 'Files · {{n}}', { n: filteredFiles.length })}
            </SectionLabel>
            <Surface>
              {filteredFiles.map((file, i) => (
                <FileListRow
                  key={file.id}
                  file={file}
                  onOpen={onOpenFile}
                  onMore={onItemMore}
                  last={i === filteredFiles.length - 1}
                />
              ))}
            </Surface>
          </div>
        )}
      </div>

      {/* Add sheet (FAB-in-header) */}
      <BottomSheet
        open={canCreate && addOpen}
        onOpenChange={setAddOpen}
        title={t('mobile.sheet.add.title', 'Add to Kutup')}
      >
        <SheetAction
          icon="upload"
          label={t('mobile.sheet.add.upload', 'Upload files')}
          sub={t('mobile.sheet.add.uploadSub', 'From your device')}
          onClick={() => {
            setAddOpen(false)
            onUploadFiles()
          }}
          variant="primary"
        />
        <SheetAction
          icon="folderPlus"
          label={t('mobile.sheet.add.uploadFolder', 'Upload folder')}
          onClick={() => {
            setAddOpen(false)
            onUploadFolder()
          }}
        />
        <SheetAction
          icon="folderPlus"
          label={t('mobile.sheet.add.newFolder', 'New folder')}
          onClick={() => {
            setAddOpen(false)
            onNewFolder()
          }}
        />
        <SheetAction
          icon="rename"
          label={t('mobile.sheet.add.newNote', 'New note')}
          onClick={() => {
            setAddOpen(false)
            onNewNote()
          }}
        />
        <SheetAction
          icon="star"
          label={t('mobile.sheet.add.newWhiteboard', 'New whiteboard')}
          onClick={() => {
            setAddOpen(false)
            onNewWhiteboard()
          }}
        />
        {onPasteEncryptedLink && (
          <SheetAction
            icon="key"
            label={t('mobile.sheet.add.pasteLink', 'Paste encrypted link')}
            sub={t('mobile.sheet.add.pasteLinkSub', 'Decrypt a shared file')}
            onClick={() => {
              setAddOpen(false)
              onPasteEncryptedLink()
            }}
            last
          />
        )}
      </BottomSheet>
    </>
  )
}

/** Internal: a single folder tile in the 2-col grid. */
function FolderTile({
  folder,
  onOpen,
  onMore,
}: {
  folder: Collection
  onOpen: (f: Collection) => void
  onMore: (f: Collection) => void
}) {
  const { t } = useTranslation()
  const [pressed, setPressed] = useState(false)
  const name = folder.decryptedName ?? '...'
  return (
    <div
      className={cn(
        'relative p-3 border border-border-light rounded-[var(--radius-lg)]',
        'select-none transition-colors flex flex-col gap-2',
        pressed ? 'bg-surface-raised' : 'bg-surface',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(folder)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onTouchCancel={() => setPressed(false)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        aria-label={t('folders.openNamed', { name })}
        className="absolute inset-0 z-0 cursor-pointer rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />
      <div className="pointer-events-none relative z-[1] flex items-start justify-between">
        <FolderSVG color={folder.color as FolderColorName} size={40} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onMore(folder)
          }}
          aria-label="More actions"
          className="pointer-events-auto relative z-10 w-7 h-7 rounded-[14px] border-0 bg-transparent cursor-pointer text-text-tertiary flex items-center justify-center -mr-1 -mt-1"
        >
          <Icon d={ICONS.more} size={16} />
        </button>
      </div>
      <div className="pointer-events-none relative z-[1] min-w-0">
        <div className="text-[13.5px] font-semibold text-text-primary flex items-center gap-1 truncate">
          {folder.isRemote && (
            <Icon d={ICONS.globe} size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
          )}
          <span className="truncate">{name}</span>
        </div>
        <div className="text-[11.5px] text-text-tertiary mt-0.5 flex items-center gap-1">
          {folder.isShared && <Icon d={ICONS.users} size={10} />}
        </div>
      </div>
    </div>
  )
}

/** Internal: a single file row inside the surface. */
function FileListRow({
  file,
  onOpen,
  onMore,
  last,
}: {
  file: DecryptedFile
  onOpen: (f: DecryptedFile) => void
  onMore: (f: DecryptedFile) => void
  last: boolean
}) {
  const { t } = useTranslation()
  const name = file.decryptedName ?? '—'
  return (
    <PressableRow last={last} className="relative">
      <button
        type="button"
        onClick={() => onOpen(file)}
        aria-label={t('files.openNamed', { name })}
        className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />
      <span className="pointer-events-none relative z-[1]">
        <FileTypeIcon mime={file.decryptedMimeType} size={40} />
      </span>
      <div className="pointer-events-none relative z-[1] flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {name}
        </div>
        <div className="text-[12px] text-text-tertiary mt-0.5">
          {formatDateShort(file.createdAt)} · {formatBytes(file.decryptedSize ?? 0)}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onMore(file)
        }}
        aria-label="More actions"
        className="relative z-10 w-8 h-8 rounded-2xl border-0 bg-transparent cursor-pointer text-text-tertiary flex items-center justify-center"
      >
        <Icon d={ICONS.more} size={16} />
      </button>
    </PressableRow>
  )
}

// Re-export for tests / external usage.
export { formatDateLong }
