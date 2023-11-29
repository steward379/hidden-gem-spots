import React from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/authContext';
import { askNotificationPermission } from '../utils/notification';
import { useAuthListeners } from '../hooks/useAuthListeners';

const Layout = ({ children }) => {
  const { user, loaded } = useAuth();
  
  // useAuthListeners();
  
  React.useEffect(() => {
    askNotificationPermission();

  }, [user, loaded]);

  return (
    <>
      <Navbar />
      <main className="mt-20">{children}</main>
    </>
  );
};

export default Layout;
