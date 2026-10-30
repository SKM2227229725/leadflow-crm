export const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString() : '—')

// <input type="datetime-local"> gives a local wall-clock string; send UTC ISO to the API.
export const localInputToIso = (value) => (value ? new Date(value).toISOString() : '')

export const formatMoney = (v) =>
  v === null || v === undefined || v === '' ? '—' : Number(v).toLocaleString(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
