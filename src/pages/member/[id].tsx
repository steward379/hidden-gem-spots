// pages/member/[id].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { getAuth, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseServices from '../../utils/firebase'; 
const { db, auth, storage } = firebaseServices; 
import { doc, updateDoc } from 'firebase/firestore';

const MemberPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);

  const handleNameChange = async (newName) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, { name: newName });
    updateProfile(auth.currentUser, { displayName: newName });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const avatarRef = ref(storage, `avatars/${user.id}`);

    await uploadBytes(avatarRef, file);
    const avatarURL = await getDownloadURL(avatarRef);

    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, { avatar: avatarURL });
    updateProfile(auth.currentUser, { photoURL: avatarURL });
  };

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      // 如果用戶未登入，重定向到首頁或登入頁
      router.push('/');
    } else {
      // 模擬從 API 或 Firebase 獲取會員資料
      // 這裡只是假設用戶已經通過驗證並且 id 是有效的
      setUser({ id: currentUser.uid, name: '會員名稱', email: currentUser.email });
    }
  }, [id, router]);

  if (!user) {
    return <p>Loading...</p>; // 或一個加載指示器
  }

  return (
    <div>
      <h1>會員中心</h1>
      <p>歡迎，{user.name}</p>
      {/* <p>會員 ID: {user.id}</p> */}
      <p>Email: {user.email}</p>
      <div><input type="file" onChange={handleAvatarChange} /></div>
      <div>
        <input
            className="text-black"
            type="text"
            defaultValue={user.name}
            onBlur={(e) => handleNameChange(e.target.value)}
        />
     </div>
      <button onClick={() => getAuth().signOut()}>登出</button>
    </div>
  );
};

export default MemberPage;