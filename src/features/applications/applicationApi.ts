import { apiClient } from '../../api/apiClient'
import type { FormDefinition } from '../forms/formApi'

export type ApplicationStatus='DRAFT'|'SUBMITTED'|'UNDER_REVIEW'|'MISSING_DOCUMENT'|'SHORTLISTED'|'INTERVIEW'|'APPROVED'|'REJECTED'|'WAITLISTED'|'WITHDRAWN'
export type Application={id:string;periodId:string;periodName:string;programName:string;formId:string;formVersion:number;status:ApplicationStatus;completion:number;submittedAt:string|null;createdAt:string;version:number}
export type ApplicationAnswer={fieldId:string;value:unknown}
export type ApplicationForm={application:Application;form:FormDefinition;answers:ApplicationAnswer[]}
export type PublicPeriod={id:string;name:string;academicYear:string;startsAt:string;endsAt:string;status:string}
export type PublicScholarship={program:{id:string;name:string;slug:string;description:string};periods:PublicPeriod[]}

export const applicationApi={
 list:()=>apiClient.get<Application[]>('/api/me/applications').then(r=>r.data),
 scholarships:()=>apiClient.get<PublicScholarship[]>('/api/public/scholarships').then(r=>r.data),
 create:(periodId:string)=>apiClient.post<Application>('/api/me/applications',{periodId}).then(r=>r.data),
 form:(id:string)=>apiClient.get<ApplicationForm>(`/api/me/applications/${id}/form`).then(r=>r.data),
 save:(id:string,version:number,answers:ApplicationAnswer[])=>apiClient.put<ApplicationForm>(`/api/me/applications/${id}/answers`,{version,answers}).then(r=>r.data),
 submit:(application:Application)=>apiClient.post<Application>(`/api/me/applications/${application.id}/submit`,{version:application.version}).then(r=>r.data),
 withdraw:(application:Application)=>apiClient.post<Application>(`/api/me/applications/${application.id}/withdraw`,{version:application.version}).then(r=>r.data),
}
