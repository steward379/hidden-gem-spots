import React, { useState, useEffect } from "react";
import { Dispatch, SetStateAction } from 'react';
import { User, GoogleAuthProvider, Auth, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { Firestore, doc, setDoc } from "firebase/firestore";
import firebase from "../utils/firebase";
import { LoginMethod } from '../src/LoginMethod';

// enum LoginMethod {
//   None,
//   Email,
//   Google,
// }

interface Props {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  setLoginMethod: Dispatch<SetStateAction<LoginMethod>>;
  LoginMethod: typeof LoginMethod;
}

const GoogleLogComponent: React.FC<Props> = ({ user, setUser, setLoginMethod }) => {

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth as Auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(firebase.auth as Auth, provider);
      const user = result.user as User;
      const userId = user.uid;

      setUser(user);
      setLoginMethod(LoginMethod.Google);

      await setDoc(doc(firebase.db as Firestore, 'users', userId), {
        displayName: user.displayName,
        email: user.email,
      });

      console.log('Google 登入成功，使用者 ID 是：', userId);
    } catch (error) {
      console.log('Google 登入失敗', error);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      
      await signOut(firebase.auth as Auth);
      setLoginMethod(LoginMethod.None);
      setUser(null);
      
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