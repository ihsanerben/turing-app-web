import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HealthPage } from '../features/health/HealthPage'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { StudentLayout } from '../layouts/StudentLayout'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HealthPage />} />
        </Route>
        <Route path="portal" element={<StudentLayout />}>
          <Route index element={<Placeholder title="Öğrenci portalı" />} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Placeholder title="Admin portalı" />} />
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
