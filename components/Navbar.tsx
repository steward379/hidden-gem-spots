// Navbar.tsx
import React, { useState, useEffect } from 'react';
import EmailLogComponent from './EmailLogComponent';
import GoogleLogComponent from './GoogleLogComponent';  

// firebase
import { User, onAuthStateChanged, Auth } from 'firebase/auth';
import firebase from '../utils/firebase';
import { LoginMethod } from '../src/LoginMethod';

// enum LoginMethod {
//   None,
//   Email,
//   Google,
// }

const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(LoginMethod.None);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth as Auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);


  return (
    <div className="navbar-container bg-green-500 text-white p-4">
      <div className="flex items-center space-x-4">
      <h1 className="text-2xl font-bold mb-2">Accounting Wizard</h1>

      {loginMethod === LoginMethod.None && (
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
        )}

      </div>
    </div>
  );
};

export default Navbar;