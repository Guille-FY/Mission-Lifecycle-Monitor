import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MISSION LIFECYCLE MONITOR",
  description: "Advanced Telemetry System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${vt323.variable} antialiased bg-black text-white selection:bg-white selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
