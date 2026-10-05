import { useState } from 'react';

// Server errors for nested fields look like "business.industry".
const flatten = (errors = {}) =>
  Object.fromEntries(Object.entries(errors).map(([k, v]) => [k.replace(/^business\./, ''), v]));

export function useForm({ initialValues, validate, onSubmit, initialErrors = {} }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(initialErrors);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState(null); // { type: 'error' | 'success', message }
  const [submitting, setSubmitting] = useState(false);

  // Only show errors for fields the person has already visited.
  const showErrors = (nextValues, nextTouched) => {
    const all = validate(nextValues);
    setErrors(Object.fromEntries(Object.keys(all).filter((k) => nextTouched[k]).map((k) => [k, all[k]])));
  };

  const setFields = (patch) => {
    const next = { ...values, ...patch };
    setValues(next);
    showErrors(next, touched);
  };

  const handleChange = (e) => setFields({ [e.target.name]: e.target.value });

  const handleBlur = (e) => {
    const nextTouched = { ...touched, [e.target.name]: true };
    setTouched(nextTouched);
    showErrors(values, nextTouched);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;

    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    const all = validate(values);
    setErrors(all);
    if (Object.keys(all).length) {
      setStatus({ type: 'error', message: 'Check the highlighted fields and try again.' });
      requestAnimationFrame(() => form.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }

    setStatus(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Something went wrong. Try again.' });
      if (err.errors) setErrors(flatten(err.errors));
    } finally {
      setSubmitting(false);
    }
  };

  // Spread into <FormField {...field('email')} />
  const field = (name) => ({
    name,
    value: values[name] ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: errors[name],
  });

  return { values, setFields, status, setStatus, submitting, handleSubmit, field };
}
