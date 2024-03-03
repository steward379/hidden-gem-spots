// pages/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithCustomToken , onAuthStateChanged, getAuth, createUserWithEmailAndPassword,  signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter }  from 'next/router';
import { getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import firebaseServices from '../utils/firebase';
const { db, auth } = firebaseServices;
// import { IUser } from '../types/IUser';
import { LoginMethod } from '../LoginMethod';
// import { getToken } from '@clerk/clerk-sdk-node';
import {  getRandomAvatarUrl } from '../utils/randomProfile';
import LoadingIndicator from '@/src/components/LoadingIndicator'; 

// clerk using signInWithCustomToken
import { useAuth as useClerkAuth, useClerk } from "@clerk/nextjs";
import { initializeApp } from "firebase/app";

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
  loaded: boolean;
  setLoginMethod: (method: LoginMethod) => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updatedData: Partial<IUser>) => Promise<void>;
  showLoginAlert : boolean;
  setShowLoginAlert: (show: boolean) => void;
  hasNavigated: boolean; 
  setHasNavigated: (hasNavigated: boolean) => void; 
}>({
  user: null,
  loading: true,
  loginMethod: LoginMethod.None,
  setLoginMethod: () => {},
  loginWithEmail: async () => {},
  signUpWithEmail: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  loaded: false,
  updateUserProfile: async () => {},
  showLoginAlert: false,
  setShowLoginAlert: () => {},
  hasNavigated: false,
  setHasNavigated: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children}) => {
  const [user, setUser] = useState<IUser | null>(null);

  const [loading, setLoading] = useState(true);
  
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(LoginMethod.None);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  // const auth = getAuth();

  const { user: clerkUser } = useClerk();

  const { signOut: clerkSignOut } = useClerk();
  


  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  
  // // clerk

  // const { isSignedIn, user: clerkUser } = useClerk();
  // const firebaseAuth = getAuth();

    // const firebaseAuth = getAuth(firebaseServices);
  const { getToken } = useClerkAuth();


  // useEffect(() => {

  //   const signInWithClerk = async () => {
  //     const token = await getToken({ template: "integration_firebase" });
  //     if (token) {
  //       await signInWithCustomToken(auth, token);
  //       setLoginMethod(LoginMethod.clerk);
  //     }
  //   };

  //   signInWithClerk();
  // }, [getToken]);

  const updateUserProfile = async (updatedData) => {
    if (!user) return;
  
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, updatedData);
  
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedData,
    }));
  };

  // useEffect(() => {
  //   const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
  //     if (firebaseUser) {
  //       const userRef = doc(db, 'users', firebaseUser.uid);
  //       const docSnap = await getDoc(userRef);

  //       let userData: IUser;
  
  //       const randomAvatar = await getRandomAvatarUrl();     
        
  //       const email = clerkUser && clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0 
  //             ? clerkUser.emailAddresses[0].emailAddress 
  //             : firebaseUser.email;
  //       const name = clerkUser && clerkUser.firstName 
  //            ? clerkUser.firstName 
  //            : (firebaseUser.displayName || '第三方會員');

        // if (!docSnap.exists()) {
        // userData = {
        //   uid: firebaseUser.uid,
        //   email: firebaseUser.email,
        //   name: firebaseUser.displayName,
        //   avatar: firebaseUser.photoURL,
        //   following: [],
        //   followers: []
        // };

      //   if (!docSnap.exists()) {
      //     userData = {
      //       uid: firebaseUser.uid,
      //       email: email,
      //       name: name,
      //       avatar: firebaseUser.photoURL || randomAvatar,
      //       following: [],
      //       followers: []
      //     };
      //     await setDoc(userRef, userData);

      //   } else {
      //     userData = docSnap.data() as IUser;
      //   }

      //   setUser(userData);

      // } else {
        // const userRef = doc(db, 'users', firebaseUser.uid);
        // const docSnap = await getDoc(userRef);

        // const randomAvatar = await getRandomAvatarUrl();     

        // const email = clerkUser.emailAddresses[0]?.emailAddress;
        // const name = clerkUser.firstName || "Google 會員";
        // const avatar = clerkUser.imageUrl

        // let userData: IUser;
  
    
        // if (!docSnap.exists()) {
        //   userData = {
        //     uid: firebaseUser.uid,
        //     email: clerkUser.emailAddresses[0]?.emailAddress,
        //     name: clerkUser.firstName  ||  clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] ||'第三方會員',
        //     avatar: clerkUser.imageUrl || randomAvatar,
        //     following: [],
        //     followers: []
        // //   };
        //   await setDoc(userRef, userData);

        // } else {
        //   userData = docSnap.data() as IUser;
        // }

        // setUser(userData);
    
  //       setUser(null);
  //       setLoading(false);
  //       if (router.asPath.startsWith("/accounting") || router.asPath.startsWith("/map")) {
  //         router.push({ pathname: "/home", query: { message: "請先登入" } });
  //       }
              
  //     }

  //     setLoading(false);

  //     setLoaded(true);
  //   });
    
  //     return () => {
  //       unsubscribeAuth();
  //     };

  // }, [router, clerkUser]);

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
      console.error("Email Login failed", error);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      const userRef = doc(db, 'users', newUser.uid);

      const randomAvatar = await getRandomAvatarUrl();

      await setDoc(userRef, {
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.displayName || newUser.email.split('@')[0],
        avatar: newUser.photoURL || randomAvatar,
        following: [],
        followers: []
      });

      setUser({
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.displayName || newUser.email.split('@')[0],
        avatar: newUser.photoURL || randomAvatar,
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

      if (clerkSignOut) {
        await clerkSignOut();
      }  

      await signOut(auth);
      setUser(null);
      setLoginMethod(LoginMethod.None);

      setShowLoginAlert(false);
      setHasNavigated(true); 
    
      router.push('/'); 
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    setLoading(true);

    const signInWithClerk = async () => {
      const token = await getToken({ template: "integration_firebase" });
      if (token) {
        await signInWithCustomToken(auth, token);
      }
    };

    if (clerkUser) {
      signInWithClerk();
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userRef);

        let userData: IUser;
  
        const randomAvatar = await getRandomAvatarUrl();     
        
        const email = clerkUser && clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0 
              ? clerkUser.emailAddresses[0].emailAddress 
              : firebaseUser.email;
        const name = clerkUser && clerkUser.firstName 
            ? clerkUser.firstName 
            : (firebaseUser.displayName || 'Third-party user');
            
        if (!docSnap.exists()) {
          userData = {
            uid: firebaseUser.uid,
            email: email,
            name: name,
            avatar: firebaseUser.photoURL || randomAvatar,
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

        // if ((router.asPath.startsWith("/accounting") || router.asPath.startsWith("/publish-map") || router.asPath.startsWith("/map"))  && !router.asPath.startsWith("/home")) {
        //   router.push({ pathname: "/", query: { message: "請先登入" } });
        // }

        const restrictedPaths = ["/map", "/publish-map"];

        const currentPath = router.pathname;
        if (restrictedPaths.includes(currentPath) && !hasNavigated) {
          setShowLoginAlert(true); 
          setHasNavigated(true)
          router.push("/home"); 
        }
  
      }

      setLoading(false); 

      setLoaded(true);
    });

    return () => unsubscribeAuth();
  }, [router, clerkUser, getToken, hasNavigated]);

   useEffect(() => {
    const handleRouteChange = () => {
      setHasNavigated(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <AuthContext.Provider value={{ user, loading, loaded, loginMethod, showLoginAlert, setShowLoginAlert, hasNavigated, setHasNavigated, 
    setLoginMethod, loginWithEmail, signUpWithEmail, loginWithGoogle, logout,
    updateUserProfile}}>
      {loaded && children}
    </AuthContext.Provider>
  );
};

// Hook 來使用 context
export const useAuth = () => useContext(AuthContext);