import { useEffect, useRef } from 'react';
import firebaseServices from '../utils/firebase';
const { db } = firebaseServices;
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { sendNewFollowerNotification } from '../utils/notification';

export function useListenToNewFollowers(userId) {
    const lastFollowers = useRef([]);

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = onSnapshot(doc(db, 'users', userId), async (docSnapshot) => {
            const userData = docSnapshot.data();
            if (!userData) return;

            const currentFollowers = userData.followers || [];
            const newFollowers = currentFollowers.filter(followerId => !lastFollowers.current.includes(followerId));

            for (const followerId of newFollowers) {
                try {
                    const followerDoc = await getDoc(doc(db, 'users', followerId));
                    if (followerDoc.exists()) {
                        const followerData = followerDoc.data();
                        sendNewFollowerNotification(followerData.name);
                    }
                } catch (error) {
                    console.error('Error getting new follower data:', error);
                }
            }

            lastFollowers.current = currentFollowers;
        });

        return () => {
            unsubscribe();
        };
    }, [userId]);
}
