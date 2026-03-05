import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppProvider } from '@/context/AppContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', weight: ['300', '400', '500', '600', '700'] });

export const metadata = {
  title: 'MedMate',
  description: 'Medical Speech-to-Text',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased bg-bg-page text-text-primary transition-colors duration-200`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
