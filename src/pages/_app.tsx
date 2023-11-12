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
  return (
    <AuthProvider>
      <Navbar />
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;