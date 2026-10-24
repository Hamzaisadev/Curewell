import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Unified Animated Button Component', () => {
  it('renders children with default primary variant and md size', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /Click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('bg-accent');
    expect(btn).toHaveClass('h-12');
  });

  it('renders all variants correctly', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-surface-raised');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');

    rerender(<Button variant="subtle">Subtle</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-accent-subtle');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-risk-bg');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-line-strong');
  });

  it('renders all sizes correctly', () => {
    const { rerender } = render(<Button size="xs">XS</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');

    rerender(<Button size="sm">SM</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');

    rerender(<Button size="md">MD</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12');

    rerender(<Button size="lg">LG</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-14');

    rerender(<Button size="xl">XL</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-16');
  });

  it('handles click events when active', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click events and applies disabled attributes when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('preserves layout stability and prevents click events when loading', () => {
    const handleClick = vi.fn();
    render(
      <Button loading loadingText="Saving..." onClick={handleClick}>
        Save Profile
      </Button>
    );

    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();

    // The inner content should still be present in the DOM (for layout preservation)
    expect(screen.getByText('Save Profile')).toBeInTheDocument();
    // The spinner and loading text should also be visible in overlay
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders left and right icons with optical alignment wrappers', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">←</span>}
        rightIcon={<span data-testid="right-icon">→</span>}
      >
        Navigate
      </Button>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies fullWidth style when prop is true', () => {
    render(<Button fullWidth>Wide Action</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('renders polymorphic asChild component cleanly', () => {
    render(
      <Button asChild variant="outline">
        <a href="/reports">View Reports Vault</a>
      </Button>
    );

    const link = screen.getByRole('link', { name: /View Reports Vault/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/reports');
    expect(link).toHaveClass('border-line-strong');
  });

  it('triggers haptic pulse on pointer down when supported', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    render(<Button haptic>Haptic Button</Button>);
    fireEvent.pointerDown(screen.getByRole('button'));
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });
});
