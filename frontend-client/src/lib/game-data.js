// Spot the Fake Slip — game constants
// Extracted from inline hardcoded values for maintainability

export const SPOT_FAKE_ANOMALY_IDS = ['transaction-id', 'amount', 'date']

export const SPOT_FAKE_ANOMALIES = [
  {
    id: 'transaction-id',
    value: '84721',
  },
  {
    id: 'amount',
    value: '500,000 MMK',
  },
  {
    id: 'date',
    value: '15/07/2026 14:32',
  },
]

// Slip display data (non-anomaly fields)
export const SPOT_FAKE_SLIP = {
  from: 'Ma Thida',
  to: 'U Kyaw Zin',
}