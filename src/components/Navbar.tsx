// Navbar.tsx
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import EmailLogComponent from './EmailLogComponent';
import GoogleLogComponent from './GoogleLogComponent';  
import { LoginMethod } from '../LoginMethod';
import Image from 'next/image';
// context
import { useAuth } from '../context/authContext';
// firebase
import { User, onAuthStateChanged, Auth } from 'firebase/auth';
import firebase from '../utils/firebase';


const Navbar: React.FC = () => {
  const { user, loading, loginMethod, setLoginMethod, logout} = useAuth();

  // useContext 已取代
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(firebase.auth as Auth, (currentUser,) => {
  //     setUser(currentUser);
  //   });

  //   return () => unsubscribe();
  // }, []);

  return (
    <nav className="navbar-container bg-red-400 text-white p-4">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <h1 className="text-2xl font-bold mb-2 cursor-pointer">Hidden Gem Spots</h1>
        </Link>
        {user && (
          <>
            <Image src={user.avatar} alt="User avatar" className="rounded-full w-10 h-10" width="50" height="50" />
            <span>你好，{user.name || '會員'}</span>
            <Link href={`/member/${user.uid}`}>
              <div>會員中心</div>
            </Link>
            <Link href={`/map`}>
              <div>我的地圖</div>
            </Link>
            <button onClick={logout}>登出</button>
          </>
        )} 
        {/* {loginMethod === LoginMethod.None && (
          <>
            <EmailLogComponent user={user} setUser={setUser} setLoginMethod={setLoginMethod}  LoginMethod={LoginMethod} />
            <GoogleLogComponent user={user} setUser={setUser} setLoginMethod={setLoginMethod} LoginMethod={LoginMethod}  />
          </>
        )}
        {loginMethod === LoginMethod.Email && (
          <EmailLogComponent user={user} setUser={setUser} setLoginMethod={setLoginMethod}  LoginMethod={LoginMethod} />
        )}
        {loginMethod === LoginMethod.Google && (
          <GoogleLogComponent user={user} setUser={setUser} setLoginMethod={setLoginMethod}  LoginMethod={LoginMethod}  />
        )} */}
        {!user && (
          <>
            <EmailLogComponent  />
            <GoogleLogComponent  />
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;