import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE = 'http://localhost:3001/api'

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('auth_token')
  const headers = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/login'
    throw new Error('Session expired')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `API error: ${res.status}`)
  }
  return res.json()
}

export function useAlertsQuery() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiFetch('/alerts'),
  })
}

export function useCreateAlertMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) =>
      apiFetch('/alerts', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useDeleteAlertMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) =>
      apiFetch(`/alerts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

// ─── Admin Users (super_admin only) ─────────────────────────

export function useAdminsQuery() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: () => apiFetch('/auth/admins'),
  })
}

export function useCreateAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) =>
      apiFetch('/auth/admins', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })
}

export function useDeleteAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) =>
      apiFetch(`/auth/admins/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })
}
