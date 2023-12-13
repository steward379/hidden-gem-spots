// EmailLogComponent.tsx
// React Partial Component
import React, { useState } from 'react';
import { Auth, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import firebase from '../utils/firebase'; 
import { LoginMethod } from '../LoginMethod';
import { useAuth } from '../context/AuthContext';
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";

import Modal from './Modal';
// import { useDispatch } from 'react-redux';
// import { setUser, setLoginMethod, LoginMethod } from '../src/slices/userSlice';

const EmailLogComponent  = () => {

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
      // console.log("註冊成功，使用者 ID 是：",user.uid);
      // console.log("註冊成功，使用者 ID 是：",user.uid);
    } catch (error) {
      console.log("註冊失敗", error);
      setErrorMsg("帳號已被使用或信箱有錯、密碼不滿 6 個字");
    }
  };

  const handleSignIn = async () => {
    try {
      await loginWithEmail(email, password);
      setLoginMethod(LoginMethod.Email);
      setErrorMsg("");
      // console.log("登入成功，使用者 ID 是：", user.uid);
    } catch (error) {

      setErrorMsg("帳號或密碼錯誤，或帳號存在其他登入方式");
      console.log("登入失敗", error);
      // setShowModal(true);
    }
  };

  const handleSignOut = async () => {
    try {

      await logout();
      // console.log("登出成功", user.uid);
    } catch (error) {
      console.log("登出失敗", error);
    }
  };

  // demo 帳密
  const fillDemoCredentials = () => {
    setEmail("demo@example.com"); // 將這些值替換為您的示範帳號和密碼
    setPassword("demoPassword");
  };

  return (
    <div className="mb-3 md:mb-0 lg:mb-0">
    {user ? (
        <button className= "text-black p-2 rounded" onClick={handleSignOut}>登出</button>
      ) : (
        <button className="text-black rounded-full border-amber-500 border border-dashed p-1 pl-3 pr-3 lg:ml-2 lg:mr-2" onClick={toggleModal}>登入 / 註冊</button>
      )}
      {showModal && (
      <Modal onClose={() => toggleModal }>
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4 relative">
            <button title="delete" className="text-stone-500 absolute top-2 right-5" onClick={toggleModal}>
              <i className="fas fa-times"></i>
            </button>
            <div className="mt-4">
              <input className="border p-2 w-full text-black rounded-3xl" type="email" placeholder="電子郵件" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="mt-4">
              <input className="border p-2 w-full text-black rounded-3xl" type="password" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
        
            {errorMsg?  (
              <div className="mt-4 text-red-500">
                {errorMsg}
              </div>
            ) : (
              <div className="text-sm mt-4 text-stone-500">
                註冊時 email @ 前預設為 username，密碼需超過 5 個字
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button className="bg-amber-700 text-white p-2 px-3 rounded" onClick={handleSignUp}><i className="fas mr-1 fa-user-plus"></i>註冊</button>
              <button className="bg-amber-500 text-black p-2 px-3 rounded" onClick={handleSignIn}>登入</button>
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
              <i className="fa-solid fa-user-ninja mr-1"><span className="p-2">註冊</span></i>
                <SignUpButton />
              </button>
              <button title="clerk-sign-in" className="bg-black flex-1 flex justify-center items-center text-white p-2 rounded">
              <i className="fa-solid fa-user-ninja mr-1"><span className="p-2">登入</span></i>
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