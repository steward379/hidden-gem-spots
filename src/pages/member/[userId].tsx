// pages/member/[userId].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext';
import Image from 'next/image';
import ImageUploader from '@/src/components/ImageUploader';
import Link from 'next/link';

import { getAuth, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseServices from '../../utils/firebase'; 
const { db, auth, storage } = firebaseServices; 
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const MemberPage = () => {
  const router = useRouter();

  const { userId } = router.query;
  
  const { user, logout, loading } = useAuth();

  const [name, setName] = useState(null);
  const [avatar, setAvatar] = useState(null);

  const [userDetails, setUserDetails] = useState({});

  const [isFollowingState, setIsFollowingState] = useState(false);

  const [memberData, setMemberData] = useState({
    id: null,
    name: null,
    avatar: null,
    following: [],
    followers: []
  });

  const fetchMemberData = async (memberId) => {
    const memberRef = doc(db, 'users', memberId);
    const memberSnap = await getDoc(memberRef);

    if (memberSnap.exists()) {
      const data = memberSnap.data();
      setMemberData({
        id: memberRef.id,
        name: data.name,
        avatar: data.avatar,
        following: data.following || [],
        followers: data.followers || []
      });
    } else {
      console.log('找不到會員資料');
    } 
  };

  useEffect(() => {
    const fetchDetails = async (users) => {
      const details = {};
      for (const userId of users) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          details[userId] = userSnap.data();
        }
      }
      return details;
    };
  
    fetchDetails(memberData.following).then((details) => setUserDetails((prev) => ({ ...prev, ...details })));
    fetchDetails(memberData.followers).then((details) => setUserDetails((prev) => ({ ...prev, ...details })));
  }, [memberData.following, memberData.followers]);

  const handleNameChange = async (newName) => {
    const userRef = doc(db, 'users', userId as string);
    await updateDoc(userRef, { name: newName });
    updateProfile(getAuth().currentUser, { displayName: newName });
    setMemberData(prev => ({ ...prev, name: newName })); 

    setName(newName);
  };

  useEffect(() => {
    if (user && memberData) {
      setIsFollowingState(user.following.includes(memberData.id));
    }
  }, [user, memberData]);


  const handleAvatarChange = async (files) => {
    if (files.length > 0) {
      const file = files[0];
      const avatarRef = ref(storage, `avatars/${userId}`);
      await uploadBytes(avatarRef, file);
      const avatarURL = await getDownloadURL(avatarRef);

      const userRef = doc(db, 'users', userId as string);
      await updateDoc(userRef, { avatar: avatarURL });

      updateProfile(getAuth().currentUser, { photoURL: avatarURL });
      setMemberData(prev => ({ ...prev, avatar: avatarURL }));

      setAvatar(avatarURL);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMemberData(userId);
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <span className="block text-black mb-2">載入中...</span>
          <div className="progress-bar w-32 h-2 bg-gray-200 relative">
            <div className="progress w-0 h-2 bg-black absolute border rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // 檢查是否為當前用戶
  const isCurrentUser = user && user.uid === userId; 

  const isFollowing = (targetUserId) => {
    return memberData.followers.includes(user.uid);
    // return user && user.following && user.following.includes(targetUserId);
  };  

  const followUser = async (targetUserId) => {
    if (!user || !targetUserId || isFollowing(targetUserId)) {
      console.error('Invalid action');
      return;
    }

    const currentUserRef = doc(db, 'users', user.uid);
    const targetUserRef = doc(db, 'users', targetUserId);
  
    await updateDoc(currentUserRef, {
      following: arrayUnion(targetUserId),
    });
  
    await updateDoc(targetUserRef, {
      followers: arrayUnion(user.uid),
    });

    // 更新本地狀態
    setMemberData(prevData => ({
      ...prevData,
      followers: [...prevData.followers, user.uid] 
    }));

    setIsFollowingState(true); 
  };

  const unFollowUser = async (targetUserId) => {
    if (!user || !targetUserId || !isFollowing(targetUserId)) {
      console.error('Invalid action');
      return;
    }  

    const currentUserRef = doc(db, 'users', user.uid);
    const targetUserRef = doc(db, 'users', targetUserId);
  
    await updateDoc(currentUserRef, {
      following: arrayRemove(targetUserId),
    });
  
    await updateDoc(targetUserRef, {
      followers: arrayRemove(user.uid),
    });

    // 更新本地狀態
    setMemberData(prevData => ({
      ...prevData,
      followers: prevData.followers.filter((id) => id !== user.uid) 
    }));

    setIsFollowingState(false);
  };

  const renderFollowButton = () => {
    if (!user || user.uid === userId || !memberData.id) return null;

    const isCurrentlyFollowing = memberData.followers.includes(user.uid);
  
    return (
      <button className="m-5 bg-amber-500 button text-black rounded-lg p-2" 
              onClick={() => isFollowing(memberData.id) ? unFollowUser(memberData.id) : followUser(memberData.id)}>
        {isCurrentlyFollowing  ? '取消追蹤' : '追蹤'}
      </button>
    );
  };

  // 渲染追蹤和被追蹤列表
  const renderFollowList = (list, title) => {

    if (!Array.isArray(list)) {
      // 可以在這裡顯示一個適當的消息，例如 "沒有追蹤者" 或 "沒有追蹤中的用戶"
      return <div>No {title}</div>;
    }
    return (
      <div>
        <h3 className="text-lg font-semibold"><span> {list.length} 個 </span> {title} </h3>
        <div className="flex flex-wrap">
          {list.map((userId) => (
            userDetails[userId] && (
              <Link href={`/member/${userId}`} key={userId} className="flex items-center m-2">
                <Image 
                  src={userDetails[userId].avatar} 
                  alt={userDetails[userId].name} 
                  width="50" 
                  height="50" 
                  className="rounded-full w-12 h-12 cursor-pointer"
                />
                <span className="ml-2 text-sm font-medium">{userDetails[userId].name}</span>
              </Link>
            )
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-5">會員中心</h1>
      {memberData.avatar && (
        <Image className="w-24 h-24 mb-5 rounded-full" alt="profile-image" src={memberData.avatar} width="100" height="100" />
      )}
    
      <h3 className="mb-4 text-lg font-semibold">
        {user && user.uid === userId ? <span>歡迎，</span> : <span>你正在造訪：</span>} 
        {memberData.name}
      </h3>
      <Link href={`/user-maps/${userId}`} className="flex items-center">
        <button className="mb-4 bg-blue-500 text-white py-2 px-4 rounded" >
          查看地圖
        </button>
      </Link>
  
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
      {renderFollowButton()}
      {renderFollowList(memberData.following, '追蹤中')}
      {renderFollowList(memberData.followers, '追蹤者')}
  </div>
  );
};

export default MemberPage;