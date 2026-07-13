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

// Game Stages API
export function useStagesQuery() {
  return useQuery({
    queryKey: ['stages'],
    queryFn: () => apiClient.get('/stages').then((res) => res.data),
  })
}

export function useStageQuery(stageId) {
  return useQuery({
    queryKey: ['stage', stageId],
    queryFn: () => apiClient.get(`/stages/${stageId}`).then((res) => res.data),
    enabled: !!stageId,
  })
}

// ─── Fraud City: World Maps ───────────────────────────────────

export function useWorldsQuery() {
  return useQuery({
    queryKey: ['worlds'],
    queryFn: () => apiClient.get('/worlds').then((res) => res.data),
  })
}

export function useWorldQuery(worldId) {
  return useQuery({
    queryKey: ['world', worldId],
    queryFn: () => apiClient.get(`/worlds/${worldId}`).then((res) => res.data),
    enabled: !!worldId,
  })
}

export function useWorldObjectsQuery(worldId) {
  return useQuery({
    queryKey: ['worldObjects', worldId],
    queryFn: () => apiClient.get(`/worlds/${worldId}/objects`).then((res) => res.data),
    enabled: !!worldId,
  })
}

export function useWorldNpcsQuery(worldId) {
  return useQuery({
    queryKey: ['worldNpcs', worldId],
    queryFn: () => apiClient.get(`/worlds/${worldId}/npcs`).then((res) => res.data),
    enabled: !!worldId,
  })
}

// ─── Fraud City: NPC Dialogues ───────────────────────────────

export function useNpcDialogueQuery(npcId) {
  return useQuery({
    queryKey: ['npcDialogue', npcId],
    queryFn: () => apiClient.get(`/npcs/${npcId}/dialogue`).then((res) => res.data),
    enabled: !!npcId,
  })
}

export function useNpcRelationshipQuery(npcId) {
  return useQuery({
    queryKey: ['npcRelationship', npcId],
    queryFn: () => apiClient.get(`/npcs/${npcId}/relationship`).then((res) => res.data),
    enabled: !!npcId,
  })
}

export function useTalkMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ npcId, trustChange }) =>
      apiClient.post(`/npcs/${npcId}/talk`, { trustChange }).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['npcRelationship', variables.npcId] })
      queryClient.invalidateQueries({ queryKey: ['relationships'] })
    },
  })
}

export function useRelationshipsQuery() {
  return useQuery({
    queryKey: ['relationships'],
    queryFn: () => apiClient.get('/relationships').then((res) => res.data),
  })
}

// ─── Fraud City: Chapters & Missions ─────────────────────────

export function useChaptersQuery() {
  return useQuery({
    queryKey: ['chapters'],
    queryFn: () => apiClient.get('/chapters').then((res) => res.data),
  })
}

export function useChapterQuery(chapterId) {
  return useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => apiClient.get(`/chapters/${chapterId}`).then((res) => res.data),
    enabled: !!chapterId,
  })
}

export function useMissionsQuery(chapterId) {
  return useQuery({
    queryKey: ['missions', chapterId],
    queryFn: () => {
      const params = chapterId ? `?chapterId=${chapterId}` : ''
      return apiClient.get(`/missions${params}`).then((res) => res.data)
    },
  })
}

export function useAcceptMissionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (missionId) =>
      apiClient.post(`/missions/${missionId}/accept`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}

export function useCompleteObjectiveMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ missionId, objectiveId }) =>
      apiClient.post(`/missions/${missionId}/complete`, { objectiveId }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}

export function useProgressQuery() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: () => apiClient.get('/progress').then((res) => res.data),
  })
}

// ─── Fraud City: Evidence & Bosses ───────────────────────────

export function useEvidenceQuery() {
  return useQuery({
    queryKey: ['evidence'],
    queryFn: () => apiClient.get('/evidence').then((res) => res.data),
  })
}

export function useCollectEvidenceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) =>
      apiClient.post('/evidence/collect', data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
    },
  })
}

export function useBossesQuery(chapterId) {
  return useQuery({
    queryKey: ['bosses', chapterId],
    queryFn: () => {
      const params = chapterId ? `?chapterId=${chapterId}` : ''
      return apiClient.get(`/bosses${params}`).then((res) => res.data)
    },
  })
}

export function useBossQuery(bossId) {
  return useQuery({
    queryKey: ['boss', bossId],
    queryFn: () => apiClient.get(`/bosses/${bossId}`).then((res) => res.data),
    enabled: !!bossId,
  })
}

export function usePresentEvidenceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bossId, evidenceId }) =>
      apiClient.post(`/bosses/${bossId}/present`, { evidenceId }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bosses'] })
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
    },
  })
}

// ─── Fraud City: Player Progression ──────────────────────────

export function usePlayerStatsQuery() {
  return useQuery({
    queryKey: ['playerStats'],
    queryFn: () => apiClient.get('/player/stats').then((res) => res.data),
  })
}

export function useAddXpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (amount) =>
      apiClient.post('/player/xp', { amount }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats'] })
    },
  })
}

export function useUpgradeSkillMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (skill) =>
      apiClient.post('/player/skill', { skill }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats'] })
    },
  })
}

export function useUpdateReputationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ location, change }) =>
      apiClient.post('/player/reputation', { location, change }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats'] })
    },
  })
}
