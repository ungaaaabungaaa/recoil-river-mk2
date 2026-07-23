import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import LoginPage from './page';

describe('login destination', () => {
  it('shows the SSO login entry points', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', {name: 'Welcome back'})).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Sign in'})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Request access'})).toBeInTheDocument();
  });
});
