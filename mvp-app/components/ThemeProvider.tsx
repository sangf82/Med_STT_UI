'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider attribute="data-theme" defaultTheme="light" value={{ light: "light", dark: "dark" }}>
            {children}
        </NextThemesProvider>
    );
}
