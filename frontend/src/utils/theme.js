export function getInitialTheme() {
  try {
    const stored = localStorage.getItem('kodisha-theme');
    if (stored === 'light' || stored === 'dark') return stored;

    return 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme) {
  const safeTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = safeTheme;
  document.documentElement.style.colorScheme = safeTheme;
}
