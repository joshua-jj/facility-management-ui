import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/*
          Brand favicon. Centralised here so every page picks it up via
          _document. Per-page <link rel="icon"> tags in individual pages
          can override if needed, but the default points at the EGFM
          logo. PNG instead of ICO — every modern browser supports PNG
          favicons and we already ship the logo as PNG.
        */}
        <link rel="icon" type="image/png" href="/assets/images/egfm-logo.png" />
        <link rel="apple-touch-icon" href="/assets/images/egfm-logo.png" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
