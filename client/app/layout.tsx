import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ACEquity",
  description: "Hassle-free stock market tracker",
  openGraph: {
    title: "ACEquity",
    siteName: "ACEquity",
    description: "Hassle-free stock market tracker",
    url: "https://ace.webark.in",
    type: "website",
    images: [
      {
        url: "https://ace.webark.in/og-image.png",
        width: 1200,
        height: 630,
        alt: "ACEquity Open Graph Image",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="container mx-auto px-4 py-4 flex-grow">{children}</main>
            <Footer />
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
