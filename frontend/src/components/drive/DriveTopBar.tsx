import { forwardRef } from 'react'
import {
  CheckCircle2,
  Download,
  FolderUp,
  HelpCircle,
  Plus,
  Search,
  Trash2,
  Upload as UploadIcon,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NewMenuItems, NewMenuActions } from './NewMenu'

interface DriveTopBarProps extends NewMenuActions {
  searchValue: string
  onSearchChange: (v: string) => void
  canUpload: boolean
  onShowHelp: () => void
  newMenuOpen: boolean
  onNewMenuOpenChange: (open: boolean) => void
  onUploadFolder?: () => void
  selection?: {
    fileCount: number
    folderCount: number
    onClear: () => void
    onDelete: () => void
    onDownloadFiles: () => void
    onDownloadFolders: () => void
    totalCount: number
  }
}

const DriveTopBar = forwardRef<HTMLInputElement, DriveTopBarProps>(function DriveTopBar(
  {
    searchValue,
    onSearchChange,
    canUpload,
    onShowHelp,
    onUpload,
    onUploadFolder,
    onNewFolder,
    onNewNote,
    onNewOffice,
    onAddRemote,
    newMenuOpen,
    onNewMenuOpenChange,
    selection,
  },
  searchRef,
) {
  const { t } = useTranslation()
  return (
    <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur xl:flex-nowrap xl:px-6">
      <h1 className="mr-auto font-display text-xl font-semibold tracking-[-0.025em] text-foreground">
        {t('nav.files')}
      </h1>

      {selection ? (
        <>
          <div
            role="status"
            aria-live="polite"
            className="order-3 flex w-full items-center gap-2 text-sm font-medium text-foreground xl:order-none xl:w-auto"
          >
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('drive.selected', { count: selection.totalCount })}
          </div>
          <div
            role="group"
            className="ml-auto flex flex-wrap items-center justify-end gap-2"
            aria-label={t('drive.selectionActions')}
          >
            {selection.fileCount > 0 && (
              <Button size="sm" variant="outline" onClick={selection.onDownloadFiles}>
                <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t('drive.downloadFiles', { count: selection.fileCount })}
              </Button>
            )}
            {selection.folderCount > 0 && (
              <Button size="sm" variant="outline" onClick={selection.onDownloadFolders}>
                <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t('drive.downloadFolders', { count: selection.folderCount })}
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={selection.onDelete}>
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t('mobile.item.trash', 'Move to Trash')}
            </Button>
            <Button size="sm" variant="ghost" onClick={selection.onClear}>
              <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t('drive.clear')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="relative order-3 w-full xl:order-none xl:mx-auto xl:max-w-xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={searchRef}
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('drive.searchPlaceholder')}
              className="h-9 border-transparent bg-muted/60 pl-9 pr-9 focus-visible:bg-background"
              aria-label={t('drive.searchAria')}
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label={t('common.clearSearch')}
                className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center justify-end gap-2">
            <DropdownMenu open={newMenuOpen} onOpenChange={onNewMenuOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t('common.new')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <NewMenuItems
                  canCreate={canUpload}
                  onNewFolder={onNewFolder}
                  onNewNote={onNewNote}
                  onNewOffice={onNewOffice}
                  onAddRemote={onAddRemote}
                  showAddRemote={!!onAddRemote}
                  showOffice={!!onNewOffice}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            {canUpload && onUpload && (
              <Button
                onClick={onUpload}
                variant="outline"
                className="gap-2"
                aria-label={t('common.upload')}
                title={t('common.upload')}
              >
                <UploadIcon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden 2xl:inline">{t('common.upload')}</span>
              </Button>
            )}
            {canUpload && onUploadFolder && (
              <Button
                variant="outline"
                size="icon"
                onClick={onUploadFolder}
                data-testid="upload-folder-button"
                aria-label={t('common.uploadFolderAriaTitle')}
                title={t('common.uploadFolderAriaTitle')}
              >
                <FolderUp className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onShowHelp}
              aria-label={t('common.shortcutsAria')}
              title={t('common.shortcutsTitle')}
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </>
      )}
    </header>
  )
})

export default DriveTopBar
