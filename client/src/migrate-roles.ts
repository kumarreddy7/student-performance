/** Runs before app modules load so Zustand reads normalized roles from localStorage. */
try {
  const raw = localStorage.getItem('user');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (typeof parsed.role === 'string' && parsed.role.toUpperCase().startsWith('ROLE_')) {
      parsed.role = parsed.role.toLowerCase().replace(/^role_/, '');
      localStorage.setItem('user', JSON.stringify(parsed));
    }
  }
} catch {
  /* ignore */
}
