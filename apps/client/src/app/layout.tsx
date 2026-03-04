import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Discord Activity",
  description: "Discord Embedded App Activity",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
