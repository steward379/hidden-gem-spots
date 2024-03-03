// SSR - member/[userId].tsx
import { useEffect, useState, useRef  } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useAuth } from '@/src/context/AuthContext';
import { getAuth, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc,  getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs   } from 'firebase/firestore';
import firebaseServices from '@/src/utils/firebase'; 
import useAuthListeners  from '@/src/hooks/useAuthListeners';
import DropImagePreview from '@/src/components/DropImagePreview';
import LoadingIndicator from '@/src/components/LoadingIndicator';

import RainbowButtonModule from '@/src/styles/rainbowButton.module.css';
import { useTranslation } from 'next-i18next';

const { db, storage } = firebaseServices; 

type AuthListener = (message: string) => void | {};

export async function getServerSideProps(context) {
  const { userId } = context.params;
  const db = firebaseServices.db;

  const memberRef = doc(db, 'users', userId);
  const memberSnap = await getDoc(memberRef);

  if (memberSnap.exists()) {
    const memberData = memberSnap.data();
    if (memberData.lastNotificationCheck && memberData.lastNotificationCheck.toDate) {
      memberData.lastNotificationCheck = memberData.lastNotificationCheck.toDate().toISOString();
    }
        
    return {
      props: {
        initialMemberData: {
          id: memberRef.id,
          ...memberData
        }
      }
    };
  } else {
    return {
      props: {
        initialMemberData: null
      }
    };
  }
} 

const MemberPage = ({  initialMemberData }) => {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // const [newEmail, setNewEmail] = useState('');
  // const handleEmailChange = async () => {
  //   const auth = getAuth();
  //   const user = auth.currentUser;
  
  //   if (user) {
  //     try {
  //       await updateEmail(user, newEmail);
  //       await sendEmailVerification(user);
  //       alert('請檢查您的電子郵件以驗證新的電子郵件地址。');
  //     } catch (error) {
  //       console.error('更新電子郵件失敗:', error);
  //       alert('更新電子郵件失敗。');
  //     }
  //   }
  // };

  // Algolia

  const handleSearch = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("name", "==", searchQuery));
      const querySnapshot = await getDocs(q);
  
      const results = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
  
      setSearchResults(results);
    } catch (error) {
      console.error("search error:", error);
    }
  };

   const renderSearchResults = () => {
    return searchResults.map((user) => (
      <Link href={`/member/${user.id}`} key={user.id}>
        <div key={user.id} className="flex items-center space-x-4 mb-4">
          <LazyLoadImage
            effect="blur"
            src={user.avatar}
            alt={user.name}
            width="50"
            height="50"
            className="rounded-full"
          />
          <span>{user.name}</span>
        </div>
      </Link>
    ));
  };

  const router = useRouter();
  const { userId } = router.query;

  const { user, logout, loading } = useAuth();
  const { updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempAvatar, setTempAvatar] = useState(null);

  const [userDetails, setUserDetails] = useState({});
  const [isFollowingState, setIsFollowingState] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const handleNewNotification = (message) => {
    setNotifications((prevNotifications) => {
      if (prevNotifications.includes(message)) {
        return prevNotifications;
      }
      return [...prevNotifications, message];
    });
    return {}; 
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

  const [memberData, setMemberData] = useState(
    // {
    // id: null,
    // name: null,
    // avatar: null,
    // following: [],
    // followers: []
  // }
  initialMemberData);

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
      console.log('member data not found');
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

  const renderFollowList = (list, title) => {

    if (!Array.isArray(list)) {
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
    <div className="container mx-auto p-4 flex-column min-h-screen"> 
      <h1 className="w-full text-2xl font-bold mb-5 ">{t('member-ceneter')}</h1>
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
                  {user && user.uid === userId ? <span>{t('welcome')}</span> : <span>{t('welcome-visit')}</span>} 
                  {memberData.name}
              </h3>
            </div>
            <div>
              <Link href={`/user-maps/${userId}`} className="flex items-center">
                <button title="rainbow-map" className={`${RainbowButtonModule.rainbowButton} mt-2 mb-3`} >
                     <button className="bg-red-500 rounded-full text-white font-bold py-2 px-10 text-sm hover:bg-blue-600 my-2">
                        {t('member-map')}
                    </button>
                </button>
              </Link>
            </div>
            <div>
            { user && user.uid !== userId && memberData.id &&
              <button className={` ${isCurrentlyFollowing  ? 'bg-gray-300' : 'bg-green-300'} transition-all button  text-black rounded-lg p-2`}
                      onClick={() => isFollowing(memberData.id) ? unFollowUser(memberData.id) : followUser(memberData.id)}>
                {isCurrentlyFollowing  ? t('cancel-follow') : t('follow')}
              </button>
            }
            </div>
            {isCurrentUser && (
              <div className="space-y-4">
                <h4 className="text-md font-medium">{t('member-owned-email')}</h4>
                <div className="flex items-center flex-grow-0 flex-wrap">
                  <p className="border rounded-3xl border-orange-500 p-3 max-w-sm break-words">
                    {user.email}
                  </p>
                </div>
                <div>
                  <button className={`${!isEditing  ? 'bg-green-300 text-teal-800' : 'bg-gray-300 text-amber-700'}  font-medium py-2 px-4 rounded w-32`}
                          onClick={toggleEditing}>
                  {!isEditing  ? t('edit-profile'): t('cancel-edit-profile') }
                  </button>
                </div>
                {isEditing && (
                <>
                <div className="mb-4"> 
                  <label className="block mb-2">{t('change-photo')}</label>
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
                  <label className="block mb-2">{t('change-username')}</label>
                  <input
                    title="name-change"
                    className="p-2 border border-gray-300 rounded text-black"
                    type="text"
                    defaultValue={tempName || user.name}
                    onBlur={(e) => setTempName(e.target.value)}
                  />
                </div>
                <button className="bg-blue-500 text-white py-2 px-4 rounded" 
                        onClick={handleSaveChanges}>{t('save-profile-edit')}</button>
              </>
                )}
                <div className="mb-4">
                  <button className="bg-red-500 text-white py-2 px-4 rounded" 
                      onClick={() => getAuth().signOut()}>{t('logout')}</button>
                </div>
              </div>
              
            )}
          </div>
        </div>
        <div className="flex-2 lg:flex lg:space-x-6 w-full md:flex">
          <div className="flex-1 w-full md:w-1/2 lg:ml-5 ml-0 mb-6 md:mb-0 lg:mb-0 bg-teal-50 rounded-3xl p-6">
            {renderFollowList(memberData.following, t('already-follow'))}
          </div>
          <div className="flex-1 w-full md:w-1/2 lg:ml-5 md:ml-5 ml-0  md:mb-0 lg:mb-0 bg-sky-50 rounded-3xl p-6 ">
            {renderFollowList(memberData.followers, t('followed-by'))}
          </div>
        </div>

      </div>
      <div>
      <div className="mt-4">
        <input
          type="text"
          placeholder={t('search-user')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 p-2 rounded"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 ml-2 rounded"
        >
          {t('search')}
        </button>
      </div>

      {/* 搜索結果 */}
      <div className="mt-4">
        {renderSearchResults()}
      </div>

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