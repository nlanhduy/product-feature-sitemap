// src/services/FeatureService.ts
const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/features`

export const FeatureService = {
  create: async data => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create feature')
    return res.json()
  },

  getById: async featureId => {
    const res = await fetch(`${BASE_URL}/${featureId}`)
    if (!res.ok) throw new Error('Failed to fetch feature')
    return res.json()
  },

  update: async ({ featureId, data }) => {
    const res = await fetch(`${BASE_URL}/${featureId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update feature')
    return res.json()
  },

  delete: async featureId => {
    const res = await fetch(`${BASE_URL}/${featureId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete feature')
    return res.json()
  },
}
