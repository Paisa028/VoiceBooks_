// type: 'error' | 'success' | 'info'. Renders nothing when there is no message.
export default function Alert({ type = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`alert ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
