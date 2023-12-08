// member/[userId].tsx
import { useEffect, useState, useRef  } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
// auth
import { useAuth } from '@/src/context/AuthContext';
// firebase
import { getAuth, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc,  getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import firebaseServices from '@/src/utils/firebase'; 
// notifications hook
import useAuthListeners  from '@/src/hooks/useAuthListeners';
// components
import DropImagePreview from '@/src/components/DropImagePreview';
import LoadingIndicator from '@/src/components/LoadingIndicator';

import RainbowButtonModule from '@/src/styles/rainbowButton.module.css';

const { db, storage } = firebaseServices; 

type AuthListener = (message: string) => void | {};

const MemberPage = () => {
  const router = useRouter();
  const { userId } = router.query;

  const { user, logout, loading } = useAuth();
  const { updateUserProfile } = useAuth();

  // edit profile
  const [isEditing, setIsEditing] = useState(false);
  // name 
  const [name, setName] = useState(null);
  const [tempName, setTempName] = useState('');
  // avatar
  const [avatar, setAvatar] = useState(null);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [userDetails, setUserDetails] = useState({});
  const [isFollowingState, setIsFollowingState] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const handleNewNotification = (message) => {
    setNotifications((prevNotifications) => {
      // 檢查新通知是否已經在列表中
      if (prevNotifications.includes(message)) {
        return prevNotifications;
      }
      return [...prevNotifications, message];
    });
    return {}; // 避免型別錯誤
  };

  // useAuthListeners(handleNewNotification);

  const checkForNewFollowersRef = useRef(null);
  const checkForNewMapsRef = useRef(null);

  useAuthListeners(handleNewNotification, (fn) => checkForNewFollowersRef.current = fn, 
                                          (fn) => checkForNewMapsRef.current = fn);
  const sendNotifyBtn = async () =>{
    if (checkForNewFollowersRef.current) {
      await checkForNewFollowersRef.current();
    }
    if (checkForNewMapsRef.current) {
      await checkForNewMapsRef.current();
    }
  }

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
      // alert('找不到會員資料');
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


  const handleNameChange = async () => {
  // const handleNameChange = async (newName) => {
    if (tempName) {
      // await handleNameChange(tempName);
      try {
      const userRef = doc(db, 'users', userId as string);
      await updateDoc(userRef, { name: tempName });
      updateProfile(getAuth().currentUser, { displayName: tempName });
      
      setMemberData(prev => ({ ...prev, name: tempName }));

      updateUserProfile({ name: tempName });
      } catch (error) {
        // alert('更新名稱失敗');
        console.log(error);
      }
      setTempName('');
    }
    // const userRef = doc(db, 'users', userId as string);
    // await updateDoc(userRef, { name: newName });
    // updateProfile(getAuth().currentUser, { displayName: newName });
    // setMemberData(prev => ({ ...prev, name: newName })); 

    // setName(newName);
  
  };

  const handleAvatarChange = async () => {
  // const handleAvatarChange = async (files) => {
    // if (files.length > 0) {
    if (tempAvatar) {
      try {
      // const file = files[0];
        const avatarRef = ref(storage, `avatars/${userId}`);
        // await uploadBytes(avatarRef, file);
        await uploadBytes(avatarRef, tempAvatar);
        const avatarURL = await getDownloadURL(avatarRef) 

        const userRef = doc(db, 'users', userId as string);
        await updateDoc(userRef, { avatar: avatarURL });

        updateProfile(getAuth().currentUser, { photoURL: avatarURL });
        
        setMemberData(prev => ({ ...prev, avatar: avatarURL }));

        updateUserProfile({ avatar: avatarURL });

      } catch (error) {
        // alert('更新頭像失敗');
        console.log(error);
      }
      setTempAvatar(null);
    } 
  };

  const handleSaveChanges = async () => {
    await handleNameChange();
    await handleAvatarChange();

    setIsEditing(false);
  };

  useEffect(() => {
    if (user && memberData) {
      setIsFollowingState(user.following.includes(memberData.id));
    }
  }, [user, memberData]);

  useEffect(() => {
    if (userId) {
      fetchMemberData(userId);
    }
  }, [userId]);

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
    setMemberData(prevData => ({
      ...prevData,
      followers: prevData.followers.filter((id) => id !== user.uid) 
    }));
    setIsFollowingState(false);
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  const toggleEditing = () => {
    setIsEditing(!isEditing);

    setTempName('');
    setTempAvatar(null);
  }

  const isCurrentlyFollowing = memberData.followers.includes(user?.uid);

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
                <LazyLoadImage effect="blur"
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
    <div className="container mx-auto p-4 flex-column">
      <h1 className="w-full text-2xl font-bold mb-5 ">會員中心</h1>
      <div className="lg:flex flex-col md:flex-row space-y-6 md:space-y-0">
        <div className="flex-2 md:mb-6 lg:mb-0 w-full bg-white border-lg rounded-3xl p-7">
          <div className="flex flex-col justify-between space-y-3">
            <div className="flex-col items-center justify-center space-y-3">
              <div className="rotate-flip w-24 h-24 bg-yellow-500 rounded-full">
                <LazyLoadImage effect="blur"className="w-24 h-24 mb-5 rounded-full matrix-flip" 
                    alt="profile-image" 
                    src={memberData.avatar ? memberData.avatar : '/images/marker-icon.png' } width="100" height="100" />
              </div>
              <h3 className="text-lg font-medium px-2">
                  {user && user.uid === userId ? <span>歡迎，</span> : <span>你正在造訪：</span>} 
                  {memberData.name}
              </h3>
            </div>
            <div>
              <Link href={`/user-maps/${userId}`} className="flex items-center">
                {/* @ts-ignore */}
                <button title="rainbow-map" className={`${RainbowButtonModule.rainbowButton} mt-2 mb-3`} >
                  <span>查看地圖</span>
                </button>
              </Link>
              {/* lemmin codepen */}
            </div>
            <div>
            { user && user.uid !== userId && memberData.id &&
              <button className={` ${isCurrentlyFollowing  ? 'bg-gray-300' : 'bg-green-300'} transition-all button  text-black rounded-lg p-2`}
                      onClick={() => isFollowing(memberData.id) ? unFollowUser(memberData.id) : followUser(memberData.id)}>
                {isCurrentlyFollowing  ? '取消追蹤' : '追蹤'}
              </button>
            }
            </div>
            {isCurrentUser && (
              <div className="space-y-4">
                <h4 className="text-md font-medium">您的帳號信箱</h4>
                <div className="flex items-center flex-grow-0 flex-wrap">
                  <p className="border rounded-3xl border-orange-500 p-3 max-w-sm break-words">
                    {user.email}
                  </p>
                </div>
                <div>
                  <button className={`${!isEditing  ? 'bg-green-300 text-teal-800' : 'bg-gray-300 text-amber-700'}  font-medium py-2 px-4 rounded w-32`}
                          onClick={toggleEditing}>
                  {!isEditing  ? '編輯個人檔案' : '取消編輯' }
                  </button>
                </div>
                {isEditing && (
                <>
                <div className="mb-4"> 
                  <label className="block mb-2">更改圖片</label>
                  {/* <ImageUploader onImageUpload={handleAvatarChange} /> */}
                  <div className="mb-4"> 
                    {/* <DropzoneImage onFileUploaded={handleAvatarChange} />
                    */}
                    <div className="ml-2 ">
                      <DropImagePreview onFileUploaded={(file)=> setTempAvatar(file)} circle={true} />
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block mb-2">更改名稱</label>
                  <input
                    title="name-change"
                    className="p-2 border border-gray-300 rounded text-black"
                    type="text"
                    defaultValue={tempName || user.name}
                    onBlur={(e) => setTempName(e.target.value)}
                  />
                </div>
                <button className="bg-blue-500 text-white py-2 px-4 rounded" 
                        onClick={handleSaveChanges}>保存變更</button>
              </>
                )}
                <div className="mb-4">
                  <button className="bg-red-500 text-white py-2 px-4 rounded" 
                      onClick={() => getAuth().signOut()}>登出</button>
                </div>
              </div>
              
            )}
          </div>
        </div>
        <div className="flex-2 lg:flex lg:space-x-6 w-full md:flex">
          <div className="flex-1 w-full md:w-1/2 lg:ml-5 ml-0 mb-6 md:mb-0 lg:mb-0 bg-teal-50 rounded-3xl p-6">
            {renderFollowList(memberData.following, '已跟隨')}
          </div>
          <div className="flex-1 w-full md:w-1/2 lg:ml-5 md:ml-5 ml-0  md:mb-0 lg:mb-0 bg-sky-50 rounded-3xl p-6 ">
            {renderFollowList(memberData.followers, '追蹤')}
          </div>
        </div>
      </div>
      <div>

    {isCurrentUser && (
    <div>
      {/* <button className="bg-blue-500 text-white py-2 px-4 rounded" onClick={sendNotifyBtn}>接收通知</button> */}
        <div className="mt-4 mb-4 notifications space-y-2">
          {notifications.map((notification, index) => (
            <div 
              dangerouslySetInnerHTML={{ __html: notification }}
              key={index} 
              className="notification rounded-full p-4 border border-gray-200 mb-4 shadow-sm bg-white text-gray-800"
            >
              {/* {notification} */}
            </div>
          ))}
        </div>
    </div>
    )}
      </div>
    </div>
  );  
};

export default MemberPage;