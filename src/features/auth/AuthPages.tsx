import axios from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from './authApi'
import { useAuth } from './authContextValue'

function messageOf(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? 'İşlem tamamlanamadı.'
  return 'İşlem tamamlanamadı.'
}

export function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate()
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const data = new FormData(event.currentTarget)
    try { const user = await login(String(data.get('email')), String(data.get('password'))); navigate(user.role === 'ADMIN' ? '/admin' : '/portal') }
    catch (reason) { setError(messageOf(reason)) } finally { setBusy(false) }
  }
  return <AuthCard title="Oturum aç"><form onSubmit={submit}><Field name="email" label="E-posta" type="email" /><Field name="password" label="Şifre" type="password" minLength={10} />{error && <p className="status status--error">{error}</p>}<button disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</button></form><p><Link to="/forgot-password">Şifremi unuttum</Link> · <Link to="/register">Kayıt ol</Link></p></AuthCard>
}

export function RegisterPage() {
  const [message, setMessage] = useState(''); const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); const data = Object.fromEntries(new FormData(event.currentTarget)); try { await authApi.register(data as {email:string;password:string;firstName:string;lastName:string}); setMessage('Kayıt tamamlandı. Mailpit üzerinden doğrulama bağlantısını açabilirsin.') } catch (reason) { setError(messageOf(reason)) } }
  return <AuthCard title="Hesap oluştur"><form onSubmit={submit}><Field name="firstName" label="Ad" /><Field name="lastName" label="Soyad" /><Field name="email" label="E-posta" type="email" /><Field name="password" label="Şifre" type="password" minLength={10} />{message && <p className="status status--success">{message}</p>}{error && <p className="status status--error">{error}</p>}<button>Kayıt ol</button></form><Link to="/login">Girişe dön</Link></AuthCard>
}

export function ForgotPasswordPage() { return <EmailAction title="Şifremi unuttum" action={authApi.forgotPassword} /> }
export function ResendVerificationPage() { return <EmailAction title="Doğrulama e-postasını yeniden gönder" action={authApi.resendVerification} /> }

function EmailAction({ title, action }: { title: string; action: (email: string) => Promise<unknown> }) {
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await authApi.csrf(); await action(String(new FormData(event.currentTarget).get('email'))); setMessage('E-posta adresi uygunsa bağlantı gönderildi.') }
  return <AuthCard title={title}><form onSubmit={submit}><Field name="email" label="E-posta" type="email" />{message && <p className="status status--success">{message}</p>}<button>Gönder</button></form><Link to="/login">Girişe dön</Link></AuthCard>
}

export function VerifyEmailPage() {
  const [params] = useSearchParams(); const token = params.get('token')
  const [message, setMessage] = useState(token ? 'Doğrulanıyor…' : 'Doğrulama anahtarı eksik.')
  useEffect(() => { if (!token) return; authApi.csrf().then(() => authApi.verifyEmail(token)).then(() => setMessage('E-posta doğrulandı. Artık giriş yapabilirsin.')).catch((error) => setMessage(messageOf(error))) }, [token])
  return <AuthCard title="E-posta doğrulama"><p className="status">{message}</p><Link to="/login">Girişe git</Link></AuthCard>
}

export function ResetPasswordPage() {
  const [params] = useSearchParams(); const [message, setMessage] = useState(''); const token = params.get('token') ?? ''
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await authApi.csrf(); await authApi.resetPassword(token, String(new FormData(event.currentTarget).get('password'))); setMessage('Şifren yenilendi.') }
  return <AuthCard title="Yeni şifre"><form onSubmit={submit}><Field name="password" label="Yeni şifre" type="password" minLength={10} />{message && <p className="status status--success">{message}</p>}<button disabled={!token}>Şifreyi yenile</button></form></AuthCard>
}

function AuthCard({ title, children }: React.PropsWithChildren<{title:string}>) { return <section className="card auth-card"><p className="eyebrow">Turing Scholarship</p><h1>{title}</h1>{children}</section> }
function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & {label:string}) { return <label>{label}<input required {...props} /></label> }
