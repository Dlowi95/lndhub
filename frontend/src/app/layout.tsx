import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Noto_Sans } from 'next/font/google';
import '@mantine/core/styles.css';
import './globals.css';
import './components.css';
import './responsive.css';
import './brand-icons.css';
import './themes.css';
import { UIProvider } from '../components/UIProvider';

const bodyFont = Noto_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const headingFont = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'lndhub | Catalog dịch vụ số',
  description: 'Khám phá ChatGPT, Gemini, Claude, Grok, Adobe, VPN và các dịch vụ số khác trong catalog rõ ràng của lndhub.',
  keywords: 'lndhub, dịch vụ số, ChatGPT, Gemini, Claude, Adobe, VPN',
  icons: {
    icon: '/images/logo.webp',
    shortcut: '/images/logo.webp',
    apple: '/images/logo.webp',
  },
  openGraph: {
    title: 'lndhub | Catalog dịch vụ số',
    description: 'Một catalog gọn gàng cho AI, sáng tạo, giải trí và công cụ làm việc.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-theme="light" data-mantine-color-scheme="light" suppressHydrationWarning className={`${bodyFont.variable} ${headingFont.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var a=location.pathname.indexOf('/lndhub-sysadmin')===0;var t=a?'dark':(localStorage.getItem('lndhub-color-theme')==='dark'?'dark':'light');var r=document.documentElement;r.dataset.theme=t;r.dataset.mantineColorScheme=t;r.style.colorScheme=t}catch(e){}})();` }} />
      </head>
      <body className="antialiased selection:bg-cyan-500 selection:text-black">
        <UIProvider>{children}</UIProvider>
      </body>
    </html>
  );
}
