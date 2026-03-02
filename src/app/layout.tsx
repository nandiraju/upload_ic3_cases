import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IC3 Document Parser | Intelligence Document Synthesis",
  description: "High-precision clinical data extraction and oncology document synthesis engine. Extract biomarkers, diagnosis, and treatment pathways from handwritten notes, images, and clinical PDFs using Gemini 2.0.",
  keywords: ["Oncology Data Extraction", "Clinical OCR", "Medical PDF Parser", "Handwritten Medical Note Analysis", "Biomarker Extraction", "Cancer Diagnostic Recommender", "IC3 Molecular Synthesis"],
  authors: [{ name: "1Cell.Ai" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
