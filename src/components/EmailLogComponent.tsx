
import React, { useState } from 'react';
import { Auth, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import firebase from '../utils/firebase'; 
import { LoginMethod } from '../LoginMethod';
// import { useDispatch } from 'react-redux';
// import { setUser, setLoginMethod, LoginMethod } from '../src/slices/userSlice';

interface Props {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setLoginMethod: React.Dispatch<React.SetStateAction<LoginMethod>>;
  LoginMethod: typeof LoginMethod;
}

const EmailLogComponent: React.FC<Props> = ({ user, setUser, setLoginMethod, LoginMethod }) => {

  // const dispatch = useDispatch();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const toggleModal = () => {
      setShowModal(!showModal);
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebase.auth as Auth, email, password);
      const newUser = userCredential.user as User;

      setUser(newUser);
      setShowModal(false);
      setLoginMethod(LoginMethod.Email);
      setErrorMsg("");

      // dispatch(setUser(user));
      // dispatch(setLoginMethod(LoginMethod.Email));
      
      console.log("註冊成功，使用者 ID 是：", newUser.uid);

    } catch (error) {
      
      console.log("註冊失敗", error);

    }
  };

  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(firebase.auth as Auth, email, password);
      const newUser = userCredential.user as User;

      setUser(newUser);
      setShowModal(false)
      setLoginMethod(LoginMethod.Email);
      setErrorMsg("");

      console.log("登入成功，使用者 ID 是：", newUser.uid);
    } catch (error) {

      setErrorMsg("帳號或密碼錯誤，或帳號存在其他登入方式");
      console.log("登入失敗", error);
    }
  };

  const handleSignOut = async () => {
    try {

      await signOut(firebase.auth as Auth);
      
      setLoginMethod(LoginMethod.None);
      
      setUser(null);
      
      console.log("登出成功");
    } catch (error) {
      console.log("登出失敗", error);
    }
  };

  return (
    <div>
    {user ? (
        <button className= "text-white p-2 rounded" onClick={handleSignOut}>登出</button>
      ) : (
        <button className="text-white p-2 rounded" onClick={toggleModal}>登入 / 註冊</button>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/6 relative">
            <button className="text-red-500 absolute top-2 right-5" onClick={toggleModal}> [ ✖️ ]</button>
            <div className="mt-4">
              <input className="border p-2 w-full text-black rounded" type="email" placeholder="電子郵件" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="mt-4">
              <input className="border p-2 w-full text-black rounded" type="password" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="mt-4 text-red-500">
              {errorMsg}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="bg-green-500 text-white p-2 rounded" onClick={handleSignUp}>註冊</button>
              <button className="bg-blue-500 text-white p-2 rounded" onClick={handleSignIn}>登入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogComponent;