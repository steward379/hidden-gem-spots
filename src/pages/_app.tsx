import React, { useEffect } from 'react';
import { appWithTranslation, useTranslation } from 'next-i18next';
import nextI18NextConfig from '../../next-i18next.config.js';

import { AuthProvider } from "../context/AuthContext";
import 'leaflet/dist/leaflet.css';
import { AppProps } from 'next/app';
import Layout from '../layouts/layout';
// import { MapNotificationProvider } from '../context/MapNotificationContext';
import { LastUpdateProvider } from '../context/LastUpdateContext';
import { ClerkProvider } from "@clerk/nextjs";
import { Provider } from 'react-redux';
import { store } from '../store/store';
import '../styles/globals.css'
import { Metadata } from "next";
import Head from 'next/head';

import { GlobeProvider } from '../context/GlobeContext';
import { useRouter } from 'next/router';

export const metadata: Metadata = {
  title: "Hidden Gem Spot 旅圓",
  description:
    "Traveling is a great way to learn about the world and you",
  openGraph: { images: ["/ballon.png"] },
};

const MyApp = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  const { i18n } = useTranslation(); 

  useEffect(() => {
    const loadTranslations = async () => {
      if (!i18n.hasResourceBundle(router.locale, 'common')) {
        const response = await fetch(`/locales/${router.locale}/common.json`);
        const translations = await response.json();
        i18n.addResourceBundle(router.locale, 'common', translations, true, true);
      }
    };

    loadTranslations();
  }, [router.locale, i18n]);

  return (
    <Provider store={store}>
      <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            // appearance={{
              // baseTheme: dark
            // }}
        >
        <AuthProvider>
          <LastUpdateProvider>
            <GlobeProvider>
              <Head>
                  <title>Hidden Gem Spot 旅圓</title>
                  <meta name="description" content="Hidden Gem is a platform leads you to create and find attractions 旅圓，讓你記錄每一趟生活冒險。" />
                  <meta property="og:title" content="Hidden Gem 旅圓" />
                  <meta property="og:description" content="Travel, Note & Discover the hidden gems around you."/>
                  <meta property="og:url" content="https://hidden-gem.xyz/" />
                  <meta property="og:type" content="website" />
                  <meta property="og:image" content="https://hidden-gem.xyz/images/og-image.png" />
                  <meta property="og:site_name" content="Hidden Gem" />
                  <meta property="og:locale" content="zh_TW" />
              </Head>

              <Layout>
                  <Component {...pageProps} />
              </Layout>  
            </GlobeProvider>
          </LastUpdateProvider>
        </AuthProvider>
      </ClerkProvider>
    </Provider>
  );
}

// export default MyApp;
// @ts-ignore
export default appWithTranslation(MyApp, nextI18NextConfig);