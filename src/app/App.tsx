import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HealthPage } from '../features/health/HealthPage'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { StudentLayout } from '../layouts/StudentLayout'
import { AuthGuard } from '../features/auth/AuthGuard'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResendVerificationPage, ResetPasswordPage, VerifyEmailPage } from '../features/auth/AuthPages'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HealthPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="resend-verification" element={<ResendVerificationPage />} />
        </Route>
        <Route element={<AuthGuard />}>
          <Route path="portal" element={<StudentLayout />}><Route index element={<Placeholder title="Öğrenci portalı" />} /></Route>
        </Route>
        <Route element={<AuthGuard role="ADMIN" />}>
          <Route path="admin" element={<AdminLayout />}><Route index element={<Placeholder title="Admin portalı" />} /></Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <section className="card">
      <p className="eyebrow">Turing Scholarship</p>
      <h1>{title}</h1>
      <p>Bu alan ilgili geliştirme aşamasında hazırlanacak.</p>
    </section>
  )
}
