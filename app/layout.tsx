import type { Metadata } from "next";
import "./globals.css";

import { FastPrAnalytics } from '@/components/fast-pr-analytics';
export const metadata: Metadata = {
  title: "QB Blind Resume",
  description: "Compare NFL quarterback seasons without bias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
            <FastPrAnalytics />
</body>
    </html>
  );
}
