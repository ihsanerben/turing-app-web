import axios from 'axios'
import { useEffect,useState,type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { scholarshipApi,type Period,type PeriodStatus,type Program } from './scholarshipApi'

const nextStatus:Partial<Record<PeriodStatus,PeriodStatus>>={DRAFT:'SCHEDULED',SCHEDULED:'OPEN',OPEN:'CLOSED',CLOSED:'EVALUATION',EVALUATION:'COMPLETED',COMPLETED:'ARCHIVED'}
export function ScholarshipAdminPage(){
 const [programs,setPrograms]=useState<Program[]>([]);const [selected,setSelected]=useState('');const [periods,setPeriods]=useState<Period[]>([]);const [error,setError]=useState('')
 const loadPrograms=()=>scholarshipApi.programs().then(values=>{setPrograms(values);setSelected(current=>current||values[0]?.id||'')})
 useEffect(()=>{loadPrograms().catch(()=>setError('Programlar yüklenemedi.'))},[])
 useEffect(()=>{if(selected)scholarshipApi.periods(selected).then(setPeriods)},[selected])
 async function createProgram(event:FormEvent<HTMLFormElement>){event.preventDefault();setError('');const data=new FormData(event.currentTarget);try{await scholarshipApi.createProgram({name:String(data.get('name')),slug:String(data.get('slug')),description:String(data.get('description'))});event.currentTarget.reset();await loadPrograms()}catch(e){setError(message(e))}}
 async function createPeriod(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);try{await scholarshipApi.createPeriod({programId:selected,name:data.get('name'),academicYear:data.get('academicYear'),startsAt:new Date(String(data.get('startsAt'))).toISOString(),endsAt:new Date(String(data.get('endsAt'))).toISOString(),maxRecipients:Number(data.get('maxRecipients'))||null,allowWithdrawal:true});event.currentTarget.reset();setPeriods(await scholarshipApi.periods(selected))}catch(e){setError(message(e))}}
 async function transition(period:Period){const next=nextStatus[period.status];if(!next)return;try{const updated=await scholarshipApi.transition(period,next);setPeriods(values=>values.map(v=>v.id===updated.id?updated:v))}catch(e){setError(message(e))}}
 async function archive(program:Program){try{const updated=await scholarshipApi.archiveProgram(program.id,program.version);setPrograms(values=>values.map(v=>v.id===updated.id?updated:v))}catch(e){setError(message(e))}}
 return <section className="admin-workspace"><header><p className="eyebrow">Admin portalı</p><h1>Burs yönetimi</h1><p>Programları ve başvuru dönemlerinin yaşam döngüsünü yönetin.</p></header>{error&&<p role="alert" className="status status--error">{error}</p>}
  <div className="admin-grid"><form className="management-card" onSubmit={createProgram}><h2>Yeni program</h2><label>Ad<input name="name" required maxLength={200}/></label><label>URL adı<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*"/></label><label>Açıklama<textarea name="description" required rows={4}/></label><button>Program oluştur</button></form>
  <section className="management-card"><h2>Programlar</h2><select aria-label="Program seç" value={selected} onChange={e=>setSelected(e.target.value)}>{programs.map(p=><option key={p.id} value={p.id}>{p.name}{p.active?'':' (Arşiv)'}</option>)}</select>{programs.filter(p=>p.id===selected&&p.active).map(p=><button className="secondary" key={p.id} onClick={()=>archive(p)}>Programı arşivle</button>)}</section></div>
  {selected&&<><form className="management-card period-form" onSubmit={createPeriod}><h2>Yeni başvuru dönemi</h2><label>Ad<input name="name" required/></label><label>Akademik yıl<input name="academicYear" required pattern="[0-9]{4}-[0-9]{4}" placeholder="2026-2027"/></label><label>Başlangıç<input name="startsAt" type="datetime-local" required/></label><label>Bitiş<input name="endsAt" type="datetime-local" required/></label><label>Kontenjan<input name="maxRecipients" type="number" min={1}/></label><button>Dönem oluştur</button></form>
  <section className="management-card"><h2>Başvuru dönemleri</h2>{periods.length===0?<p>Henüz dönem yok.</p>:<div className="period-list">{periods.map(p=><article key={p.id}><div><strong>{p.name}</strong><span>{p.academicYear} · {p.status}</span></div><div className="period-actions"><Link className="button-link secondary" to={`/admin/forms/${p.id}`}>Formu yönet</Link>{nextStatus[p.status]&&<button onClick={()=>transition(p)}>Sonraki durum: {nextStatus[p.status]}</button>}</div></article>)}</div>}</section></>}
 </section>
}
function message(error:unknown){return axios.isAxiosError(error)?error.response?.data?.message??'İşlem tamamlanamadı.':'İşlem tamamlanamadı.'}
