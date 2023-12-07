// /pages/_app.tsx
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
import Script from "next/script";

export const metadata: Metadata = {
  title: "Hidden Gem Spot 旅圓",
  description:
    "Traveling is a great way to learn about the world and you",
  openGraph: { images: ["/ballon.png"] },
};

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <Provider store={store}>
      <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            appearance={{
              // baseTheme: dark
            }}
        >
        <AuthProvider>
          <LastUpdateProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </LastUpdateProvider>
        </AuthProvider>
      </ClerkProvider>
    </Provider>
  );
}

export default MyApp;
