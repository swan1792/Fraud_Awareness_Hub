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

export function useUpdateAlertMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }) =>
      apiClient.put(`/alerts/${id}`, body).then((res) => res.data),
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

// ─── Game Stages ─────────────────────────────────────────────

export function useStagesQuery() {
  return useQuery({
    queryKey: ['stages'],
    queryFn: () => apiClient.get('/stages/all').then((res) => res.data),
  })
}

export function useCreateStageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) =>
      apiClient.post('/stages', body).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
  })
}

export function useUpdateStageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }) =>
      apiClient.put(`/stages/${id}`, body).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
  })
}

export function useDeleteStageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) =>
      apiClient.delete(`/stages/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
  })
}

export function useTogglePublishMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) =>
      apiClient.patch(`/stages/${id}/publish`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
  })
}

// ─── Fraud City: Chapters ────────────────────────────────────

export function useChaptersQuery() {
  return useQuery({
    queryKey: ['chapters'],
    queryFn: () => apiClient.get('/chapters').then((res) => res.data),
  })
}

export function useCreateChapterMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => apiClient.post('/chapters', body).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapters'] }),
  })
}

export function useUpdateChapterMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => apiClient.put(`/chapters/${id}`, body).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapters'] }),
  })
}

export function useDeleteChapterMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/chapters/${id}`).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapters'] }),
  })
}

// ─── Fraud City: Missions ────────────────────────────────────

export function useMissionsQuery(chapterId) {
  return useQuery({
    queryKey: ['missions', chapterId],
    queryFn: () => {
      const params = chapterId ? `?chapterId=${chapterId}` : ''
      return apiClient.get(`/missions${params}`).then((res) => res.data)
    },
  })
}

export function useCreateMissionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => apiClient.post('/missions', body).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['missions'] }),
  })
}

export function useDeleteMissionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/missions/${id}`).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['missions'] }),
  })
}
