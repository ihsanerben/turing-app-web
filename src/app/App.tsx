import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MealsPage } from '../features/participation/MealsPage';
import { EventsPage } from '../features/participation/EventsPage';
import { NotFoundPage } from './NotFoundPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { AuthGuard } from '../features/auth/AuthGuard';
import { ProfilePage } from '../features/profile/ProfilePage';
import { ScholarshipAdminPage } from '../features/scholarship/ScholarshipAdminPage';
import { ApplicationListPage } from '../features/applications/ApplicationListPage';
import { ProgramsPage } from '../features/applications/ProgramsPage';
import { ApplicationFormPage } from '../features/applications/ApplicationFormPage';
import { AdminApplicationsPage } from '../features/adminApplications/AdminApplicationsPage';
import { AdminInterviewsPage } from '../features/interviews/AdminInterviewsPage';
import { StudentInterviewsPage } from '../features/interviews/StudentInterviewsPage';
import { AdminEmailCampaignsPage } from '../features/notifications/AdminEmailCampaignsPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { AdminContentPage } from '../features/publicContent/AdminContentPage';
import { StudentDashboardPage } from '../features/portal/StudentDashboardPage';
import {
  AdminDashboardPage,
  AdminStatisticsPage,
} from '../features/adminPortal/AdminDashboardPage';
import { AdminAuditPage } from '../features/audit/AdminAuditPage';
import { AdminUsersPage } from '../features/users/AdminUsersPage';
import { AdminAudienceListsPage } from '../features/audience/AdminAudienceListsPage';
import {
  AboutPage,
  AnnouncementDetailPage,
  AnnouncementsPage,
  ContactPage,
  HomePage,
  ScholarshipDetailPage,
  ScholarshipsPage,
} from '../features/publicContent/PublicPages';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResendVerificationPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from '../features/auth/AuthPages';

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
          <Route path="portal" element={<StudentLayout />}>
            <Route index element={<StudentDashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="meals" element={<MealsPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="applications" element={<ApplicationListPage />} />
            <Route path="applications/:id/form" element={<ApplicationFormPage />} />
            <Route path="interviews" element={<StudentInterviewsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
        <Route element={<AuthGuard role="ADMIN" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="applications" element={<AdminApplicationsPage />} />
            <Route path="students" element={<AdminUsersPage role="students" />} />
            <Route path="admins" element={<AdminUsersPage role="admins" />} />
            <Route path="lists" element={<AdminAudienceListsPage />} />
            <Route path="programs" element={<ScholarshipAdminPage />} />
            <Route path="interviews" element={<AdminInterviewsPage />} />
            <Route path="email" element={<AdminEmailCampaignsPage />} />
            <Route path="meals" element={<MealsPage admin />} />
            <Route path="events" element={<EventsPage admin />} />
            <Route path="content" element={<AdminContentPage />} />
            <Route path="statistics" element={<AdminStatisticsPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
