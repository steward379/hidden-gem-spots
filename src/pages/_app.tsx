// _app.tsx
// _app.tsx
import '../styles/globals.css';
import Navbar from '@/src/components/Navbar';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import 'leaflet/dist/leaflet.css';
import { ClerkProvider, ClerkLoaded, useUser, useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import firebaseServices from '../utils/firebase'; // 確保這個路徑指向您初始化 Firebase 的文件
const { auth, db, storage } = firebaseServices;

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <ClerkProvider>
      <ClerkLoaded>
        <ProtectedComponent Component={Component} pageProps={pageProps} />
      </ClerkLoaded>
    </ClerkProvider>
  );
};

const ProtectedComponent = ({ Component, pageProps }) => {
  const router = useRouter();
  const { user } = useUser();
  const { isSignedIn, session } = useAuth();

  const publicPages = []; // 定義公開頁面的路徑

  // useEffect(() => {
  //   if (!publicPages.includes(router.pathname) && !isSignedIn) {
  //     router.push('/', { query: { message: '請先登入' } });
  //   }
  // }, [router, isSignedIn]);
  
  useEffect(() => {
    let isMounted = true; // 加入掛載標誌以防止未掛載組件的狀態更新

    if (isSignedIn && session ) { 
        signInWithCustomToken(auth, session.idToken).then((userCredential) => {
        // 登入成功
          const user = userCredential.user;
        }).catch((error) => {
          // 處理錯誤
          const errorCode = error.code;
          const errorMessage = error.message;
        });
    } else{
      signOut(auth).then(() => {
        // Sign-out successful.
      }).catch((error) => {
        // An error happened.
      });
    }
  return () => {
    isMounted = false; // 在組件卸載時設置掛載標誌為 false
  };
}, [isSignedIn, session]);

  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
};

export default MyApp;
