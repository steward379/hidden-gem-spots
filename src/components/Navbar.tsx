// Navbar.tsx
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
// Firebase-auth
import EmailLogComponent from './EmailLogComponent';
import GoogleLogComponent from './GoogleLogComponent';  
import { LoginMethod } from '../LoginMethod';

//clerk
import { SignInButton, SignUpButton, UserButton, useUser as useClerkUser } from '@clerk/nextjs';

// firebase
import { User, onAuthStateChanged, Auth } from 'firebase/auth';
import firebase from '../utils/firebase';

const Navbar: React.FC = () => {

  //clerk
  const { isSignedIn, user: clerkUser } = useClerkUser();

  // Firebase-auth
  // const [user, setUser] = useState<User | null>(null);
  // const [loginMethod, setLoginMethod] = useState<LoginMethod>(LoginMethod.None);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(firebase.auth as Auth, (currentUser,) => {
  //     setUser(currentUser);
  //   });

  //   return () => unsubscribe();
  // }, []);


  return (
    <div className="navbar-container bg-red-400 text-white p-4">
      <div className="flex items-center space-x-4">
      <Link href="/">
        <h1 className="text-2xl font-bold mb-2 cursor-pointer">Hidden Gem Spots</h1>
      </Link>

      {!isSignedIn ? (
          <>
            <SignUpButton />  
            <SignInButton />  
          </>
        ) : (
          /* 顯示登入用戶狀態和個人資料的按鈕，通常用於顯示個人資料和登出選項 */
          <> 
            <UserButton />  
            <div>歡迎，{clerkUser.firstName} </div> 
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
      </div>
    </div>
  );
};

export default Navbar;