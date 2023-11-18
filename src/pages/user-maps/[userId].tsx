//user-maps/[userId].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import firebaseServices from '../../utils/firebase';
const { db } = firebaseServices;
import { useAuth } from '../../context/authContext';

const UserMapsPage = () => {
  const [maps, setMaps] = useState([]);
  const [likedMaps, setLikedMaps] = useState([]); 
  const [mapMaker, setMapMaker] = useState(null);

  const router = useRouter();

  const { user } = useAuth();

  const { userId } = router.query;

  useEffect(() => {
    const fetchMaps = async () => {
      if (userId ) {
        const q = query(collection(db, `publishedMaps/${userId}/maps`));
        const querySnapshot = await getDocs(q);
        const mapsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMaps(mapsData);

        const mapHost = doc(db, `users/${userId}`);
        const mapHostSnapshot = await getDoc(mapHost);
        if (mapHostSnapshot.exists()) {
          setMapMaker(mapHostSnapshot.data().name);
        }

        // 獲取所有地圖，篩選出用戶喜愛的地圖
        const likedMapsQuery = query(collection(db, `users/${user.uid}/likedMaps`));
        const likedMapsSnapshot = await getDocs(likedMapsQuery);
        setLikedMaps(likedMapsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const likedMapsData = likedMapsSnapshot.docs.map(doc => ({ 
            id: doc.id,
            authorId: doc.data().authorId,
            authorName: doc.data().authorName,
            ...doc.data() }));

          // 對每個喜愛的地圖獲取作者名稱
        for (let map of likedMapsData) {
          const authorRef = doc(db, `users/${map.authorId}`);
          const authorSnap = await getDoc(authorRef);
          if (authorSnap.exists()) {
            // 假設用戶名稱儲存在 'name' 字段中
            map.authorName = authorSnap.data().name;
          }
        }

        setLikedMaps(likedMapsData); 
      }
    };
    
    fetchMaps();

  }, [userId, user.uid]);

  // users now
  const isCurrentUser = user && user.uid === userId; 

  return (
    <div className="container mx-auto p-4">
    <h2 className="text-2xl font-bold mb-5">{isCurrentUser ? '你的地圖' : `${mapMaker}的地圖`}</h2>
    
    <div className="space-y-4">
      {maps.map(map => (
        <div key={map.id} className="p-4 border border-gray-200 rounded shadow-sm cursor-pointer" onClick={() => router.push(`/publishedMaps/${userId}/maps/${map.id}`)}>
          <h2 className="text-xl font-semibold">{map.title}</h2>
          <p className="text-gray-600">{map.description}</p>
        </div>
      ))}
    </div>
    
    {isCurrentUser && (
      <div className="mt-6">
        <button className="bg-blue-500 text-white py-2 px-4 rounded" onClick={() => router.push('/map')}>
          管理地圖
        </button>
          {/* 渲染用戶喜愛的地圖 */}
          <div className="mt-6">
            <h3 className="text-2xl font-bold mb-5">喜愛的地圖</h3>
            {likedMaps.map(map => (
              <div key={map.id} className="p-4 border border-gray-200 rounded shadow-sm cursor-pointer" onClick={() => router.push(`/publishedMaps/${map.authorId}/maps/${map.id}`)}>
                <h2 className="text-xl font-semibold">{`${map.title} by ${map.authorName}`}</h2>
              </div>
            ))}
          </div>
      </div>
    )}
  </div>
  );
};

export default UserMapsPage;