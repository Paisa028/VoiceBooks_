export default function Spinner({ large }) {
  return <span className={`spinner${large ? ' lg' : ''}`} aria-hidden="true" />;
}

export function FullPageSpinner() {
  return (
    <div className="fullpage" role="status">
      <Spinner large />
      <span className="sr-only">Loading</span>
    </div>
  );
}
