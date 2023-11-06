// _app.tsx
// _app.tsx
import '../styles/globals.css';
import Navbar from '@/src/components/Navbar';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import 'leaflet/dist/leaflet.css';
import { ClerkProvider, ClerkLoaded, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
// import { signInWithCustomToken } from 'firebase/auth';
import firebaseServices from '../utils/firebase'; // 確保這個路徑指向您初始化 Firebase 的文件

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
  const { isSignedIn, user } = useUser();
  const publicPages = []; // 定義公開頁面的路徑

  useEffect(() => {
    if (!publicPages.includes(router.pathname) && !isSignedIn) {
      router.push({
        pathname: '/',
        query: { message: '請先登入' },
      });
    }
  }, [router, isSignedIn, publicPages]);

  useEffect(() => {
    // Clerk 與 Firebase 狀態同步
    if (isSignedIn && user) {
      user.getSessions().then(sessions => {
        if (sessions) {
          const clerkToken = sessions.jwt;
          firebaseServices.auth.signInWithCustomToken(clerkToken);
        }
      });
    }
  }, [isSignedIn, user]);

  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
};

export default MyApp;
