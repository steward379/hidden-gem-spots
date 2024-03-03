import { useEffect, useCallback } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import firebaseServices from '../utils/firebase';
import { doc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';

const useAuthListeners = (
  handleNewNotification = null,
  setCheckForNewFollowers= null,
  setCheckForNewMaps=null,
) => {
  const { user } = useAuth();
  const { db } = firebaseServices;


  const isOnline = () => {
    return navigator.onLine;
  };

  const checkForNewFollowers = useCallback(async () => {
    if (!user) return;
  
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const lastFollowers = userData?.lastFollowers || [];
      const currentFollowers = userData?.followers || [];
  
      const newFollowers = currentFollowers.filter(followerId => !lastFollowers.includes(followerId));
      if (newFollowers.length > 0) {
        for (const followerId of newFollowers) {
          const followerDoc = await getDoc(doc(db, 'users', followerId));
          if (followerDoc.exists()) {
            const followerData = followerDoc.data();
            if (handleNewNotification && typeof handleNewNotification === 'function') {
              handleNewNotification(`<a href='/member/${followerId}'>${followerData.name} 開始追蹤你了</a>`);
            }
          }
        }
  
        await updateDoc(doc(db, 'users', user.uid), {
          lastFollowers: currentFollowers
        });
      }
    } catch (error) {
      console.error('Error checking for new followers:', error);
    }
  }, [user, db, handleNewNotification]);  

  const checkForNewMaps = useCallback(async () => {
    if (!user) return;
  
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const notifiedMaps = userData?.notifiedMaps || [];
      let hasNewMaps = false;
  
      for (const followedUserId of user.following) {
        const followedUserDoc = await getDoc(doc(db, 'users', followedUserId));
        const followedUserData = followedUserDoc.data();
        const followedUserName = followedUserData?.name || 'No.'+ followedUserId;

        const mapsSnapshot = await getDocs(collection(db, 'publishedMaps', followedUserId, 'maps'));
        mapsSnapshot.forEach(doc => {
          const mapData = doc.data();
          const mapId = doc.id;
          if (!notifiedMaps.includes(mapId)) {
            if (handleNewNotification && typeof handleNewNotification === 'function') {
              handleNewNotification(`<a href='/${followedUserId}/map/${mapId}'>你追蹤的 ${followedUserName} 發佈了新地圖 ${mapData.title}</a>`);
            }
            notifiedMaps.push(mapId);
            hasNewMaps = true;
          }
        });
      }
  
      if (hasNewMaps) {
        await updateDoc(userDocRef, {
          notifiedMaps: notifiedMaps
        });
      }
    } catch (error) {
      console.error('Error checking for new maps:', error);
    }
  }, [user, db, handleNewNotification]);
  
  useEffect(() => {
    const performCheck = async () => {

      if (isOnline()) {
        await checkForNewFollowers();
        await checkForNewMaps();  
      }
    };
    performCheck(); 
    const intervalId = setInterval(() => {
      if (isOnline()) {
      checkForNewFollowers();
      checkForNewMaps();
      }
    }, 5 * 60 * 1000);

    if (setCheckForNewFollowers) {
      setCheckForNewFollowers(checkForNewFollowers);
    }
    if (setCheckForNewMaps) {
      setCheckForNewMaps(checkForNewMaps);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [checkForNewFollowers, checkForNewMaps, setCheckForNewFollowers, setCheckForNewMaps]);

  return null;
};

export default useAuthListeners;