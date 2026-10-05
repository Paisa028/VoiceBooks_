import { useState } from 'react';

// Label + input/select + hint + error message. For selects pass as="select" and <option> children.
export default function FormField({ label, name, error, hint, as: Tag = 'input', type = 'text', children, ...rest }) {
  const [reveal, setReveal] = useState(false);
  const id = `field-${name}`;
  const isPassword = type === 'password';
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="control">
        <Tag
          id={id}
          name={name}
          type={Tag === 'input' ? (isPassword && reveal ? 'text' : type) : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {children}
        </Tag>
        {isPassword && (
          <button type="button" className="reveal" onClick={() => setReveal((r) => !r)} aria-pressed={reveal} aria-label={`${reveal ? 'Hide' : 'Show'} ${label}`}>
            {reveal ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="error">{error}</p>}
    </div>
  );
}
