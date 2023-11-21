import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="zh-TW">
        <Head>
          <meta name="description" content="你的網站描述" />
          <meta name="keywords" content="關鍵字1, 關鍵字2" />
          {/* Preconnect to Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* Import Font */}
          <link href="https://fonts.googleapis.com/css2?family=Hepta+Slab:wght@300;400;500&family=Noto+Sans+TC:wght@300;400;500&display=swap" 
                rel="stylesheet" />
        </Head>
        <body className="font-sans font-normal">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
