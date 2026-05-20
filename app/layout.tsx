import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniClub OS — University Club Management System",
  description: "The all-in-one platform to manage your university club — members, activities, finance, and announcements.",
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
      </body>
    </html>
  );
}
