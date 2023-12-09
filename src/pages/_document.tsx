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
          <meta name="description" content="旅遊景點" />
          <meta name="keywords" content="關鍵字1, 關鍵字2" />
          {/* Preconnect to Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* Import Font */}
          <link href="https://fonts.googleapis.com/css2?family=Hepta+Slab:wght@300;400;500&family=Noto+Sans+TC:wght@300;400;500&display=swap" 
                rel="stylesheet" />
          {/* Import Font Awesome */}
          <link
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            rel="stylesheet"
          />
        </Head>
        <body className="font-sans font-normal">
          <Main />
          <NextScript />
          <div id="modal-root"></div>
        </body>
      </Html>
    );
  }
}

export default MyDocument;
