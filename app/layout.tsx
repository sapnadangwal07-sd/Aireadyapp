import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { StoreProvider } from '@/lib/store';
import { AppShell } from '@/components/app-shell';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mellinks — Business Management',
  description:
    'A modern business management dashboard for customers, products, services, and sales.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreProvider>
          <AppShell>{children}</AppShell>
          <Toaster richColors position="top-right" />
        </StoreProvider>
      </body>
    </html>
  );
}
