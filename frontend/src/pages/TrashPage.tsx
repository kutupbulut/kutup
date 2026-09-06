import { useIsMobile } from '@/hooks/useIsMobile'
import MobileTrashPage from '@/pages/mobile/MobileTrashPage'
import Drive from '@/pages/Drive'

/**
 * TrashPage — `/drive/trash` route handler.
 *
 * **Mobile (`<md:`)**: renders the design's full mobile page via
 * `MobileTrashPage` (large title + Empty button + empty-state hero).
 *
 * **Desktop (`md:`+)**: renders Drive's Trash view inside the persistent app
 * shell. The canonical route is shared across viewports, so bookmarks and the
 * sidebar active state remain truthful.
 */
export default function TrashPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileTrashPage /> : <Drive initialViewMode="trash" />
}
