// Normalises the backend error envelope: {success:false,message,errors:[{field,message}]}
export function parseApiError(err) {
  const data = err?.response?.data
  if (!err?.response) return { message: 'Cannot reach the server. Check your connection.', fields: {} }
  const fields = {}
  for (const e of data?.errors || []) {
    if (e.field) fields[e.field] = fields[e.field] ? `${fields[e.field]} ${e.message}` : e.message
  }
  let message = data?.message || 'Something went wrong.'
  if (fields.non_field_errors) message = fields.non_field_errors
  else if (message === 'Validation failed' && Object.keys(fields).length === 0) message = 'Please check your input.'
  return { message, fields, status: err.response.status }
}
