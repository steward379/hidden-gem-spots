import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import firebaseServices from '../utils/firebase';
import {
  doc, getDoc, collection, query, where, getDocs, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { sendNewFollowerNotification, sendNewMapPublishedNotification } from '../utils/notification';

const useAuthListeners = (handleNewNotification: (string)=>{} = null, setCheckForNewFollowers = null, setCheckForNewMaps =null ) => {
  const { user } = useAuth();
  const { db } = firebaseServices;

  const checkForNewFollowers = useCallback(async () => {
    console.log('Checking for new followers...');
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    const lastFollowers = userData?.lastFollowers || [];
    const currentFollowers = userData?.followers || [];
    const newFollowers = currentFollowers.filter(followerId => !lastFollowers.includes(followerId));

    for (const followerId of newFollowers) {
      const followerDoc = await getDoc(doc(db, 'users', followerId));
      if (followerDoc.exists()) {
        const followerData = followerDoc.data();
        console.log('New follower:', followerData.name);
        handleNewNotification && handleNewNotification(`${followerData.name} 來了`);
        sendNewFollowerNotification(followerData.name);
      }
    }
    // Update last followers in the database
    await updateDoc(doc(db, 'users', user.uid), {
      lastFollowers: currentFollowers
    });
  }, [user, db, handleNewNotification]);

  const checkForNewMaps = useCallback(async () => {
    if (!user) return;
  
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
  
    let notifiedMaps = userData.notifiedMaps || [];
  
    for (const followedUserId of user.following) {
      const mapsRef = collection(db, 'publishedMaps', followedUserId, 'maps');
      const mapsSnapshot = await getDocs(mapsRef);
  
      mapsSnapshot.forEach((doc) => {
        const mapData = doc.data();
        const mapId = doc.id;
  
        if (!notifiedMaps.includes(mapId)) {
          handleNewNotification && handleNewNotification(`${mapData.title} 是 ${followedUserId} 寫的`);
          sendNewMapPublishedNotification(mapData.title, followedUserId);
          notifiedMaps.push(mapId);
        }
      });
    }
  
    await updateDoc(userDocRef, {
      notifiedMaps: notifiedMaps
    });
  }, [user, db, handleNewNotification]);


  useEffect(() => {
    const intervalId = setInterval(() => {
      checkForNewFollowers();
      checkForNewMaps();
    }, 10 * 60 * 1000); // Check every 10 minutes

    checkForNewFollowers();
    checkForNewMaps();
    
    // Check immediately on mount
    setCheckForNewFollowers && setCheckForNewFollowers(() => checkForNewFollowers);
    setCheckForNewMaps && setCheckForNewMaps(() => checkForNewMaps);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkForNewFollowers, checkForNewMaps, setCheckForNewFollowers, setCheckForNewMaps]);

  return null; // No need to return anything
};

export default useAuthListeners;
