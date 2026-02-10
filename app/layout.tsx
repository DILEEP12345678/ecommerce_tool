import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConvexClientProvider } from './providers';
import { UserProvider } from '../components/UserContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Collection Point System',
  description: 'Order products and collect from your nearest collection point',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          <UserProvider>{children}</UserProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
