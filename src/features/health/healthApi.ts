import { apiClient } from '../../api/apiClient'

export interface HealthResponse {
  status: string
  database: string
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/api/health')
  return response.data
}
