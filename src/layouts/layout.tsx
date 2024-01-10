import React, { useEffect} from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { askNotificationPermission } from '../utils/notification';
import useAuthListeners from '../hooks/useAuthListeners';


// import { Inter } from 'next/font/google'

// If loading a variable font, you don't need to specify the font weight
// const inter = Inter({ subsets: ['latin'] })

// ${inter.className}

const Layout = ({ children }) => {
  const { user, loaded } = useAuth();
  
  useAuthListeners();
  
  useEffect(() => {
    askNotificationPermission();

  }, [user, loaded]);

  return (
    <>
      <Navbar />
      <main className={`mt-20`}>{children}</main>
    </>
  );
};

export default Layout;
