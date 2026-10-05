import { useState } from 'react';

// Server errors for nested fields look like "business.industry".
const flatten = (errors = {}) =>
  Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [
      key.replace(/^business\./, ''),
      value,
    ])
  );

export function useForm({
  initialValues,
  validate,
  onSubmit,
  initialErrors = {},
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(initialErrors);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Only show validation errors for fields that have been touched.
  const showErrors = (nextValues, nextTouched) => {
    const allErrors = validate(nextValues);

    const visibleErrors = Object.fromEntries(
      Object.keys(allErrors)
        .filter((key) => nextTouched[key])
        .map((key) => [key, allErrors[key]])
    );

    setErrors(visibleErrors);
  };

  const setFields = (patch) => {
    const nextValues = {
      ...values,
      ...patch,
    };

    setValues(nextValues);
    showErrors(nextValues, touched);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFields({
      [name]: value,
    });
  };

  const handleBlur = (event) => {
    const { name } = event.target;

    const nextTouched = {
      ...touched,
      [name]: true,
    };

    setTouched(nextTouched);
    showErrors(values, nextTouched);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prevent multiple simultaneous submissions.
    if (submitting) {
      return;
    }

    const form = event.currentTarget;

    const allTouched = Object.fromEntries(
      Object.keys(values).map((key) => [key, true])
    );

    setTouched(allTouched);

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setStatus({
        type: 'error',
        message: 'Check the highlighted fields and try again.',
      });

      requestAnimationFrame(() => {
        form?.querySelector?.('[aria-invalid="true"]')?.focus();
      });

      return;
    }

    setStatus(null);
    setSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error?.message || 'Something went wrong. Try again.',
      });

      if (error?.errors) {
        setErrors(flatten(error.errors));
      }
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

  return {
    values,
    errors,
    touched,
    setFields,
    status,
    setStatus,
    submitting,
    handleChange,
    handleBlur,
    handleSubmit,
    field,
  };
}