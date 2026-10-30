export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="row end">
          <button className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn danger" onClick={onConfirm} disabled={busy}>{busy ? 'Deleting…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
