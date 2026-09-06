import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import zxcvbn from 'zxcvbn'
import api from '@/api/client'
import type { RegistrationKeys } from '@/crypto'
import { generateRegistrationInWorker } from '@/crypto/accountProtectionWorker'
import { AuthLayout } from '@/components/auth/AuthLayout'
import MnemonicDisplay from '@/components/MnemonicDisplay'
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
  FormDescription,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const STRENGTH_COLORS = ['bg-destructive', 'bg-warning', 'bg-warning', 'bg-primary', 'bg-primary']

const formSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    username: z
      .string()
      .min(3, 'At least 3 characters')
      .max(32, 'At most 32 characters')
      .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, _ and - only'),
    password: z.string().min(1, 'Password is required'),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Passwords do not match',
  })

type FormData = z.infer<typeof formSchema>
type Step = 'form' | 'generating' | 'mnemonic' | 'confirm' | 'submitting' | 'done'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null)
  const [keys, setKeys] = useState<RegistrationKeys | null>(null)
  const [mnemonicConfirm, setMnemonicConfirm] = useState('')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', username: '', password: '', passwordConfirm: '' },
  })

  const password = form.watch('password')
  const strength = zxcvbn(password ?? '')

  useEffect(() => {
    api.get('/auth/settings')
      .then((res) => setRegistrationEnabled(res.data.registrationEnabled))
      .catch(() => setRegistrationEnabled(true))
  }, [])

  const strengthLabels = [
    t('auth.strength.veryWeak'),
    t('auth.strength.weak'),
    t('auth.strength.fair'),
    t('auth.strength.strong'),
    t('auth.strength.veryStrong'),
  ]

  async function onSubmit(data: FormData) {
    if (strength.score < 2) {
      form.setError('password', { message: t('register.passwordTooWeak') })
      return
    }
    setEmail(data.email)
    setUsername(data.username)
    setStep('generating')

    await generateRegistrationInWorker(data.password, data.email).then((generated) => {
      setKeys(generated)
      setStep('mnemonic')
    }).catch((err) => {
      setError(err.message ?? 'Key generation failed')
      setStep('form')
    })
  }

  async function handleConfirmMnemonic(e: React.FormEvent) {
    e.preventDefault()
    if (!keys) return
    const normalized = mnemonicConfirm
      .trim().toLowerCase().replace(/\b\d+\.\s*/g, '').replace(/\s+/g, ' ').trim()
    if (normalized !== keys.mnemonic.trim().toLowerCase()) {
      setError('Recovery phrase does not match. Check each word carefully.')
      return
    }
    setStep('submitting')
    setError('')
    try {
      await api.post('/auth/register', {
        email,
        username,
        loginKey: keys.loginKey,
        masterKeyEnvelope: keys.masterKeyEnvelope,
        recoveryKeyEnvelope: keys.recoveryKeyEnvelope,
        drivePrivateKeyEnvelope: keys.drivePrivateKeyEnvelope,
        publicKey: keys.publicKey,
        accountAuthorityPublicKey: keys.accountAuthorityPublicKey,
        accountAuthorityKeyId: keys.accountAuthorityKeyId,
        accountIncarnationId: keys.accountIncarnationId,
        driveSigningPublicKey: keys.driveSigningPublicKey,
        accountProtectionSuite: keys.accountProtectionSuite,
        accountProtectionSalt: keys.accountProtectionSalt,
        argonMemoryKib: keys.argonMemoryKib,
        argonIterations: keys.argonIterations,
        argonParallelism: keys.argonParallelism,
        recoveryProof: keys.recoveryProof,
      })
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed')
      setStep('mnemonic')
    }
  }

  // Loading registration status
  if (registrationEnabled === null) {
    return (
      <AuthLayout contentWidth="compact">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </AuthLayout>
    )
  }

  if (registrationEnabled === false) {
    return (
      <AuthLayout contentWidth="compact">
        <Card className="border-0 bg-transparent text-center shadow-none">
          <CardHeader className="px-0 pt-0">
            <h1 className="font-display text-2xl font-semibold tracking-[-0.025em]">
              {t('register.disabled.title')}
            </h1>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0">
            <p className="text-sm text-muted-foreground">
              {t('register.disabled.desc')}
            </p>
            <Link to="/login" className="text-sm text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary">{t('register.disabled.backToSignIn')}</Link>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  if (step === 'generating' || step === 'submitting') {
    return (
      <AuthLayout contentWidth="compact">
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-0 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">
              {step === 'generating' ? t('register.generatingKeys') : t('register.creatingAccount')}
            </p>
            {step === 'generating' && (
              <p className="text-xs text-muted-foreground">{t('auth.argon2idNote')}</p>
            )}
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  if (step === 'mnemonic' && keys) {
    return (
      <AuthLayout contentWidth="wide">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0">
            <h1 className="font-display text-2xl font-semibold tracking-[-0.025em]">
              {t('register.mnemonic.title')}
            </h1>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Alert className="border-warning/40 bg-warning-faint text-warning">
              <AlertDescription>
                This 24-word phrase is shown <strong>once</strong>. Write it down and store it safely.
                It is the only way to recover your account if you forget your password.
              </AlertDescription>
            </Alert>
            <MnemonicDisplay mnemonic={keys.mnemonic} />
            <Button className="w-full" onClick={() => setStep('confirm')}>
              {t('register.mnemonic.saved')}
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  if (step === 'confirm') {
    return (
      <AuthLayout contentWidth="wide">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0">
            <h1 className="font-display text-2xl font-semibold tracking-[-0.025em]">
              {t('register.confirm.title')}
            </h1>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form onSubmit={handleConfirmMnemonic} className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('register.confirm.instruction')}</p>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                value={mnemonicConfirm}
                onChange={(e) => setMnemonicConfirm(e.target.value)}
                placeholder={t('register.confirm.placeholder')}
                autoComplete="off"
                required
              />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full">{t('register.confirm.submit')}</Button>
            </form>
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
              {t('register.success.title')}
            </h1>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0">
            <p className="text-sm text-muted-foreground">{t('register.success.desc')}</p>
            <Button className="w-full" onClick={() => navigate('/login')}>{t('register.success.signIn')}</Button>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout contentWidth="compact">
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="px-0 pt-0">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.035em]">
            {t('register.title')}
          </h1>
        </CardHeader>
        <CardContent className="px-0 pb-0">
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
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.username')}</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="username"
                        placeholder={t('register.usernamePlaceholder')}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                      />
                    </FormControl>
                    <FormDescription>{t('register.usernameDesc')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    {password && (
                      <div className="space-y-1">
                        <Progress
                          value={(strength.score + 1) * 20}
                          className={`h-1 [&>div]:${STRENGTH_COLORS[strength.score]}`}
                        />
                        <p className="text-xs text-muted-foreground">
                          {strengthLabels[strength.score]}
                        </p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.confirmPassword')}</FormLabel>
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
                {t('register.title')}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary">{t('auth.signIn')}</Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
