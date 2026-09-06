import { FolderPlus, FileText, FileSpreadsheet, Presentation, Upload as UploadIcon, Globe, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export type OfficeKind = 'docx' | 'xlsx' | 'pptx' | 'excalidraw'

export interface NewMenuActions {
  onNewFolder: () => void
  onNewNote: () => void
  onNewOffice?: (kind: OfficeKind) => void
  onUpload?: () => void
  onAddRemote?: () => void
}

interface NewMenuItemsProps extends NewMenuActions {
  /** Whether the current folder accepts newly created or uploaded content. */
  canCreate?: boolean
  /** Show the Upload entry (omit when the topbar already has its own button). */
  showUpload?: boolean
  /** Show the federated "Add remote share" entry. */
  showAddRemote?: boolean
  /** Show the OnlyOffice doc / sheet / slide entries. Hidden when the
   *  integration isn't installed; default true. */
  showOffice?: boolean
}

export function NewMenuItems({
  onNewFolder,
  onNewNote,
  onNewOffice,
  onUpload,
  onAddRemote,
  canCreate = true,
  showUpload = false,
  showAddRemote = true,
  showOffice = true,
}: NewMenuItemsProps) {
  const { t } = useTranslation()
  return (
    <>
      <DropdownMenuItem onSelect={onNewFolder} disabled={!canCreate}>
        <FolderPlus className="mr-2 h-4 w-4" />
        {t('newMenu.folder')}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onNewNote} disabled={!canCreate}>
        <FileText className="mr-2 h-4 w-4" />
        {t('newMenu.note')}
      </DropdownMenuItem>
      {showOffice && onNewOffice && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onNewOffice('docx')} disabled={!canCreate}>
            <FileText className="mr-2 h-4 w-4 text-blue-500" />
            {t('newMenu.docx')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onNewOffice('xlsx')} disabled={!canCreate}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-500" />
            {t('newMenu.xlsx')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onNewOffice('pptx')} disabled={!canCreate}>
            <Presentation className="mr-2 h-4 w-4 text-orange-500" />
            {t('newMenu.pptx')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onNewOffice('excalidraw')} disabled={!canCreate}>
            <Pencil className="mr-2 h-4 w-4 text-pink-500" />
            {t('newMenu.excalidraw')}
          </DropdownMenuItem>
        </>
      )}
      {showUpload && onUpload && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onUpload} disabled={!canCreate}>
            <UploadIcon className="mr-2 h-4 w-4" />
            {t('newMenu.uploadFiles')}
          </DropdownMenuItem>
        </>
      )}
      {showAddRemote && onAddRemote && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onAddRemote}>
            <Globe className="mr-2 h-4 w-4" />
            {t('newMenu.addRemote')}
          </DropdownMenuItem>
        </>
      )}
    </>
  )
}
