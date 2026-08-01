import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '@/components/OfflineBanner';

describe('OfflineBanner', () => {
  it('renders nothing when online', () => {
    const { container } = render(<OfflineBanner isOnline={true} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the offline message when offline', () => {
    render(<OfflineBanner isOnline={false} />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
});
