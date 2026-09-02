import axios from 'axios'
import { useEffect,useState } from 'react'
import { Link,useNavigate } from 'react-router-dom'
import { applicationApi,type Application,type PublicScholarship } from './applicationApi'

export function ApplicationListPage(){
 const [applications,setApplications]=useState<Application[]>([]);const [scholarships,setScholarships]=useState<PublicScholarship[]>([]);const [loading,setLoading]=useState(true);const [starting,setStarting]=useState('');const [error,setError]=useState('');const navigate=useNavigate()
 useEffect(()=>{let active=true;Promise.all([applicationApi.list(),applicationApi.scholarships()]).then(([apps,publicValues])=>{if(active){setApplications(apps);setScholarships(publicValues);setLoading(false)}}).catch(value=>{if(active){setError(message(value));setLoading(false)}});return()=>{active=false}},[])
 async function start(periodId:string){setStarting(periodId);setError('');try{const created=await applicationApi.create(periodId);navigate(`/portal/applications/${created.id}/form`)}catch(value){setError(message(value))}finally{setStarting('')}}
 const used=new Set(applications.map(value=>value.periodId));const open=scholarships.flatMap(value=>value.periods.filter(period=>period.status==='OPEN').map(period=>({program:value.program,period})))
 if(loading)return <p role="status">Başvurular yükleniyor…</p>
 return <section className="portal-workspace"><header><p className="eyebrow">Öğrenci portalı</p><h1>Başvurularım</h1><p>Taslaklarınızı tamamlayın ve açık burs dönemlerine başvurun.</p></header>{error&&<p role="alert" className="status status--error">{error}</p>}
  <section className="management-card"><h2>Mevcut başvurular</h2>{applications.length===0?<p>Henüz başvurunuz yok.</p>:<div className="application-list">{applications.map(value=><article key={value.id}><div><strong>{value.programName}</strong><span>{value.periodName} · {value.status}</span><progress aria-label={`${value.programName} tamamlanma oranı`} max="100" value={value.completion}/></div><Link className="button-link" to={`/portal/applications/${value.id}/form`}>{value.status==='DRAFT'?'Devam et':'Görüntüle'}</Link></article>)}</div>}</section>
  <section className="management-card"><h2>Açık başvurular</h2>{open.length===0?<p>Şu anda açık burs dönemi yok.</p>:<div className="application-list">{open.map(({program,period})=><article key={period.id}><div><strong>{program.name}</strong><span>{period.name} · {period.academicYear}</span></div><button disabled={used.has(period.id)||starting===period.id} onClick={()=>void start(period.id)}>{used.has(period.id)?'Başvuru mevcut':'Başvuru oluştur'}</button></article>)}</div>}</section>
 </section>
}
function message(error:unknown){return axios.isAxiosError(error)?error.response?.data?.message??'İşlem tamamlanamadı.':'İşlem tamamlanamadı.'}
