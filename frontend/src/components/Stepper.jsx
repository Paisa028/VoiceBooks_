export default function Stepper({ current, labels }) {
  return (
    <div className="stepper">
      <p>Step {current} of {labels.length}: {labels[current - 1]}</p>
      <div className="bars" aria-hidden="true">
        {labels.map((label, i) => <span key={label} className={i < current ? 'on' : ''} />)}
      </div>
    </div>
  );
}
