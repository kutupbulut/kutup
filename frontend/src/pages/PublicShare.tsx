// Public share viewer — no auth required.
// The linkKey lives ONLY in the URL #fragment (never sent to server).
import { useState, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Download, Lock, Loader2, FileText, ShieldCheck } from 'lucide-react'
import api from '@/api/client'
import {
  decryptStream,
  fromBase64,
  openFileRecordV1,
  openPublicLinkCollectionKeyV1,
} from '@/crypto'
import { KutupLogo } from '@/components/KutupLogo'
import { formatBytes } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeSelector } from '@/components/theme/ThemeSelector'

interface DecryptedFile {
  id: string
  collectionId: string
  metadataEnvelope: string
  fileKeyEnvelope: string
  keyEpoch: number
  metadataRevision: number
  encryptedSizeBytes: number
  createdAt: string
  decryptedName?: string
  decryptedMimeType?: string
  decryptedSize?: number
  _fileKey?: Uint8Array
}

type State = 'loading' | 'ready' | 'error' | 'expired'

function PublicShareFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border-light bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <KutupLogo size={26} />
            <span className="font-display text-lg font-semibold tracking-[-0.02em]">Kutup</span>
          </div>
          <ThemeSelector compact />
        </div>
      </header>
      {children}
    </div>
  )
}

function ShareStatus({ icon, title, description }: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <PublicShareFrame>
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border-light bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-faint text-primary">
            {icon}
          </div>
          <h1 className="font-display text-xl font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </main>
    </PublicShareFrame>
  )
}

export default function PublicShare() {
  const { token } = useParams<{ token: string }>()
  const { t } = useTranslation()
  const [state, setState] = useState<State>('loading')
  const [error, setError] = useState('')
  const [files, setFiles] = useState<DecryptedFile[]>([])
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (token) loadShare()
  }, [token])

  async function loadShare() {
    const fragment = window.location.hash.slice(1)
    const params = new URLSearchParams(fragment)
    const linkKeyB64 = params.get('key')

    if (!linkKeyB64) {
      setError(t('publicShare.missingKey'))
      setState('error')
      return
    }

    try {
      const linkKey = fromBase64(linkKeyB64)
      const shareRes = await api.get(`/share/${token}`)
      const share = shareRes.data

      if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
        setState('expired')
        return
      }

      const collKey = await openPublicLinkCollectionKeyV1(
        share.collectionKeyEnvelope,
        linkKey,
        {
          collectionId: share.targetId,
          ownerUserId: share.ownerUserId,
          epoch: share.collectionKeyEpoch,
        },
      )

      const filesRes = await api.get(`/share/${token}/files`)
      const decrypted: DecryptedFile[] = await Promise.all(
        filesRes.data.map(async (file: DecryptedFile) => {
          try {
            const { fileKey, metadata: meta } = await openFileRecordV1(file, collKey)
            return { ...file, decryptedName: meta.name, decryptedMimeType: meta.mimeType, decryptedSize: meta.size, _fileKey: fileKey }
          } catch {
            return { ...file, decryptedName: '[could not decrypt]' }
          }
        }),
      )

      setFiles(decrypted)
      setState('ready')
    } catch (err: any) {
      if (err.response?.status === 410) setState('expired')
      else if (err.response?.status === 404) { setError('Share not found'); setState('error') }
      else { setError(err.message ?? 'Failed to load share'); setState('error') }
    }
  }

  async function handleDownload(file: DecryptedFile) {
    if (!file._fileKey) return
    setDownloading(file.id)
    try {
      // The endpoint streams the encrypted blob directly (the old presigned-URL
      // hop pointed at the deployment-internal S3 endpoint and never resolved
      // for external clients).
      const res = await api.get(`/share/${token}/download/${file.id}`, { responseType: 'arraybuffer' })
      const encData = new Uint8Array(res.data)
      const plaintext = await decryptStream(encData, file._fileKey, {
        fileId: file.id,
        collectionId: file.collectionId,
        epoch: file.keyEpoch,
      })
      const blob = new Blob([plaintext.buffer as ArrayBuffer], { type: file.decryptedMimeType ?? 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.decryptedName ?? 'file'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(t('publicShare.downloadFailed'))
    } finally {
      setDownloading(null)
    }
  }

  if (state === 'loading') {
    return (
      <ShareStatus
        icon={<Loader2 className="h-5 w-5 animate-spin" />}
        title={t('publicShare.title')}
        description={t('publicShare.decrypting')}
      />
    )
  }

  if (state === 'expired') {
    return (
      <ShareStatus
        icon={<Lock className="h-5 w-5" />}
        title={t('publicShare.expired.title')}
        description={t('publicShare.expired.desc')}
      />
    )
  }

  if (state === 'error') {
    return (
      <ShareStatus
        icon={<Lock className="h-5 w-5" />}
        title={t('publicShare.error.title')}
        description={error}
      />
    )
  }

  return (
    <PublicShareFrame>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-faint px-3 py-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('publicShare.e2e')}
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {t('publicShare.title')}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            {t('publicShare.subtitle')}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section
          aria-label={t('publicShare.title')}
          className="mt-8 overflow-hidden rounded-2xl border border-border-light bg-surface shadow-sm"
        >
          <div className="hidden grid-cols-[minmax(0,1fr)_7rem_8rem_7rem] gap-4 border-b border-border-light bg-surface-sunken/60 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:grid">
            <span>{t('publicShare.name')}</span>
            <span>{t('publicShare.size')}</span>
            <span>{t('publicShare.date')}</span>
            <span className="sr-only">{t('publicShare.download')}</span>
          </div>
          {files.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              {t('publicShare.noFiles')}
            </div>
          ) : (
            <ul className="divide-y divide-border-light">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="grid gap-3 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_7rem_8rem_7rem] sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-faint text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="truncate text-sm font-medium">{file.decryptedName}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground sm:block sm:text-sm">
                    <span className="sm:hidden">{t('publicShare.size')}:</span>
                    {file.decryptedSize != null ? formatBytes(file.decryptedSize) : '—'}
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground sm:block sm:text-sm">
                    <span className="sm:hidden">{t('publicShare.date')}:</span>
                    {new Date(file.createdAt).toLocaleDateString()}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(file)}
                    disabled={downloading === file.id || !file._fileKey}
                    className="w-full sm:w-auto"
                  >
                    {downloading === file.id ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-3.5 w-3.5" />
                    )}
                    {t('publicShare.download')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </PublicShareFrame>
  )
}
