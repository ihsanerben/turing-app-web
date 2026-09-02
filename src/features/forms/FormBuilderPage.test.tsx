import {render,screen} from '@testing-library/react'
import {MemoryRouter,Route,Routes} from 'react-router-dom'
import {describe,expect,it,vi} from 'vitest'
import {FormBuilderPage} from './FormBuilderPage'
import {formApi,type FormDefinition} from './formApi'

vi.mock('./formApi',()=>({formApi:{list:vi.fn(),get:vi.fn(),create:vi.fn(),save:vi.fn(),publish:vi.fn(),newVersion:vi.fn()}}))
const published:FormDefinition={id:'form-1',periodId:'period-1',name:'Başvuru Formu',versionNumber:1,status:'PUBLISHED',publishedAt:'2026-09-02T00:00:00Z',version:2,sections:[{id:'section-1',title:'Ekonomik Bilgiler',description:null,order:0,fields:[{id:'field-1',key:'family_income',label:'Aile geliri',type:'DECIMAL',required:true,order:0,placeholder:null,validationRules:{min:0},options:[]}]}]}
function renderPage(){return render(<MemoryRouter initialEntries={['/admin/forms/period-1']}><Routes><Route path="/admin/forms/:periodId" element={<FormBuilderPage/>}/></Routes></MemoryRouter>)}
describe('FormBuilderPage',()=>{it('shows immutable published schema and version action',async()=>{vi.mocked(formApi.list).mockResolvedValue([published]);vi.mocked(formApi.get).mockResolvedValue(published);renderPage();expect(await screen.findByRole('heading',{name:'Başvuru formu builder'})).toBeInTheDocument();expect(await screen.findByText('Aile geliri *')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Yeni versiyon oluştur'})).toBeEnabled()})})
