import {fireEvent,render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe,expect,it,vi} from 'vitest'
import {AdminApplicationsPage} from './AdminApplicationsPage'
import {adminApplicationApi,type AdminApplication} from './adminApplicationApi'

vi.mock('./adminApplicationApi',()=>({adminApplicationApi:{list:vi.fn(),detail:vi.fn(),addNote:vi.fn(),changeStatus:vi.fn()}}))
const application:AdminApplication={id:'app-1',studentName:'Ada Lovelace',studentEmail:'ada@example.com',periodId:'period-1',periodName:'2026 Başvuruları',programName:'Başarı Bursu',status:'SUBMITTED',completion:100,submittedAt:'2026-09-02T09:00:00Z',createdAt:'2026-09-01T09:00:00Z',version:2}

describe('AdminApplicationsPage',()=>{it('renders paged applications and opens internal detail',async()=>{vi.mocked(adminApplicationApi.list).mockResolvedValue({content:[application],page:0,size:20,totalElements:1,totalPages:1});vi.mocked(adminApplicationApi.detail).mockResolvedValue({application,answers:[{fieldId:'field-1',label:'Motivasyon',value:'Topluma katkı'}],documents:[],notes:[{id:'note-1',adminName:'Admin User',content:'Kontrol edildi.',createdAt:'',version:0}],history:[]});render(<MemoryRouter><AdminApplicationsPage/></MemoryRouter>);expect(await screen.findByRole('heading',{name:'Başvuru yönetimi'})).toBeInTheDocument();fireEvent.click(await screen.findByRole('button',{name:/Ada Lovelace/}));expect(await screen.findByText((_,element)=>element?.tagName==='LI'&&element.textContent?.includes('Kontrol edildi.')===true)).toBeInTheDocument();expect(screen.getByText('Topluma katkı')).toBeInTheDocument()})})
