
export default function Spinner({ large, decorative = false }) {
  return (
    <span
      className={`spinner${large ? ' lg' : ''}`}
      role={decorative ? undefined : 'status'}
      aria-label={decorative ? undefined : 'Loading'}
      aria-hidden={decorative || undefined}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="fullpage">
      <Spinner large />
      <span className="sr-only">Loading</span>
    </div>
  );
}
