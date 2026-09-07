import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AegisCashout | Predictive Cybercrime Analytics & Cashout Location Forecaster",
  description: "I4C & 1930 NCRP Dual-Stage Cybercrime Cashout Forecasting and ERSS CAD Tactical Intervention Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-tactical-bg text-slate-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
