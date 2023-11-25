// pages/context/authContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth, createUserWithEmailAndPassword,  signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter }  from 'next/router';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import firebaseServices from '../utils/firebase';
const { db, auth, storage } = firebaseServices;
// import { IUser } from '../types/IUser';
import { LoginMethod } from '../LoginMethod';

interface IUser {
  uid: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  following: string[];  
  followers: string[]; 
}

const AuthContext = createContext<{
  user: IUser | null;
  loading: boolean;
  loginMethod: LoginMethod;
  setLoginMethod: (method: LoginMethod) => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}>({
  user: null,
  loading: true,
  loginMethod: LoginMethod.None,
  setLoginMethod: () => {},
  loginWithEmail: async () => {},
  signUpWithEmail: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

// 創建一個提供者組件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children}) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(LoginMethod.None);

  const router = useRouter();

  // const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userRef);

        let userData: IUser;

        if (!docSnap.exists()) {
          userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            avatar: firebaseUser.photoURL,
            following: [],
            followers: []
          };
          await setDoc(userRef, userData);
        } else {
          userData = docSnap.data() as IUser;
        }

        setUser(userData);
      } else {
        setUser(null);
        setLoading(false);
        if (router.asPath.startsWith("/accounting") || router.asPath.startsWith("/map")) {
          router.push({ pathname: "/", query: { message: "請先登入" } });
        }
      }
      setLoading(false);
    });
  
    // 清理監聽器
    return () => unsubscribe();
  }, [router]);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userRef);
  
      if (docSnap.exists()) {
        setUser(docSnap.data() as IUser);
      }
      setLoginMethod(LoginMethod.Email);
    } catch (error) {
      console.error("Email 登入失敗", error);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      const userRef = doc(db, 'users', newUser.uid);

      await setDoc(userRef, {
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.displayName,
        avatar: newUser.photoURL,
        following: [],
        followers: []
      });

      setUser({
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.displayName,
        avatar: newUser.photoURL,
        following: [],
        followers: []
      });
      setLoginMethod(LoginMethod.Email);
    } catch (error) {
      console.error("Email 註冊失敗", error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const userRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userRef);
  
      if (docSnap.exists()) {
        setUser(docSnap.data() as IUser);
      }
      setLoginMethod(LoginMethod.Google);
    } catch (error) {
      console.error("Google 登入失敗", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setLoginMethod(LoginMethod.None);
      router.push("/");
    } catch (error) {
      console.error("登出失敗", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginMethod, setLoginMethod, loginWithEmail, signUpWithEmail, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook 來使用 context
export const useAuth = () => useContext(AuthContext);
