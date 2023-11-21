import { AuthProvider } from "../context/authContext";
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { AppProps } from 'next/app';
import Layout from '../layouts/layout';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default MyApp;
