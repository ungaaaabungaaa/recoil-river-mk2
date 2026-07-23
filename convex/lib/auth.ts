const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string {
  const email = String(value ?? "").trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  return email;
}

export function validatePassword(value: unknown): string {
  const password = String(value ?? "");

  if (password.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }

  return password;
}
