// /pages/_app.tsx
import { AuthProvider } from "../context/AuthContext";
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { AppProps } from 'next/app';
import Layout from '../layouts/layout';
import { MapNotificationProvider } from '../context/MapNotificationContext';
import { LastUpdateProvider } from '../context/LastUpdateContext';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <AuthProvider>
      <LastUpdateProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </LastUpdateProvider>
    </AuthProvider>
  );
}

export default MyApp;
