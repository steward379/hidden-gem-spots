import React from 'react';
import Navbar from '../components/Navbar';

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="mt-20">{children}</main>
    </>
  );
};

export default Layout;