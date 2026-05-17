import "./globals.css";

export const metadata = {
  title: "TCG Card Finder",
  description: "Yu-Gi-Oh! card lookup and preview tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
