import '../styles/globals.css';

//map
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';

import { AppProps } from 'next/app';
import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import Navbar  from '@/src/components/Navbar';


const MyApp  = ({ Component, pageProps}: AppProps ) => {

  const router = useRouter();
  const { asPath } = router;

  useEffect(() => {

    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {

        if(asPath.startsWith("/accounting") || asPath.startsWith("/map")){
          console.log('No user login');

          router.push({
            pathname: "/",
            query: { message: "請先登入" },
          })
        }
      }
    });

    return () => unsubscribe();
  }, [ asPath, router]);

  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;