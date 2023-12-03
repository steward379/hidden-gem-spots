// /pages/_app.tsx
import { AuthProvider } from "../context/AuthContext";
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { AppProps } from 'next/app';
import Layout from '../layouts/layout';
import { MapNotificationProvider } from '../context/MapNotificationContext';
import { LastUpdateProvider } from '../context/LastUpdateContext';

import { Provider } from 'react-redux';
import { store } from '../store/store';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <LastUpdateProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </LastUpdateProvider>
      </AuthProvider>
    </Provider>
  );
}

export default MyApp;
