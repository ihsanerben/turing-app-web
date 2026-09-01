import axios from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import { profileApi, type Department, type Profile, type University } from './profileApi'

const educationLevels = [
  ['HIGH_SCHOOL', 'Lise'], ['ASSOCIATE', 'Ön lisans'], ['BACHELOR', 'Lisans'],
  ['MASTER', 'Yüksek lisans'], ['DOCTORATE', 'Doktora'],
] as const

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)

  useEffect(() => { Promise.all([profileApi.get(), profileApi.universities()]).then(([value, refs]) => { setProfile(value); setUniversities(refs) }).catch(() => setError('Profil yüklenemedi.')) }, [])
  useEffect(() => { if (profile?.universityId) profileApi.departments(profile.universityId).then(setDepartments) }, [profile?.universityId])

  function change<K extends keyof Profile>(key: K, value: Profile[K]) { setProfile((current) => current ? { ...current, [key]: value } : current) }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!profile) return; setSaving(true); setMessage(''); setError('')
    try { const saved = await profileApi.update(profile); setProfile(saved); setMessage('Profilin kaydedildi.') }
    catch (reason) { setError(axios.isAxiosError(reason) ? reason.response?.data?.message ?? 'Profil kaydedilemedi.' : 'Profil kaydedilemedi.') }
    finally { setSaving(false) }
  }
  if (!profile && !error) return <p role="status">Profil yükleniyor…</p>
  if (!profile) return <p className="status status--error">{error}</p>

  return <section className="card profile-card"><p className="eyebrow">Öğrenci portalı</p><h1>Profilim</h1><p>Buradaki bilgiler sonraki başvurularında tekrar kullanılacak.</p>
    <form className="profile-form" onSubmit={submit}>
      <fieldset><legend>Kimlik ve iletişim</legend>
        <Field label="Ulusal kimlik numarası" value={profile.nationalId} onChange={(v) => change('nationalId', v)} />
        <Field label="Doğum tarihi" type="date" value={profile.birthDate} onChange={(v) => change('birthDate', v)} />
        <Field label="Telefon" type="tel" value={profile.phone} onChange={(v) => change('phone', v)} />
        <Field label="Adres" value={profile.addressLine} onChange={(v) => change('addressLine', v)} />
        <Field label="Şehir" value={profile.city} onChange={(v) => change('city', v)} />
        <Field label="Posta kodu" value={profile.postalCode} onChange={(v) => change('postalCode', v)} />
        <Field label="Ülke kodu" value={profile.countryCode} maxLength={2} onChange={(v) => change('countryCode', v?.toUpperCase() ?? null)} />
      </fieldset>
      <fieldset><legend>Eğitim</legend>
        <label>Üniversite<select value={profile.universityId ?? ''} onChange={(e) => { change('universityId', e.target.value || null); change('departmentId', null); setDepartments([]); if (e.target.value) change('otherUniversity', null) }}><option value="">Listede yok / seçilmedi</option>{universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
        {!profile.universityId && <Field label="Diğer üniversite" value={profile.otherUniversity} onChange={(v) => change('otherUniversity', v)} />}
        {profile.universityId && <label>Bölüm<select value={profile.departmentId ?? ''} onChange={(e) => { change('departmentId', e.target.value || null); if (e.target.value) change('otherDepartment', null) }}><option value="">Listede yok / seçilmedi</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}
        {!profile.departmentId && <Field label="Diğer bölüm" value={profile.otherDepartment} onChange={(v) => change('otherDepartment', v)} />}
        <label>Eğitim seviyesi<select value={profile.educationLevel ?? ''} onChange={(e) => change('educationLevel', (e.target.value || null) as Profile['educationLevel'])}><option value="">Seçiniz</option>{educationLevels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <Field label="Sınıf" type="number" min={1} max={8} value={profile.studyYear?.toString() ?? null} onChange={(v) => change('studyYear', v ? Number(v) : null)} />
        <Field label="Not ortalaması (4 üzerinden)" type="number" min={0} max={4} step="0.01" value={profile.gpa?.toString() ?? null} onChange={(v) => change('gpa', v ? Number(v) : null)} />
      </fieldset>
      {message && <p className="status status--success">{message}</p>}{error && <p className="status status--error">{error}</p>}
      <button disabled={saving}>{saving ? 'Kaydediliyor…' : 'Profili kaydet'}</button>
    </form>
  </section>
}

function Field({ label, value, onChange, ...props }: { label: string; value: string | null; onChange: (value: string | null) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return <label>{label}<input {...props} value={value ?? ''} onChange={(event) => onChange(event.target.value || null)} /></label>
}
