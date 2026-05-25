/** Normalize JWT/Spring role strings (e.g. ROLE_TEACHER) to app role ids (teacher). */
export function normalizeRole(role: string | undefined | null): string {
  if (!role) return '';
  return role.toLowerCase().replace(/^role_/, '');
}

export function isRole(
  role: string | undefined | null,
  ...allowed: string[]
): boolean {
  const normalized = normalizeRole(role);
  return allowed.includes(normalized);
}
