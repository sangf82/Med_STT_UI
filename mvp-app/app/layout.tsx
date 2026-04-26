import { Be_Vietnam_Pro, Geist, Inter, Newsreader } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppProvider } from '@/context/AppContext';
import './globals.css';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({ subsets: ['latin'], display: 'swap', weight: ['300', '400', '500', '600', '700'] });

/** pen-stt-108 · titles (Newsreader) + Vietnamese UI (Be Vietnam Pro) */
const p108Newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-p108-newsreader',
  display: 'swap',
});
const p108BeVietnam = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-p108-be',
  display: 'swap',
});

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
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn('font-sans', geist.variable, p108Newsreader.variable, p108BeVietnam.variable)}
    >
      <body
        className={`${inter.className} min-h-screen antialiased bg-background text-foreground transition-colors duration-200`}
      >
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
