import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Shield, KeyRound, Globe, Check, ChevronDown, Smartphone, Palette, UserRound } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAppSelector, useAppDispatch } from '@/store'
import { updateTotpEnabled, setColor } from '@/store/authSlice'
import { CURSOR_COLORS_20 } from '@/collab/identity'
import { broadcastColor } from '@/lib/sessionSync'
import api from '@/api/client'
import { listDevices, revokeDevice, type DeviceRow } from '@/api/collab'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeSelector } from '@/components/theme/ThemeSelector'
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav'

const totpVerifySchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Digits only'),
})
type TotpVerifyForm = z.infer<typeof totpVerifySchema>

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
]

function SettingsSection({ icon, title, description, children }: {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border-light bg-surface shadow-sm">
      <div className="flex items-start gap-3 border-b border-border-light px-4 py-4 sm:px-5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-faint text-primary">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="divide-y divide-border-light">{children}</div>
    </section>
  )
}

function SettingsRow({ label, children, stacked = false }: {
  label: string
  children: ReactNode
  stacked?: boolean
}) {
  return (
    <div className={cn(
      'gap-4 px-4 py-3.5 sm:px-5',
      stacked ? 'space-y-3' : 'flex items-center justify-between',
    )}>
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function DevicesSection() {
  const { t } = useTranslation()
  const [devs, setDevs] = useState<DeviceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listDevices()
      setDevs(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const onRevoke = async (id: number) => {
    try {
      await revokeDevice(id)
      setDevs((arr) => arr.map((x) => (x.deviceId === id ? { ...x, isActive: false } : x)))
      toast.success(t('settings.devices.revokedToast'))
    } catch (e) {
      toast.error(t('settings.devices.revokeFailed', { error: e instanceof Error ? e.message : String(e) }))
    }
  }

  return (
    <SettingsSection
      icon={<Smartphone className="h-4 w-4" />}
      title={t('settings.devices.title')}
      description={t('settings.devices.desc')}
    >
      {loading && <div className="px-5 py-4 text-sm text-muted-foreground">{t('common.loading')}</div>}
      {error && <div className="px-5 py-4 text-sm text-destructive">{t('settings.devices.errorPrefix')} {error}</div>}
      {!loading && !error && devs.length === 0 && (
        <div className="px-5 py-4 text-sm text-muted-foreground">{t('settings.devices.empty')}</div>
      )}
      {devs.length > 0 && (
          <ul className="divide-y divide-border-light">
            {devs.map((d) => {
              const label = d.label || t('settings.devices.fallbackLabel', { id: d.deviceId })
              return (
                <li key={d.deviceId} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.isActive ? t('settings.devices.active') : t('settings.devices.revoked')} ·{' '}
                      {t('settings.devices.createdAt', { when: new Date(d.createdAt).toLocaleString() })}
                      {d.lastSeenAt && ` · ${t('settings.devices.lastSeenAt', { when: new Date(d.lastSeenAt).toLocaleString() })}`}
                    </div>
                  </div>
                  {d.isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          {t('settings.devices.revoke')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('settings.devices.revokeTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('settings.devices.revokeDesc', { label })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => onRevoke(d.deviceId)}
                          >
                            {t('settings.devices.revoke')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </li>
              )
            })}
          </ul>
      )}
    </SettingsSection>
  )
}

export default function Settings() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const lang = i18n.language.startsWith('tr') ? 'tr' : 'en'
  const currentLang = LANGUAGES.find((l) => l.code === lang)
  const auth = useAppSelector((s) => s.auth)

  const [totpSetup, setTotpSetup] = useState<{ secret: string; qrUri: string } | null>(null)
  const [totpDialogOpen, setTotpDialogOpen] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)

  const quotaPercent =
    auth.storageQuotaBytes > 0
      ? Math.min(Math.round((auth.storageUsedBytes / auth.storageQuotaBytes) * 100), 100)
      : 0

  const totpForm = useForm<TotpVerifyForm>({ resolver: zodResolver(totpVerifySchema) })

  async function startTOTPSetup() {
    setSetupLoading(true)
    try {
      const res = await api.post('/user/2fa/setup')
      setTotpSetup(res.data)
      setTotpDialogOpen(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t('settings.totp.setupFailed'))
    } finally {
      setSetupLoading(false)
    }
  }

  async function onVerifyTOTP({ code }: TotpVerifyForm) {
    try {
      await api.post('/user/2fa/verify', { code })
      dispatch(updateTotpEnabled(true))
      setTotpDialogOpen(false)
      setTotpSetup(null)
      totpForm.reset()
      toast.success(t('settings.totp.enabledToast'))
    } catch (err: any) {
      totpForm.setError('code', { message: err.response?.data?.error ?? 'Invalid code' })
    }
  }

  async function disableTOTP() {
    try {
      await api.delete('/user/2fa')
      dispatch(updateTotpEnabled(false))
      toast.success(t('settings.totp.disabledToast'))
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t('settings.totp.disableFailed'))
    }
  }

  async function updatePresenceColor(hex: string | null) {
    const previous = auth.color
    dispatch(setColor(hex))
    broadcastColor(hex)
    try {
      await api.patch('/user/me', { color: hex ?? '' })
    } catch (err: any) {
      dispatch(setColor(previous))
      broadcastColor(previous)
      toast.error(err.response?.data?.error ?? t('settings.account.presenceColorFailed'))
    }
  }

  return (
    <main
      className="h-full overflow-y-auto"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="mx-auto max-w-3xl space-y-5 px-4 pb-24 pt-6 sm:px-8 sm:pt-9 md:pb-9">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Kutup</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.035em]">{t('settings.title')}</h1>
      </div>

      <SettingsSection icon={<UserRound className="h-4 w-4" />} title={t('settings.account.title')}>
          <SettingsRow label={t('settings.account.email')}>
            <span className="max-w-[65%] truncate text-sm font-medium">{auth.email}</span>
          </SettingsRow>
          <SettingsRow label={t('settings.account.username')}>
            <span className="text-sm font-medium">@{auth.username}</span>
          </SettingsRow>
          <SettingsRow label={t('settings.account.storage')} stacked>
            <div className="flex justify-between text-sm">
              <span>{formatBytes(auth.storageUsedBytes)} / {formatBytes(auth.storageQuotaBytes)}</span>
              <span className="text-muted-foreground">{quotaPercent}%</span>
            </div>
            <Progress
              value={quotaPercent}
              className="h-1.5"
              aria-label={t('settings.account.storage')}
            />
          </SettingsRow>
          <SettingsRow label={t('settings.account.presenceColor')} stacked>
            <div className="flex justify-between items-center">
              <p className="max-w-md text-xs leading-5 text-muted-foreground">{t('settings.account.presenceColorDesc')}</p>
              <div className="flex items-center gap-3">
                <span className="sr-only">
                  {auth.color
                    ? t('settings.account.presenceColorSelected', { color: auth.color })
                    : t('settings.account.presenceColorNone', 'No presence color selected')}
                </span>
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full shrink-0',
                    auth.color
                      ? 'border border-foreground/15'
                      : 'border border-dashed border-muted-foreground/40',
                  )}
                  style={auth.color ? { background: auth.color } : undefined}
                  aria-hidden="true"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updatePresenceColor(null)}
                  className={cn(
                    'transition-opacity',
                    auth.color ? 'opacity-100' : 'opacity-0 pointer-events-none',
                  )}
                  aria-hidden={!auth.color}
                  tabIndex={auth.color ? undefined : -1}
                >
                  {t('settings.account.presenceColorClear')}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CURSOR_COLORS_20.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => updatePresenceColor(hex)}
                  className={`h-7 w-7 rounded-full border-2 ${auth.color === hex ? 'border-foreground' : 'border-transparent'} transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                  style={{ background: hex }}
                  aria-label={hex}
                  title={hex}
                />
              ))}
            </div>
          </SettingsRow>
      </SettingsSection>

      <SettingsSection
        icon={<Shield className="h-4 w-4" />}
        title={t('settings.totp.title')}
        description={auth.totpEnabled ? t('settings.totp.active') : t('settings.totp.addSecurity')}
      >
        <div className="px-4 py-4 sm:px-5">
          {auth.totpEnabled ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/25 bg-primary-faint text-primary">{t('settings.totp.enabled')}</Badge>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">{t('settings.totp.disable')}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.totp.disableTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.totp.disableDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={disableTOTP}
                    >
                      {t('settings.totp.disableConfirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button size="sm" onClick={startTOTPSetup} disabled={setupLoading}>
                {setupLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('settings.totp.setUp')}
              </Button>
            </div>
          )}
        </div>
      </SettingsSection>

      <DevicesSection />

      <SettingsSection icon={<Palette className="h-4 w-4" />} title={t('theme.label')}>
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-muted-foreground">{t('theme.description')}</p>
          <ThemeSelector className="w-full shrink-0 sm:w-auto sm:min-w-72" />
        </div>
      </SettingsSection>

      <SettingsSection icon={<Globe className="h-4 w-4" />} title={t('settings.language.title')}>
        <div className="px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t('settings.language.desc')}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  {currentLang?.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGUAGES.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => i18n.changeLanguage(l.code)}
                    className="gap-2"
                  >
                    <Check className={`h-3.5 w-3.5 ${lang === l.code ? 'opacity-100' : 'opacity-0'}`} />
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={<KeyRound className="h-4 w-4" />} title={t('settings.encryption.title')}>
        <div className="space-y-2 px-4 py-4 text-sm leading-6 text-muted-foreground sm:px-5">
          <p>{t('settings.encryption.desc1')}</p>
          <p>
            {t('settings.encryption.desc2')}{' '}
            <Link to="/recover" className="text-primary hover:underline">{t('settings.encryption.recoveryLink')}</Link>{' '}
            {t('settings.encryption.desc2end')}
          </p>
        </div>
      </SettingsSection>

      </div>

      <Dialog open={totpDialogOpen} onOpenChange={setTotpDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('settings.totp.setupTitle')}</DialogTitle>
          </DialogHeader>
          {totpSetup && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('settings.totp.scanQr')}
              </p>
              <div className="flex justify-center bg-white rounded-lg p-3">
                <QRCodeSVG value={totpSetup.qrUri} size={160} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('settings.totp.manualKey')}</p>
                <code className="block bg-muted px-3 py-2 rounded text-xs font-mono tracking-widest text-primary">
                  {totpSetup.secret}
                </code>
              </div>
              <Form {...totpForm}>
                <form onSubmit={totpForm.handleSubmit(onVerifyTOTP)} className="space-y-3">
                  <FormField
                    control={totpForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.totp.confirmCode')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            className="text-center text-xl tracking-widest"
                            placeholder="000000"
                            autoFocus
                            autoComplete="one-time-code"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setTotpDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={totpForm.formState.isSubmitting}>
                      {totpForm.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {t('settings.totp.enableButton')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </main>
  )
}
