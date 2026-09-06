// Account recovery via BIP39 mnemonic.
// TOTP bypass is intentional: mnemonic IS the second factor.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import zxcvbn from 'zxcvbn'
import api from '@/api/client'
import { AuthLayout } from '@/components/auth/AuthLayout'
import {
  decodeMnemonic, validateMnemonic,
  ACCOUNT_ENVELOPE_PURPOSE, openAccountEnvelope, sealAccountEnvelope,
  ACCOUNT_PROTECTION_DEFAULTS, deriveRecoveryAuthProof, generateAccountProtectionSalt,
  toBase64,
} from '@/crypto'
import { deriveAccountProtectionInWorker } from '@/crypto/accountProtectionWorker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Progress } from '@/components/ui/progress'
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

const schema = z
  .object({
    email: z.string().email('Invalid email address'),
    mnemonic: z
      .string()
      .refine(
        (v) => validateMnemonic(v.trim().toLowerCase()),
        'Invalid recovery phrase — check for typos',
      ),
    newPassword: z.string().min(1, 'Password is required'),
    newPasswordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    path: ['newPasswordConfirm'],
    message: 'Passwords do not match',
  })

type FormData = z.infer<typeof schema>

export default function Recovery() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'deriving' | 'done'>('form')
  const [error, setError] = useState('')

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', mnemonic: '', newPassword: '', newPasswordConfirm: '' },
  })

  const newPassword = form.watch('newPassword')
  const strength = zxcvbn(newPassword ?? '')
  const strengthLabels = [
    t('auth.strength.veryWeak'),
    t('auth.strength.weak'),
    t('auth.strength.fair'),
    t('auth.strength.strong'),
    t('auth.strength.veryStrong'),
  ]

  async function onSubmit(data: FormData) {
    if (strength.score < 2) {
      form.setError('newPassword', { message: t('register.passwordTooWeak') })
      return
    }
    setError('')
    setStep('deriving')
    try {
      const recoveryDataRes = await api.get(`/auth/recover/preflight?email=${encodeURIComponent(data.email)}`)
      const { recoveryKeyEnvelope } = recoveryDataRes.data

      const recoveryKey = decodeMnemonic(data.mnemonic.trim().toLowerCase())
      const masterKey = await openAccountEnvelope(
        recoveryKeyEnvelope,
        recoveryKey,
        ACCOUNT_ENVELOPE_PURPOSE.recoveryMasterKey,
        data.email,
      )

      const accountProtectionSalt = generateAccountProtectionSalt()
      const accountProtection = {
        ...ACCOUNT_PROTECTION_DEFAULTS,
        salt: toBase64(accountProtectionSalt),
      }
      const { keyEncryptionKey, loginKey } = await deriveAccountProtectionInWorker(
        data.newPassword,
        accountProtection,
      )
      const newMasterKeyEnvelope = await sealAccountEnvelope(
        masterKey,
        keyEncryptionKey,
        ACCOUNT_ENVELOPE_PURPOSE.passwordMasterKey,
        data.email,
      )
      const recoveryProof = await deriveRecoveryAuthProof(toBase64(recoveryKey), data.email)

      await api.post('/auth/recover', {
        email: data.email,
        newLoginKey: toBase64(loginKey),
        newMasterKeyEnvelope,
        newAccountProtectionSuite: accountProtection.suite,
        newAccountProtectionSalt: accountProtection.salt,
        newArgonMemoryKib: accountProtection.memoryKib,
        newArgonIterations: accountProtection.iterations,
        newArgonParallelism: accountProtection.parallelism,
        recoveryProof,
      })
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message ?? 'Recovery failed')
      setStep('form')
    }
  }

  if (step === 'deriving') {
    return (
      <AuthLayout contentWidth="compact">
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-0 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">{t('recovery.recovering')}</p>
            <p className="text-xs text-muted-foreground">{t('recovery.derivingNote')}</p>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  if (step === 'done') {
    return (
      <AuthLayout contentWidth="compact">
        <Card className="border-0 bg-transparent text-center shadow-none">
          <CardHeader className="px-0 pt-0">
            <h1 className="font-display text-2xl font-semibold tracking-[-0.025em]">
              {t('recovery.success.title')}
            </h1>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0">
            <p className="text-sm text-muted-foreground">{t('recovery.success.desc')}</p>
            <Button className="w-full" onClick={() => navigate('/login')}>{t('recovery.success.signIn')}</Button>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="px-0 pt-0">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.035em]">
            {t('recovery.title')}
          </h1>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <p className="text-sm text-muted-foreground mb-4">
            {t('recovery.description')}
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mnemonic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('recovery.recoveryPhrase')}</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={t('recovery.phrasePlaceholder')}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('recovery.newPassword')}</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    {newPassword && (
                      <div className="space-y-1">
                        <Progress value={(strength.score + 1) * 20} className="h-1" />
                        <p className="text-xs text-muted-foreground">{strengthLabels[strength.score]}</p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPasswordConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('recovery.confirmNewPassword')}</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
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
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('recovery.submit')}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary">{t('recovery.backToSignIn')}</Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
