import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IndicBI — Voice-First Business Intelligence & Field CRM for Bharat",
  description: "Query enterprise analytics and log sales activities purely by voice in 10+ Indian languages (Hindi, Telugu, Tamil, Kannada, Gujarati, English).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body 
        suppressHydrationWarning
        className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-indigo-600 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
