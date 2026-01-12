/**
 * Root Layout
 * 
 * This is the main layout that wraps all pages.
 * We set up:
 * - HTML metadata (title, description, etc.)
 * - Font loading (Inter from Google Fonts)
 * - Global styles
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Load Inter font with Latin subset
// This is optimized by Next.js for better performance
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

// SEO Metadata
export const metadata: Metadata = {
    title: 'Smart Task Assistant | A2UI Demo',
    description: 'A natural language task manager powered by AI. Demonstrate A2UI framework capabilities with Claude.',
    keywords: ['task manager', 'AI assistant', 'A2UI', 'Claude', 'natural language'],
    authors: [{ name: 'DevRel Demo' }],
    openGraph: {
        title: 'Smart Task Assistant',
        description: 'Manage tasks with natural language using AI',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className={`${inter.className} antialiased`}>
                {/* 
          Main content wrapper
          We could add providers here (theme, state, etc.) in the future
        */}
                <main className="min-h-screen">
                    {children}
                </main>

                {/* 
          TODO: Add analytics script here for production
          Example: <Script src="https://..." strategy="afterInteractive" />
        */}
            </body>
        </html>
    );
}
