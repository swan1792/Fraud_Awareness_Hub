import { useQuery } from '@tanstack/react-query'
import apiClient from './axios'

export function useStatsQuery() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => apiClient.get('/stats').then((res) => res.data),
  })
}

export function usePatternsQuery() {
  return useQuery({
    queryKey: ['patterns'],
    queryFn: () => apiClient.get('/patterns').then((res) => res.data),
  })
}

export function useScenariosQuery() {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: () => apiClient.get('/scenarios').then((res) => res.data),
  })
}

export function useAlertsQuery() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiClient.get('/alerts').then((res) => res.data),
  })
}
