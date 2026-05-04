import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Toni Generator",
  description: "AI-powered Toni the Tiger image generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
