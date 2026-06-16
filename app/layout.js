import './globals.css';
import { AppContextProvider } from './context/AppContext';

export const metadata = {
  title: 'Shri Hans Vidya Niketan School — Marksheet',
  description: 'Vidya Portal — Student Marksheet & Admission System',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: 'no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:ital,wght@0,400;0,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppContextProvider>
          {children}
        </AppContextProvider>
      </body>
    </html>
  );
}
