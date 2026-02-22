import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["400", "500", "600", "700"] });

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
      <body className={dmSans.variable + " font-sans antialiased"}>{children}</body>
    </html>
  );
}

