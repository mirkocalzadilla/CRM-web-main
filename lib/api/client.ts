import axios, { AxiosError, AxiosHeaders } from 'axios'

import { useAuthStore } from '@/store/auth-store'

const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    // AxiosHeaders se usa para preservar la API tipada en Axios v1.
    const headers = AxiosHeaders.from(config.headers)
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // En 401, limpiar sesión y redirigir a /login.
    // No se loggea el token; sólo el código de status.
    if (error.response?.status === 401) {
      useAuthStore.getState().clear()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)
