import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from '../../components/Button.jsx';

describe('Button Component', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should render as button type by default', () => {
    render(<Button>Submit</Button>);

    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should render with custom type', () => {
    render(<Button type="submit">Submit</Button>);

    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should apply primary variant class by default', () => {
    render(<Button>Primary Button</Button>);

    const button = screen.getByRole('button', {
      name: 'Primary Button'
    });

    expect(button).toHaveClass('btn', 'primary');
  });

  it('should apply custom variant class', () => {
    render(
      <Button variant="secondary">
        Secondary Button
      </Button>
    );

    const button = screen.getByRole('button', {
      name: 'Secondary Button'
    });

    expect(button).toHaveClass('btn', 'secondary');
  });

  it('should not have block class by default', () => {
    render(<Button>Normal Button</Button>);

    const button = screen.getByRole('button', {
      name: 'Normal Button'
    });

    expect(button).not.toHaveClass('block');
  });

  it('should have block class when block prop is true', () => {
    render(<Button block>Block Button</Button>);

    const button = screen.getByRole('button', {
      name: 'Block Button'
    });

    expect(button).toHaveClass('block');
  });

  it('should be enabled by default', () => {
    render(<Button>Enabled Button</Button>);

    const button = screen.getByRole('button', {
      name: 'Enabled Button'
    });

    expect(button).not.toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <Button disabled>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole('button', {
      name: 'Disabled Button'
    });

    expect(button).toBeDisabled();
  });

  it('should be disabled when loading prop is true', () => {
    render(
      <Button loading>
        Loading Button
      </Button>
    );

    const button = screen.getByRole('button', {
      name: 'Loading Button'
    });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('should display spinner when loading', () => {
    render(
      <Button loading>
        Loading Button
      </Button>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should pass additional props to button element', () => {
    render(
      <Button
        data-testid="custom-button"
        id="my-button"
      >
        Custom Button
      </Button>
    );

    const button = screen.getByTestId('custom-button');

    expect(button).toHaveAttribute('id', 'my-button');
  });

  it('should render span inside button', () => {
    render(<Button>Span Button</Button>);

    const span = screen.getByText('Span Button');

    expect(span.tagName).toBe('SPAN');
  });
});