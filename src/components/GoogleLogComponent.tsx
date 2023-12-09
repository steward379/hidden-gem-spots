import React, { useState, useEffect } from "react";
import { Dispatch, SetStateAction } from 'react';
import { User, GoogleAuthProvider, Auth, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { Firestore, doc, setDoc } from "firebase/firestore";
import firebase from "../utils/firebase";
import { LoginMethod } from '../LoginMethod';
import { useAuth } from '../context/AuthContext';

const GoogleLogComponent = () => {
  const { user, loginWithGoogle, logout, setLoginMethod } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setLoginMethod(LoginMethod.Google);

      // console.log('Google 登入成功，使用者 ID 是：', user.uid);
    } catch (error) {
      console.log('Google 登入失敗', error);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      console.log('Google 登出成功');
    } catch (error) {
      console.log('Google 登出失敗', error);
    }
  };

  return (
    <div>
      {user ? (
        <button title="google-logout"onClick={handleGoogleLogout}>使用 Google 登出</button>
      ) : (
        <button className=" border-red-400 border border-dashed pl-3 p-1 rounded-full" title="google-login"
                onClick={handleGoogleLogin}>
           <svg className="w-6 h-6 mr-2" /* 調整大小 */ xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.8C34.7 37.2 29.1 42 22 42c-8.3 0-15-6.7-15-15s6.7-15 15-15c3.1 0 5.9 1.1 8.1 2.9l6-6C31.8 5.9 27.1 4 22 4 9.8 4 0 13.8 0 26s9.8 22 22 22c11.8 0 21.4-9.1 21.4-22 0-1.3-.2-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M5.9 15.9l6.4 4.7C14.9 17.1 18.2 16 22 16c3.1 0 5.9 1.1 8.1 2.9l6-6C31.8 5.9 27.1 4 22 4 15.1 4 9.3 8.4 5.9 15.9z"/>
            <path fill="#4CAF50" d="M22 44c4.1 0 7.8-1.4 10.7-3.8l-6-4.9c-1.4 1-3.3 1.6-5.5 1.2-4.4-.8-8-4.4-8.7-8.8l-6.4 4.7c2.3 6.6 8.2 11.1 15.2 11.1z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.8c-.8 4.3-4.4 8-8.8 8.8l6 4.9c3.8-2.5 6.7-6.3 7.8-10.7.2-1.3.2-2.7.2-4 0-1.3-.2-2.7-.4-4z"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default GoogleLogComponent;