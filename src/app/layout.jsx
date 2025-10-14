// app/layout.js
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { Montaga } from "next/font/google";
import { headers } from "next/headers";

// Configure font
const montaga = Montaga({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-montaga",
  display: "swap",
});

export const metadata = {
  title: "Mountescrow",
  description: "The Safest Way to Transact Online.",
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return (
    <html lang="en" className={`${montaga.variable}`}>
      <head>{nonce && <meta property="csp-nonce" content={nonce} />}</head>
      <body
        className="font-body antialiased"
        nonce={nonce}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
