/**
 * Game API - Shared API client for game scenes
 * Uses fetch with proper error handling and base URL
 */

const API_BASE = "http://localhost:3001/api"

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }
    return await response.json()
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message)
    throw err
  }
}

// ─── World API ───────────────────────────────────────────────
export const worldApi = {
  getWorlds: () => request("/worlds"),
  getWorld: (id) => request(`/worlds/${id}`),
  getWorldObjects: (id) => request(`/worlds/${id}/objects`),
  getWorldNpcs: (id) => request(`/worlds/${id}/npcs`),
}

// ─── NPC API ─────────────────────────────────────────────────
export const npcApi = {
  getDialogue: (npcId) => request(`/npcs/${npcId}/dialogue`),
  getDialogues: (npcId) => request(`/npcs/${npcId}/dialogues`),
  talk: (npcId, trustChange = 0) =>
    request(`/npcs/${npcId}/talk`, {
      method: "POST",
      body: JSON.stringify({ trustChange }),
    }),
  getRelationship: (npcId) => request(`/npcs/${npcId}/relationship`),
}

// ─── Mission API ─────────────────────────────────────────────
export const missionApi = {
  getMissions: (chapterId) => {
    const params = chapterId ? `?chapterId=${chapterId}` : ""
    return request(`/missions${params}`)
  },
  accept: (missionId) =>
    request(`/missions/${missionId}/accept`, { method: "POST", body: "{}" }),
  complete: (missionId, objectiveId) =>
    request(`/missions/${missionId}/complete`, {
      method: "POST",
      body: JSON.stringify({ objectiveId }),
    }),
}

// ─── Player API ──────────────────────────────────────────────
export const playerApi = {
  getStats: () => request("/player/stats"),
  addXp: (amount) =>
    request("/player/xp", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  upgradeSkill: (skill) =>
    request("/player/skill", {
      method: "POST",
      body: JSON.stringify({ skill }),
    }),
}

// ─── Evidence API ────────────────────────────────────────────
export const evidenceApi = {
  getAll: () => request("/evidence"),
  collect: (data) =>
    request("/evidence/collect", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  markRead: (id) =>
    request(`/evidence/${id}/read`, { method: "PUT" }),
}

// ─── Boss API ────────────────────────────────────────────────
export const bossApi = {
  getAll: (chapterId) => {
    const params = chapterId ? `?chapterId=${chapterId}` : ""
    return request(`/bosses${params}`)
  },
  getOne: (id) => request(`/bosses/${id}`),
  present: (bossId, evidenceId) =>
    request(`/bosses/${bossId}/present`, {
      method: "POST",
      body: JSON.stringify({ evidenceId }),
    }),
}

// ─── Save API ────────────────────────────────────────────────
export const saveApi = {
  getSaves: () => request("/saves"),
  save: (slotNumber, saveData) =>
    request("/saves", {
      method: "POST",
      body: JSON.stringify({ slotNumber, saveData }),
    }),
  load: (saveId) =>
    request(`/saves/${saveId}/load`, { method: "POST", body: "{}" }),
  delete: (saveId) =>
    request(`/saves/${saveId}`, { method: "DELETE" }),
}

export default { worldApi, npcApi, missionApi, playerApi, evidenceApi, bossApi, saveApi }
