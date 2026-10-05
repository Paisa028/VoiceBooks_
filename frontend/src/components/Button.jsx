import React from 'react';
import Spinner from './Spinner.jsx';

export default function Button({
  loading = false,
  variant = 'primary',
  block = false,
  type = 'button',
  disabled,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn ${variant}${block ? ' block' : ''}`}
      disabled={loading || disabled}
      aria-busy={loading ? 'true' : undefined}
      {...rest}
    >
      {loading && <Spinner />}
      <span>{children}</span>
    </button>
  );
}