import { useQuery } from '@tanstack/react-query'

const API_BASE = 'http://localhost:3001/api'

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export function useStatsQuery() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => apiFetch('/stats'),
  })
}

export function usePatternsQuery() {
  return useQuery({
    queryKey: ['patterns'],
    queryFn: () => apiFetch('/patterns'),
  })
}

export function useScenariosQuery() {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: () => apiFetch('/scenarios'),
  })
}

export function useAlertsQuery() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiFetch('/alerts'),
  })
}
