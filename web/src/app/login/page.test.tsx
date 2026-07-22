import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import LoginPage from './page';

describe('login destination', () => {
  it('shows login and register entry points', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', {name: 'Enter your river'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Log in'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Register'})).toBeInTheDocument();
  });
});
