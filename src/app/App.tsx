import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { StudentLayout } from '../layouts/StudentLayout'
import { AuthGuard } from '../features/auth/AuthGuard'
import { ProfilePage } from '../features/profile/ProfilePage'
import { ScholarshipAdminPage } from '../features/scholarship/ScholarshipAdminPage'
import { FormBuilderPage } from '../features/forms/FormBuilderPage'
import { ApplicationListPage } from '../features/applications/ApplicationListPage'
import { ApplicationFormPage } from '../features/applications/ApplicationFormPage'
import { AdminApplicationsPage } from '../features/adminApplications/AdminApplicationsPage'
import { EvaluationPage } from '../features/evaluation/EvaluationPage'
import { AdminInterviewsPage } from '../features/interviews/AdminInterviewsPage'
import { StudentInterviewsPage } from '../features/interviews/StudentInterviewsPage'
import { AdminEmailCampaignsPage } from '../features/notifications/AdminEmailCampaignsPage'
import { NotificationsPage } from '../features/notifications/NotificationsPage'
import { AdminContentPage } from '../features/publicContent/AdminContentPage'
import { AboutPage, AnnouncementDetailPage, AnnouncementsPage, ContactPage, FaqPage, HomePage, ScholarshipDetailPage, ScholarshipsPage } from '../features/publicContent/PublicPages'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResendVerificationPage, ResetPasswordPage, VerifyEmailPage } from '../features/auth/AuthPages'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="scholarships" element={<ScholarshipsPage />} />
          <Route path="scholarships/:slug" element={<ScholarshipDetailPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="announcements/:slug" element={<AnnouncementDetailPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="resend-verification" element={<ResendVerificationPage />} />
        </Route>
        <Route element={<AuthGuard />}>
          <Route path="portal" element={<StudentLayout />}><Route index element={<Placeholder title="Öğrenci portalı" />} /><Route path="profile" element={<ProfilePage />} /><Route path="applications" element={<ApplicationListPage />} /><Route path="applications/:id/form" element={<ApplicationFormPage />} /><Route path="interviews" element={<StudentInterviewsPage />} /><Route path="notifications" element={<NotificationsPage />} /></Route>
        </Route>
        <Route element={<AuthGuard role="ADMIN" />}>
          <Route path="admin" element={<AdminLayout />}><Route index element={<Placeholder title="Admin portalı" />} /><Route path="applications" element={<AdminApplicationsPage />} /><Route path="programs" element={<ScholarshipAdminPage />} /><Route path="forms/:periodId" element={<FormBuilderPage />} /><Route path="evaluation" element={<EvaluationPage />} /><Route path="interviews" element={<AdminInterviewsPage />} /><Route path="email" element={<AdminEmailCampaignsPage />} /><Route path="content" element={<AdminContentPage />} /></Route>
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
