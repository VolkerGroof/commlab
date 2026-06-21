import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommLab — Communication Games",
  description: "Explore communication patterns through interactive games and frameworks.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
