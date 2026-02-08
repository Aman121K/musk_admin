import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Musshk Admin Panel",
  description: "Admin panel for Musshk",
  icons: {
    icon: [{ url: '/logo/musshk.png', type: 'image/png', sizes: 'any' }],
    apple: '/logo/musshk.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

