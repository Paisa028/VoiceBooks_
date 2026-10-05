import React from 'react';

export default function Spinner({ large }) {
  return (
    <span
      className={`spinner${large ? ' lg' : ''}`}
      role="status"
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