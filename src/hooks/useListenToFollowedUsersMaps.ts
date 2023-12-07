import { useEffect, useRef } from 'react';
import firebaseServices from '../utils/firebase';
const { db } = firebaseServices;
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { sendNewMapPublishedNotification } from '../utils/notification';

export function useListenToFollowedUsersMaps(userId) {
    const lastMaps = useRef({});

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = onSnapshot(doc(db, 'users', userId), async (docSnapshot) => {
            const userData = docSnapshot.data();
            if (!userData || !userData.following) return;

            userData.following.forEach(async (followedUserId) => {
                const mapsRef = collection(db, 'publishedMaps', followedUserId, 'maps');
                onSnapshot(mapsRef, (snapshot) => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added' && !lastMaps.current[change.doc.id]) {
                            sendNewMapPublishedNotification(change.doc.data().title, change.doc.data().name);
                            lastMaps.current[change.doc.id] = true;
                        }
                    });
                });
            });
        });

        return () => {
            unsubscribe();
        };
    }, [userId]);
}
