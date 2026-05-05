import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocuGuard – Secure Document Watermark Tool (No Upload)",
  description:
    "Protect your IC, passport, and sensitive documents with watermark instantly in your browser. No upload, no storage.",
  keywords: [
    "watermark IC Malaysia",
    "document watermark tool",
    "protect passport copy",
    "secure document copy",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
