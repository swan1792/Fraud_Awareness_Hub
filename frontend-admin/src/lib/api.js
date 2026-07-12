import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './axios'

export function useAlertsQuery() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiClient.get('/alerts').then((res) => res.data),
  })
}

export function useCreateAlertMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) =>
      apiClient.post('/alerts', body).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useDeleteAlertMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) =>
      apiClient.delete(`/alerts/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

// ─── Admin Users (super_admin only) ─────────────────────────

export function useAdminsQuery() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: () => apiClient.get('/auth/admins').then((res) => res.data),
  })
}

export function useCreateAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) =>
      apiClient.post('/auth/admins', body).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })
}

export function useDeleteAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) =>
      apiClient.delete(`/auth/admins/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })
}
