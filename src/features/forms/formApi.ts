import { apiClient } from '../../api/apiClient'

export type FormStatus='DRAFT'|'PUBLISHED'|'RETIRED'
export type FieldType='TEXT'|'TEXTAREA'|'INTEGER'|'DECIMAL'|'DATE'|'BOOLEAN'|'SELECT'|'MULTI_SELECT'|'RADIO'|'CHECKBOX'|'EMAIL'|'PHONE'|'FILE'
export type FormOption={id?:string;label:string;value:string;order?:number}
export type FormField={id?:string;key:string;label:string;type:FieldType;required:boolean;order?:number;placeholder:string|null;validationRules:Record<string,number|string>;options:FormOption[]}
export type FormSection={id?:string;title:string;description:string|null;order?:number;fields:FormField[]}
export type FormSummary={id:string;periodId:string;name:string;versionNumber:number;status:FormStatus;publishedAt:string|null;version:number}
export type FormDefinition=FormSummary&{sections:FormSection[]}

export const formApi={
 list:(periodId:string)=>apiClient.get<FormSummary[]>(`/api/admin/application-periods/${periodId}/forms`).then(r=>r.data),
 get:(id:string)=>apiClient.get<FormDefinition>(`/api/admin/forms/${id}`).then(r=>r.data),
 create:(periodId:string,name:string)=>apiClient.post<FormDefinition>(`/api/admin/application-periods/${periodId}/forms`,{name}).then(r=>r.data),
 save:(form:FormDefinition)=>apiClient.put<FormDefinition>(`/api/admin/forms/${form.id}/schema`,{version:form.version,name:form.name,sections:form.sections.map(section=>({title:section.title,description:section.description,fields:section.fields.map(field=>({key:field.key,label:field.label,type:field.type,required:field.required,placeholder:field.placeholder,validationRules:field.validationRules,options:field.options.map(option=>({label:option.label,value:option.value}))}))}))}).then(r=>r.data),
 publish:(form:FormDefinition)=>apiClient.post<FormDefinition>(`/api/admin/forms/${form.id}/publish`,{version:form.version}).then(r=>r.data),
 newVersion:(form:FormDefinition)=>apiClient.post<FormDefinition>(`/api/admin/forms/${form.id}/new-version`,{version:form.version}).then(r=>r.data),
}
