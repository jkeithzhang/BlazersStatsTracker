import type { Metadata } from "next";
import "./globals.css";
import "./team-logos.css";
export const metadata: Metadata = { title: "Kanata Blazers Tracker", description: "Opponent directory and hockey stats tracking proof of concept for the Kanata Blazers.", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
