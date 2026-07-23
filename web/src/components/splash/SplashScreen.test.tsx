import {render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {SplashScreen} from './SplashScreen';

const push = vi.fn();
const replace = vi.fn();
const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({push, replace}),
}));

vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => authState,
}));

describe('SplashScreen', () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    authState.isAuthenticated = false;
    authState.isLoading = false;
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

    expect(push).toHaveBeenCalledWith('/login?returnTo=%2Fgraph');
  });

  it('routes an authenticated visitor directly to the graph', () => {
    authState.isAuthenticated = true;

    render(<SplashScreen />);

    expect(replace).toHaveBeenCalledWith('/graph');
  });
});
