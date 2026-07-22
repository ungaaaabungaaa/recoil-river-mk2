import {render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {SplashScreen} from './SplashScreen';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({push}),
}));

describe('SplashScreen', () => {
  beforeEach(() => {
    push.mockReset();
  });

  it('exposes the exact CTA and a descriptive accessible name', () => {
    render(<SplashScreen />);

    const cta = screen.getByRole('button', {name: 'FU*K ME'});

    expect(cta).toHaveAttribute('aria-describedby', 'splash-cta-description');
    expect(screen.getByText('Enter Recoil River and open the login page.')).toBeInTheDocument();
  });

  it('renders all four replaceable art layers', () => {
    render(<SplashScreen />);

    const layers = screen.getAllByTestId('splash-art-layer');

    expect(layers).toHaveLength(4);
    expect(layers.map((layer) => (layer as HTMLElement).style.backgroundImage)).toEqual([
      'url("/art-1.png")',
      'url("/art-2.png")',
      'url("/art-3.png")',
      'url("/art-4.png")',
    ]);
  });

  it('navigates to the login destination when activated', async () => {
    render(<SplashScreen />);

    screen.getByRole('button', {name: 'FU*K ME'}).click();

    expect(push).toHaveBeenCalledWith('/login');
  });
});
