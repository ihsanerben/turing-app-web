import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
  },
  timeout: 10_000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  withXSRFToken: true,
})

let refreshRequest: Promise<void> | null = null

apiClient.interceptors.response.use(undefined, async (error) => {
  const request = error.config
  const isAuthRequest = request?.url?.startsWith('/api/auth/')
  if (error.response?.status !== 401 || isAuthRequest || request?._retried) {
    return Promise.reject(error)
  }
  request._retried = true
  refreshRequest ??= apiClient.post('/api/auth/refresh').then(() => undefined).finally(() => {
    refreshRequest = null
  })
  await refreshRequest
  return apiClient(request)
})
