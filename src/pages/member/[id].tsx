// pages/member/[id].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext';
import Image from 'next/image';

import { getAuth, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseServices from '../../utils/firebase'; 
const { db, auth, storage } = firebaseServices; 
import { doc, updateDoc } from 'firebase/firestore';

const MemberPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, logout, loading } = useAuth();

  const [ name, setName] = useState(null);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/');
      return;
    }

    if (user && user.uid !== id) {
      console.error('Access denied. User ID does not match.');
      router.push('/');
      return;
    }

    setName(user.name);
    setAvatar(user.avatar);
  }, [user, loading, id, router]);

  const handleNameChange = async (newName) => {
    const userRef = doc(db, 'users', id as string);
    await updateDoc(userRef, { name: newName });
    updateProfile(getAuth().currentUser, { displayName: newName });
    setName(newName);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    const avatarRef = ref(storage, `avatars/${id}`);
    await uploadBytes(avatarRef, file);
    const avatarURL = await getDownloadURL(avatarRef);
    const userRef = doc(db, 'users', id as string);
    await updateDoc(userRef, { avatar: avatarURL });
    updateProfile(getAuth().currentUser, { photoURL: avatarURL });
    setAvatar(avatarURL);
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>No user found.</p>;

  return (
    <div>
      <h1 className="mb-5">會員中心</h1>
      <Image className="mb-5" src={user.avatar} width="100" height="100" style={{ borderRadius: "100%"}} />
      <p>歡迎，{name}</p>
      {/* <p>會員 ID: {user.id}</p> */}
      <p>{user.email}</p>
      <div> <input type="file" onChange={handleAvatarChange} /></div>
      <div>
        <label> 更改名稱 </label>
        <input
            className="text-black"
            type="text"
            defaultValue={user.name}
            onBlur={(e) => handleNameChange(e.target.value)}
        />
     </div>
      <button className="mt-10" onClick={() => getAuth().signOut()}>登出</button>
    </div>
  );
};

export default MemberPage;