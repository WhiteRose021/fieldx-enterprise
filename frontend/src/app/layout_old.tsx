import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster"; // Add this import
import "./globals.css";

// Font optimization
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Export viewport separately
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

// Export themeColor separately
export const themeColor = "#0071BC";

export const metadata: Metadata = {
  title: {
    template: "%s | FieldX",
    default: "FieldX",
  },
  description: "Enterprise-grade CRM solution for modern businesses",
  // Remove viewport and themeColor from here
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <AuthProvider>
            {children}
            <Toaster /> {/* Add the Toaster component here */}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}