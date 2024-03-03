// EmailLogComponent.tsx
// React Partial Component
import React, { useState } from 'react';
// import { Auth, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
// import firebase from '../utils/firebase'; 
import { LoginMethod } from '../LoginMethod';
import { useAuth } from '../context/AuthContext';
import { SignInButton, SignUpButton } from "@clerk/nextjs";
// import { SignOutButton } from "@clerk/nextjs";
import { useTranslation } from 'next-i18next';

import Modal from './Modal';
// import { useDispatch } from 'react-redux';
// import { setUser, setLoginMethod, LoginMethod } from '../src/slices/userSlice';

const EmailLogComponent  = () => {
  const { t } = useTranslation('common'); 
  const { user, loginWithEmail, signUpWithEmail, logout, setLoginMethod } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const toggleModal = () => {
      setShowModal(!showModal);
      setErrorMsg('');
  };

  const handleSignUp = async () => {
    try {
      await signUpWithEmail(email, password);
      setLoginMethod(LoginMethod.Email);
      setErrorMsg('');
    } catch (error) {
      console.log("Sign up Failed", error);
      setErrorMsg(t('Sign-up-error'));
    }
  };

  const handleSignIn = async () => {
    try {
      await loginWithEmail(email, password);
      setLoginMethod(LoginMethod.Email);
      setErrorMsg("");
    } catch (error) {
      setErrorMsg(t('Login-error'));
      console.error("Login Failed", error);
      // setShowModal(true);
    }
  };

  const handleSignOut = async () => {
    try {

      await logout();
    } catch (error) {
      console.error("Logout Failed", error);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("demo@example.com"); 
    setPassword("demoPassword");
  };

  return (
    <div className="mb-3 md:mb-0 lg:mb-0">
    {user ? (
        <button className= "text-black p-2 rounded" onClick={handleSignOut}>{t('logout')}</button>
      ) : (
        <button className="text-black rounded-full border-amber-500 border border-dashed p-1 pl-3 pr-3 lg:ml-2 lg:mr-2" onClick={toggleModal}>
          {t('login-or-sign-up')}
        </button>
      )}
      {showModal && (
      <Modal onClose={() => toggleModal }>
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4 relative">
            <button title="delete" className="text-stone-500 absolute top-2 right-5" onClick={toggleModal}>
              <i className="fas fa-times"></i>
            </button>
            <div className="mt-4">
              <input className="border p-2 w-full text-black rounded-3xl" type="email" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="mt-4">
              <input className="border p-2 w-full text-black rounded-3xl" type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
        
            {errorMsg?  (
              <div className="mt-4 text-red-500">
                {errorMsg}
              </div>
            ) : (
              <div className="text-sm mt-4 text-stone-500">
                 {t('sign-up-hint')} 
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button className="bg-amber-700 text-white p-2 px-3 rounded" onClick={handleSignUp}><i className="fas mr-1 fa-user-plus"></i>
                {t('sign-up')}
                </button>
              <button className="bg-amber-500 text-black p-2 px-3 rounded" onClick={handleSignIn}>{t('login')}</button>
              <button className="bg-gray-300 text-black p-2 rounded " onClick={fillDemoCredentials}>
                Demo Account
              </button>
            </div>
            <hr className="mt-4 mb-4"></hr>
            <div className="flex justify-center items-center space-x-3 space-y-3 mb-6">
              <i className="fa-brands fa-2xl fa-ethereum mt-2.5"></i>
              <i className="fa-brands fa-lg fa-discord m-0"></i>
              <i className="fa-brands fa-lg fa-github m-0"></i>
              <i className="fa-brands fa-lg fa-facebook m-0"></i>
              <i className="fa-brands fa-lg fa-microsoft m-0"></i>
              <i className="fa-brands fa-lg fa-line m-0 ml-[-10px]"></i>
              <i className="fa-brands fa-lg fa-tiktok m-0"></i>
              <i className="fa-solid fa-lg fa-n"></i>
            </div>
            <div className="flex justify-center items-center mt-4 gap-2">
              <button title="clerk-sign-up" className="bg-red-500 flex-1 flex justify-center items-center text-white p-2 rounded" >
                <i className="fa-solid fa-user-ninja mr-1"><span className="p-2"></span></i>
                <SignUpButton />
              </button>
              <button title="clerk-sign-in" className="bg-black flex-1 flex justify-center items-center text-white p-2 rounded">
                <i className="fa-solid fa-user-ninja mr-1"><span className="p-2"></span></i>
                <SignInButton />
              </button>
            </div>
          </div>
        </div>
      </Modal>
      )}
    </div>
  );
};

export default EmailLogComponent;