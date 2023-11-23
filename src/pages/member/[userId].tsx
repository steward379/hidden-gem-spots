// pages/member/[id].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext';
import Image from 'next/image';
import ImageUploader from '@/src/components/ImageUploader';

import { getAuth, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseServices from '../../utils/firebase'; 
const { db, auth, storage } = firebaseServices; 
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const MemberPage = () => {
  const router = useRouter();

  const { userId } = router.query;
  
  const { user, logout, loading } = useAuth();

  const [ id, setId] = useState(null);
  const [ name, setName] = useState(null);
  const [avatar, setAvatar] = useState(null);

  const fetchMemberData = async (memberId) => {
    const memberRef = doc(db, 'users', memberId);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      const memberData = memberSnap.data();
      setId(memberData.id);
      setName(memberData.name);
      setAvatar(memberData.avatar);
    } else {
      console.log('找不到會員資料');
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!user && userId) {
      fetchMemberData(userId);
      return;
    }

    if (user) {
      if (user.uid === userId) {
        setName(user.name);
        setAvatar(user.avatar);
      } else if (userId) {
        fetchMemberData(userId);
      }
    }

  }, [user, loading, userId]);

  const handleNameChange = async (newName) => {
    const userRef = doc(db, 'users', userId as string);
    await updateDoc(userRef, { name: newName });
    updateProfile(getAuth().currentUser, { displayName: newName });
    setName(newName);
  };

  const handleAvatarChange = async (files) => {
    if (files.length > 0) {
      const file = files[0];
      const avatarRef = ref(storage, `avatars/${userId}`);
      await uploadBytes(avatarRef, file);
      const avatarURL = await getDownloadURL(avatarRef);

      const userRef = doc(db, 'users', userId as string);
      await updateDoc(userRef, { avatar: avatarURL });

      updateProfile(getAuth().currentUser, { photoURL: avatarURL });
      setAvatar(avatarURL);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>No user found.</p>;


// 檢查是否為當前用戶
  const isCurrentUser = user && user.uid === userId; 

  return (
    <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-5">會員中心</h1>
    {avatar && (
      <Image className="mb-5 rounded-full" alt="profile-image" src={avatar} width="100" height="100" />
    )}
  
    <h3 className="mb-4 text-lg font-semibold">
      {isCurrentUser ? <span>歡迎，</span> : <span>你正在造訪：</span>} 
      {name}
    </h3>
  
    <button className="mb-4 bg-blue-500 text-white py-2 px-4 rounded" onClick={() => router.push(`/user-maps/${userId}`)}>
      查看地圖
    </button>
  
    {isCurrentUser && (
      <>
        <h4 className="mb-4 text-md">{user.email}</h4>
        <div className="mb-4"> 
          <ImageUploader onImageUpload={handleAvatarChange} />
        </div>
        <div className="mb-4">
          <label className="block mb-2">更改名稱</label>
          <input
            title="name-change"
            className="p-2 border border-gray-300 rounded text-black"
            type="text"
            defaultValue={user.name}
            onBlur={(e) => handleNameChange(e.target.value)}
          />
        </div>
        <button className="bg-red-500 text-white py-2 px-4 rounded" onClick={() => getAuth().signOut()}>登出</button>
      </>
    )}
  </div>
  );
};

export default MemberPage;