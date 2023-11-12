import React, { useState, useEffect } from "react";
import { Dispatch, SetStateAction } from 'react';
import { User, GoogleAuthProvider, Auth, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { Firestore, doc, setDoc } from "firebase/firestore";
import firebase from "../utils/firebase";
import { LoginMethod } from '../LoginMethod';
import { useAuth } from '../context/authContext';

const GoogleLogComponent = () => {
  const { user, loginWithGoogle, logout, setLoginMethod } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setLoginMethod(LoginMethod.Google);

      console.log('Google 登入成功，使用者 ID 是：', user.uid);
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
        <button onClick={handleGoogleLogout}>使用 Google 登出</button>
      ) : (
        <button onClick={handleGoogleLogin}>使用 Google 登入</button>
      )}
    </div>
  );
};

export default GoogleLogComponent;