// _app.tsx

import { AuthProvider } from "../context/authContext";
// css
import '../styles/globals.css';
//map
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';

import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import firebaseServices from '../utils/firebase'; 
const { db, auth, storage } = firebaseServices; 
import Navbar  from '@/src/components/Navbar';
import { getDoc, doc, setDoc} from 'firebase/firestore';


const MyApp = ({ Component, pageProps}: AppProps ) => {
  // const [userId, setUserId] = useState(null);

  // const router = useRouter();
  // const { asPath } = router;

  // useEffect(() => {

  //   const auth = getAuth();

  //   const unsubscribe = onAuthStateChanged(auth, async (user) => {
  //       if (asPath.startsWith("/accounting") || asPath.startsWith("/map")) {
  //         console.log('No user login');
  //         router.push({
  //           pathname: "/",
  //           query: { message: "請先登入" },
  //         });
  //       }

  //   });

  //   return () => unsubscribe();
  // }, [ asPath, router]);

  return (
    <AuthProvider>
      <Navbar />
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;