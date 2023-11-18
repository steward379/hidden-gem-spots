// pages/publishedMaps/[userId]/maps/[mapId].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import firebaseServices from '../../../../utils/firebase';
const { db, auth, storage } = firebaseServices;
import { useAuth } from '../../../../context/authContext';

import 'react-quill/dist/quill.snow.css'; 

const MapComponentWithNoSSR = dynamic(
    () => import('../../../../components/MapComponent'),
    { ssr: false }
);

const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});

const PublishedMapDetail = () => {
  const router = useRouter();
  const [mapData, setMapData] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const { user } = useAuth();

  const { userId, mapId } = router.query;

  // let userId = mapData.userId;

  useEffect(() => {
    const fetchMapData = async () => {
      if (mapId && typeof mapId === 'string' && userId) {
        const mapRef = doc(db, `publishedMaps/${userId}/maps`, mapId);
        const docSnap = await getDoc(mapRef);

        if (docSnap.exists()) {
          const mapDetails = docSnap.data();
          const authorRef = doc(db, 'users', userId);
          const authorSnap = await getDoc(authorRef);
  
          if (authorSnap.exists()) {
            // 假設用戶名稱儲存在 'name' 字段中
            mapDetails.authorName = authorSnap.data().name || '未知';
          }

          setMapData(mapDetails);  // 使用包含作者名字的數據
        } else {
          console.log('找不到地圖資料');
        }
      }
    };

    fetchMapData();
  }, [mapId, userId]);

  const handleLikeClick = async () => {
    if (!user || !mapData) return;

    const mapRef = doc(db, `publishedMaps/${mapData.userId}/maps`, mapId);
    const userLikedMapsRef = doc(db, `users/${user.uid}/likedMaps`, mapId);

    const alreadyLiked = mapData.likedBy.includes(user.uid);
  
    if (user && mapData) {
      // const userLikedMapDoc = await getDoc(userLikedMapsRef);
      // const alreadyLiked = userLikedMapDoc.exists();
  
      await runTransaction(db, async (transaction) => {
        const mapDoc = await transaction.get(mapRef);
        if (!mapDoc.exists()) {
          throw "Document does not exist!";
        }
  
        const newLikedBy = alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid);
        const newLikes = alreadyLiked ? (mapDoc.data().likes || 0) - 1 : (mapDoc.data().likes || 0) + 1;
  
        transaction.update(mapRef, { likedBy: newLikedBy, likes: newLikes });
  
        if (!alreadyLiked) {
          // 增加喜愛次數
          transaction.set(userLikedMapsRef, {
            mapId: mapId,
            title: mapData.title,
            authorId: mapData.userId
          });
        } else {
          // 減少喜愛次數
          transaction.delete(userLikedMapsRef);
        }
      });
  
      // 更新本地狀態
      setMapData(prevData => ({
        ...prevData,
        likes: alreadyLiked ? prevData.likes - 1 : prevData.likes + 1,
        likedBy: alreadyLiked ? prevData.likedBy.filter(uid => uid !== user.uid) : [...prevData.likedBy, user.uid]
      }));
    }
  };

  const handleMarkerClick = (place) => {
    setSelectedPlace(place);
  };

  if (!mapData) return <div>載入中...</div>;


  // 登入者是否為地圖作者
  const isMapCreator = user && mapData && user.uid === mapData.userId;

  return (
    <div className="flex flex-col md:flex-row h-screen">
    <div className="md:w-2/3 w-full">
      {/* Map component remains unchanged */}
      <MapComponentWithNoSSR 
        places={mapData.publishedPlaces}
        onMarkerClick={handleMarkerClick}
      />
    </div>
  
    <div className="md:w-1/3 w-full p-4 overflow-auto">
      <h1 className="text-2xl font-bold mb-3">{mapData.title}</h1>
      <p className="mb-4">
        <strong className="font-semibold">作者：</strong>{mapData.authorName}<br/>
        <strong className="font-semibold">發佈時間：</strong>{new Date(mapData.publishDate).toLocaleDateString()}
      </p>
      <div className="flex items-center mb-4">
        <button className="mr-2" onClick={handleLikeClick}>
          <Image src="/images/heart.png" alt="Like" width="20" height="20" />
        </button>
        <span>{mapData.likes} 個喜愛</span>
      </div>
      {mapData.coverImage && (
        <Image src={mapData.coverImage} alt="Cover Image" width="300" height="300" />
      )}
      <div className="bg-white text-black mt-4">
        {/* ReactQuill component used to render markdown content */}
        <ReactQuill value={mapData.content} readOnly={true} theme="snow" />
      </div>
      {isMapCreator && (
        <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded" onClick={() => router.push(`/edit-map/${mapId}`)}>編輯地圖(施工中)</button>
      )}
    </div>
  </div>
  );
};

export default PublishedMapDetail;