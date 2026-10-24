import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconButton } from '../IconButton';

describe('Unified Animated IconButton Component', () => {
  it('renders with mandatory aria-label and ghost variant default', () => {
    render(
      <IconButton aria-label="Close dialog">
        <span>✕</span>
      </IconButton>
    );

    const btn = screen.getByRole('button', { name: /Close dialog/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('aspect-square');
    expect(btn).toHaveClass('bg-transparent');
  });

  it('renders all variants and sizes', () => {
    const { rerender } = render(
      <IconButton aria-label="Settings" variant="primary" size="lg">
        <span>⚙</span>
      </IconButton>
    );

    let btn = screen.getByRole('button');
    expect(btn).toHaveClass('bg-accent');
    expect(btn).toHaveClass('w-12');

    rerender(
      <IconButton aria-label="Delete" variant="danger" size="xs">
        <span>🗑</span>
      </IconButton>
    );

    btn = screen.getByRole('button');
    expect(btn).toHaveClass('bg-risk-bg');
    expect(btn).toHaveClass('w-8');
  });

  it('disables interactions and renders loading spinner when loading is true', () => {
    const handleClick = vi.fn();
    render(
      <IconButton aria-label="Refresh" loading onClick={handleClick}>
        <span>↻</span>
      </IconButton>
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders polymorphic asChild link with accessibility label intact', () => {
    render(
      <IconButton asChild aria-label="Go Home" variant="secondary">
        <a href="/">
          <span>🏠</span>
        </a>
      </IconButton>
    );

    const link = screen.getByRole('link', { name: /Go Home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveClass('bg-surface-raised');
  });
});
