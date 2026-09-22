'use client';

import { createTheme, MantineProvider } from '@mantine/core';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ColorTheme = 'light' | 'dark';

const ColorThemeContext = createContext<{
  colorTheme: ColorTheme;
  toggleColorTheme: () => void;
}>({ colorTheme: 'light', toggleColorTheme: () => undefined });

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'xl',
  fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
  headings: { fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: '700' },
  components: {
    Button: { defaultProps: { radius: 'xl' } },
    Modal: { defaultProps: { closeButtonProps: { 'aria-label': 'Đóng hộp thoại' }, centered: true, radius: 'xl', overlayProps: { backgroundOpacity: 0.55, blur: 12 }, classNames: { content: 'glass-modal', header: 'glass-modal-header' } } },
  },
});

export function UIProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const adminRoute = pathname.startsWith('/lndhub-sysadmin');
  const [preferredTheme, setPreferredTheme] = useState<ColorTheme>('light');
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    setPreferredTheme(localStorage.getItem('lndhub-color-theme') === 'dark' ? 'dark' : 'light');
    setThemeReady(true);
  }, []);

  const colorTheme: ColorTheme = adminRoute ? 'dark' : preferredTheme;

  useEffect(() => {
    if (!themeReady) return;
    const root = document.documentElement;
    root.dataset.theme = colorTheme;
    root.dataset.mantineColorScheme = colorTheme;
    root.style.colorScheme = colorTheme;
    if (!adminRoute) localStorage.setItem('lndhub-color-theme', preferredTheme);
  }, [adminRoute, colorTheme, preferredTheme, themeReady]);

  const value = useMemo(() => ({
    colorTheme,
    toggleColorTheme: () => setPreferredTheme((current) => current === 'light' ? 'dark' : 'light'),
  }), [colorTheme]);

  return <ColorThemeContext.Provider value={value}><MantineProvider theme={theme} forceColorScheme={colorTheme}>{children}</MantineProvider></ColorThemeContext.Provider>;
}

export function useColorTheme() {
  return useContext(ColorThemeContext);
}
