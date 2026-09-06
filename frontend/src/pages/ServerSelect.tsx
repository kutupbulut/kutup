// Nextcloud-style "which server do I sign into?" prompt.
//
// Only used by the Tauri desktop / mobile shells. On the web the backend is
// same-origin and there's no server-pick step.
//
// Flow: input → normalize (https prepend, http-on-localhost-only, trailing
// slash strip) → probe `${url}/api/health` with a 5 s timeout → on a valid
// kutup response, persist via the Tauri Store plugin and navigate to /login.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { normalizeServerUrl, setServerUrl } from '@/lib/serverConfig'
import { invalidateApiBase } from '@/lib/apiBase'
import { AuthLayout } from '@/components/auth/AuthLayout'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const schema = z.object({
  url: z.string().min(1),
})
type FormShape = z.infer<typeof schema>

async function probeHealth(
  origin: string,
  timeoutMs: number,
): Promise<{ ok: boolean; isKutup: boolean }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch(`${origin}/api/health`, {
      signal: controller.signal,
    })
    if (!r.ok) return { ok: false, isKutup: false }
    const body = (await r.json()) as { name?: string }
    return { ok: true, isKutup: body?.name === 'kutup' }
  } catch {
    return { ok: false, isKutup: false }
  } finally {
    clearTimeout(timeoutId)
  }
}

export default function ServerSelect() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')
  const [checking, setChecking] = useState(false)

  const form = useForm<FormShape>({
    resolver: zodResolver(schema),
    defaultValues: { url: '' },
  })

  async function onSubmit({ url }: FormShape) {
    setError('')
    const norm = normalizeServerUrl(url)
    if (!norm.ok) {
      const key =
        norm.error === 'empty'
          ? 'auth.serverSelect.errorEmpty'
          : norm.error === 'insecure-http'
            ? 'auth.serverSelect.errorInsecureHttp'
            : 'auth.serverSelect.errorInvalid'
      setError(t(key))
      return
    }

    setChecking(true)
    const probe = await probeHealth(norm.url, 5000)
    setChecking(false)

    if (!probe.ok) {
      setError(t('auth.serverSelect.errorUnreachable'))
      return
    }
    if (!probe.isKutup) {
      setError(t('auth.serverSelect.errorNotKutup'))
      return
    }

    await setServerUrl(norm.url)
    invalidateApiBase() // next API call re-resolves with the new origin
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout contentWidth="compact">
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="px-0 pt-0">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.035em]">
            {t('auth.serverSelect.title')}
          </h1>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {t('auth.serverSelect.subtitle')}
          </p>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.serverSelect.url')}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="url"
                        autoComplete="url"
                        autoFocus
                        spellCheck={false}
                        placeholder={t('auth.serverSelect.urlPlaceholder')}
                        disabled={checking}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={checking}
              >
                {checking && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {checking
                  ? t('auth.serverSelect.checking')
                  : t('auth.serverSelect.continue')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
