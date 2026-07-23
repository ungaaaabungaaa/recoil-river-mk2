import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';

import {LoginForm} from './LoginForm';

describe('LoginForm', () => {
  it('submits an explicit email/password login flow', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<LoginForm onSubmit={submit} />);

    await user.type(screen.getByLabelText('Email'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'riverpass');
    await user.click(screen.getByRole('button', {name: 'Log in'}));

    expect(submit).toHaveBeenCalledWith({
      email: 'reader@example.com',
      password: 'riverpass',
      flow: 'signIn',
    });
  });

  it('switches to a sign-up mode with an eight-character minimum', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', {name: 'Create an account'}));

    expect(
      screen.getByRole('heading', {name: 'Start your river.'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Sign up'})).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('minLength', '8');
  });

  it('shows a provider-safe error without removing the form', () => {
    render(
      <LoginForm
        onSubmit={vi.fn()}
        error="That email and password combination was not found."
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'That email and password combination was not found.',
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});
