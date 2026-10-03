import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessageRenderer, isUrduText } from '../ChatMessageRenderer';

describe('ChatMessageRenderer & isUrduText', () => {
  it('correctly detects Urdu script vs English script', () => {
    expect(isUrduText('کیا شوگر کی دوا کھانے سے پہلے لینی چاہیے؟')).toBe(true);
    expect(isUrduText('خون کا دباؤ')).toBe(true);
    expect(isUrduText('Take Metformin 500mg after breakfast')).toBe(false);
    expect(isUrduText('')).toBe(false);
  });

  it('renders Urdu text with dir="rtl" and Urdu typography styling', () => {
    const urduContent = 'یہ دوا روزانہ صبح ناشتے کے بعد لیں۔';
    const { container } = render(<ChatMessageRenderer content={urduContent} />);

    const rootDiv = container.querySelector('[dir="rtl"]');
    expect(rootDiv).toBeInTheDocument();
    expect(rootDiv?.className).toContain('leading-[2.05]');
    expect(rootDiv?.className).toContain('text-right');
    expect(screen.getByText(/یہ دوا روزانہ صبح ناشتے کے بعد لیں۔/)).toBeInTheDocument();
  });

  it('renders English text with dir="auto" and standard styling', () => {
    const englishContent = 'Take Metformin 500mg once daily with meals.';
    const { container } = render(<ChatMessageRenderer content={englishContent} />);

    const rootDiv = container.querySelector('[dir="auto"]');
    expect(rootDiv).toBeInTheDocument();
    expect(rootDiv?.className).toContain('leading-relaxed');
    expect(screen.getByText(/Take Metformin 500mg once daily with meals\./)).toBeInTheDocument();
  });

  it('wraps Latin brand names inside Urdu text in <bdi> tokens to isolate BiDi punctuation inversion', () => {
    const mixedContent = 'آپ Panadol 500mg ضرورت کے وقت لے سکتے ہیں۔';
    const { container } = render(<ChatMessageRenderer content={mixedContent} />);

    const bdiElement = container.querySelector('bdi');
    expect(bdiElement).toBeInTheDocument();
    expect(bdiElement?.textContent).toBe('Panadol 500mg');
  });

  it('renders markdown links properly', () => {
    const linkContent = 'Please call [Rescue 1122](tel:1122) immediately.';
    render(<ChatMessageRenderer content={linkContent} />);

    const link = screen.getByRole('link', { name: 'Rescue 1122' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'tel:1122');
  });

  it('renders markdown tables properly', () => {
    const tableContent = '| Medicine | Timing |\n| --- | --- |\n| Glucophage | Breakfast |\n| Panadol | PRN |';
    const { container } = render(<ChatMessageRenderer content={tableContent} />);

    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('Glucophage')).toBeInTheDocument();
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
  });
});
