import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YARD WORK — 3D Print Studio",
  description: "Upload, configure, and order custom 3D prints from Yard Work / Spaghetti Farms.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&family=Space+Grotesk:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #000; color: #fff; font-family: 'Space Grotesk', sans-serif; overflow: hidden; }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none; width: 10px; height: 10px;
            background: #fff; border-radius: 50%; cursor: pointer;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
