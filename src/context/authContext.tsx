// authContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth, createUserWithEmailAndPassword,  signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter }  from 'next/router';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import firebaseServices from '../utils/firebase';
const { db, auth, storage } = firebaseServices;
// import { IUser } from '@/src/types/user';
import { LoginMethod } from '../LoginMethod';

interface IUser {
  uid: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
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

        if (!docSnap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            avatar: firebaseUser.photoURL,
          });
        }

        const userData: IUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          avatar: firebaseUser.photoURL,
        };
        setUser(userData);
      } else {
        setUser(null);
        setLoading(false);
        if (router.asPath.startsWith("/accounting") || router.asPath.startsWith("/map")) {
          // 重定向到首頁
          router.push({
            pathname: "/",
            query: { message: "請先登入" },
          });
        }
      }
      setLoading(false);
    });

    // 清理監聽器
    return () => unsubscribe();
  }, [auth, router]);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      setUser({
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.displayName,
        avatar: newUser.photoURL,
      });
      setLoginMethod(LoginMethod.Email);
    } catch (error) {
      console.error("Email 登入失敗", error);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      setUser({
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.displayName,
        avatar: newUser.photoURL,
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
      const newUser = result.user;
      setUser({
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.displayName,
        avatar: newUser.photoURL,
      });
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
