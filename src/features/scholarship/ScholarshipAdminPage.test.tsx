import {render,screen} from '@testing-library/react'
import {describe,expect,it,vi} from 'vitest'
import {ScholarshipAdminPage} from './ScholarshipAdminPage'
import {scholarshipApi} from './scholarshipApi'
vi.mock('./scholarshipApi',()=>({scholarshipApi:{programs:vi.fn(),periods:vi.fn(),createProgram:vi.fn(),createPeriod:vi.fn(),transition:vi.fn(),archiveProgram:vi.fn()}}))
describe('ScholarshipAdminPage',()=>{it('loads programs and exposes lifecycle management forms',async()=>{vi.mocked(scholarshipApi.programs).mockResolvedValue([]);render(<ScholarshipAdminPage/>);expect(await screen.findByRole('heading',{name:'Burs yönetimi'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'Program oluştur'})).toBeEnabled();expect(screen.getByLabelText('Program seç')).toBeInTheDocument()})})
