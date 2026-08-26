import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ParkingProvider } from "../hooks/useParkingSession";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Spot | Crowdsourced Parking Intelligence",
  description: "Real-time crowdsourced parking likelihood and intelligence. Park, earn Spot points, and navigate with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-100 dark:bg-slate-950 font-sans">
        <ParkingProvider>
          {children}
        </ParkingProvider>
      </body>
    </html>
  );
}
