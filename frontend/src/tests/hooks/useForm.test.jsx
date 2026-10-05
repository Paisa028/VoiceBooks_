import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useForm } from '../../hooks/useForm';

describe('useForm Hook', () => {
  const initialValues = {
    email: '',
    password: ''
  };

  const validate = (values) => {
    const errors = {};
    if (!values.email) errors.email = 'Email is required';
    if (!values.password) errors.password = 'Password is required';
    return errors;
  };

  const onSubmit = vi.fn().mockResolvedValue({});

  it('should initialize with initial values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit })
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.status).toBeNull();
    expect(result.current.submitting).toBe(false);
  });

  it('should update field values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit })
    );

    act(() => {
      result.current.setFields({ email: 'test@example.com' });
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('should validate on blur and show errors for touched fields', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit })
    );

    // Simulate blur on email field
    act(() => {
      const mockEvent = { target: { name: 'email' } };
      result.current.handleBlur(mockEvent);
    });

    expect(result.current.errors.email).toBe('Email is required');
  });

  it('should not show errors for untouched fields', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit })
    );

    // Don't touch any fields
    expect(result.current.errors).toEqual({});
  });

  it('should handle change events', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit })
    );

    act(() => {
      const mockEvent = { target: { name: 'email', value: 'test@example.com' } };
      result.current.handleChange(mockEvent);
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('should return field props for form fields', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit })
    );

    const fieldProps = result.current.field('email');

    expect(fieldProps.name).toBe('email');
    expect(fieldProps.value).toBe('');
    expect(typeof fieldProps.onChange).toBe('function');
    expect(typeof fieldProps.onBlur).toBe('function');
  });

  it('should handle form submission with valid data', async () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit })
    );

    // Set valid values
    act(() => {
      result.current.setFields({ email: 'test@example.com', password: 'password123' });
    });

    const mockEvent = { preventDefault: vi.fn(), currentTarget: { querySelector: vi.fn() } };

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    expect(result.current.submitting).toBe(false);
  });

  it('should handle form submission with invalid data', async () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit })
    );

    const mockEvent = { 
      preventDefault: vi.fn(), 
      currentTarget: { querySelector: vi.fn().mockReturnValue(null) } 
    };

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBe('Email is required');
    expect(result.current.errors.password).toBe('Password is required');
    expect(result.current.status).toEqual({ type: 'error', message: 'Check the highlighted fields and try again.' });
  });

  it('should handle submission errors', async () => {
    const errorOnSubmit = vi.fn().mockRejectedValue({
      message: 'Network error',
      errors: { email: 'Invalid email' }
    });

    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit: errorOnSubmit })
    );

    // Set valid values
    act(() => {
      result.current.setFields({ email: 'test@example.com', password: 'password123' });
    });

    const mockEvent = { preventDefault: vi.fn(), currentTarget: { querySelector: vi.fn() } };

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(result.current.status).toEqual({ type: 'error', message: 'Network error' });
    expect(result.current.errors.email).toBe('Invalid email');
  });

  it('should flatten nested errors', async () => {
    const errorOnSubmit = vi.fn().mockRejectedValue({
      message: 'Validation error',
      errors: { 
        'business.industry': 'Industry is required',
        'business.country': 'Country is required'
      }
    });

    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit: errorOnSubmit })
    );

    // Set valid values
    act(() => {
      result.current.setFields({ email: 'test@example.com', password: 'password123' });
    });

    const mockEvent = { preventDefault: vi.fn(), currentTarget: { querySelector: vi.fn() } };

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(result.current.errors.industry).toBe('Industry is required');
    expect(result.current.errors.country).toBe('Country is required');
  });

  it('should not submit multiple times simultaneously', async () => {
    const slowOnSubmit = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() =>
      useForm({ initialValues, validate, onSubmit: slowOnSubmit })
    );

    // Set valid values
    act(() => {
      result.current.setFields({ email: 'test@example.com', password: 'password123' });
    });

    const mockEvent = { preventDefault: vi.fn(), currentTarget: { querySelector: vi.fn() } };

    // First submission
    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(result.current.submitting).toBe(true);

    // Second submission while first is in progress
    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    // Should not trigger second submission
    expect(slowOnSubmit).toHaveBeenCalledTimes(1);
  });
});
