export const Loading = ({ label = 'Loading…' }) => (
  <div className="state" role="status"><span className="spinner" aria-hidden="true" /> {label}</div>
)
export const ErrorBanner = ({ message, onRetry }) =>
  message ? (
    <div className="alert error" role="alert">
      {message} {onRetry && <button className="link" onClick={onRetry}>Retry</button>}
    </div>
  ) : null
export const EmptyState = ({ title, children }) => (
  <div className="state empty"><strong>{title}</strong><div>{children}</div></div>
)
