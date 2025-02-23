import { Inter } from 'next/font/google';
import "./globals.css";
import RootLayoutContent from '@/components/RootLayoutContent.client';
import { SupabaseProvider } from '@/components/SupabaseProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Periospot AI',
  description: 'Scientific Article Analysis for Dental Professionals',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
  },
};

// Force dynamic rendering to prevent session caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <SupabaseProvider>
          <RootLayoutContent>
            {children}
          </RootLayoutContent>
        </SupabaseProvider>
      </body>
    </html>
  );
}
