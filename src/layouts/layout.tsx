import React, { useEffect} from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { askNotificationPermission } from '../utils/notification';
import useAuthListeners from '../hooks/useAuthListeners';
import Footer from '../components/Footer'; 

import { Inter } from 'next/font/google'

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ['latin'] })

const Layout = ({ children }) => {
  const { user, loaded } = useAuth();
  
  useAuthListeners();
  
  useEffect(() => {
    askNotificationPermission();

  }, [user, loaded]);

  return (
    <>
      <Navbar />
      <main className={` ${inter.className} mt-20`}>{children}</main>
      <Footer /> 
    </>
  );
};

export default Layout;
