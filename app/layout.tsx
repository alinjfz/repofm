import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoFM | Your repo, voiced.",
  description: "Turn any public GitHub repository into a shareable two-host podcast episode."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
