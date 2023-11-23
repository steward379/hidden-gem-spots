// pages/publishedMaps/[userId]/maps/[mapId].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, arrayUnion, arrayRemove, runTransaction, collection, addDoc } from 'firebase/firestore';
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

  // get Map
  useEffect(() => {
    const fetchMapData = async () => {
      if (typeof mapId === 'string' && typeof userId === 'string') {
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
    if (!mapData || typeof mapId !== 'string') return;

    if (user && typeof user.uid === 'string') {

      const mapRef = doc(db, `publishedMaps/${mapData.userId}/maps`, mapId);
      const userLikedMapsRef = doc(db, `users/${user.uid}/likedMaps`, mapId);
      const alreadyLiked = mapData.likedBy.includes(user.uid);
  
      // if (user && mapData) {
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
            authorId: mapData.userId,
            authorName: "等待填入"
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
    } else {
      // 未登入用戶的處理
      const likedMaps = JSON.parse(localStorage.getItem('likedMaps') || '[]');
      const mapIndex = likedMaps.indexOf(mapId);
      if (mapIndex >= 0) {
        likedMaps.splice(mapIndex, 1);
        localStorage.setItem('likedMaps', JSON.stringify(likedMaps));
      } else {
        localStorage.setItem('likedMaps', JSON.stringify([...likedMaps, mapId]));
      }
    }
  };
  
  const handlePlaceLikeClick = async (placeId) => {
      
      if (!placeId || !mapData || typeof mapId !== 'string') return;

      if (user && typeof user.uid === 'string') {
    
      const mapRef = doc(db, `publishedMaps/${mapData.userId}/maps`, mapId);
    
      await runTransaction(db, async (transaction) => {
        const mapDoc = await transaction.get(mapRef);
        if (!mapDoc.exists()) {
          throw "Document does not exist!";
        }
    
        const mapData = mapDoc.data();
        const updatedPublishedPlaces = mapData.publishedPlaces.map(place => {
          if (place.id === placeId) {
            const updatedLikes = place.likes ? place.likes + 1 : 1;
            const updatedLikedBy = place.likedBy ? [...place.likedBy, user.uid] : [user.uid];
            return { ...place, likes: updatedLikes, likedBy: updatedLikedBy };
          }
          return place;
        });
        transaction.update(mapRef, { publishedPlaces: updatedPublishedPlaces });
      });
    
  
      // 更新本地狀態
      setMapData(prevData => {
        const updatedPlaces = prevData.publishedPlaces.map(place => {
          if (place.id === placeId) {
            const alreadyLiked = place.likedBy && place.likedBy.includes(user.uid);
            const updatedLikes = alreadyLiked ? place.likes - 1 : (place.likes ? place.likes + 1 : 1);
            const updatedLikedBy = alreadyLiked ? place.likedBy.filter(uid => uid !== user.uid) : [...(place.likedBy || []), user.uid];
            return { ...place, likes: updatedLikes, likedBy: updatedLikedBy };
          }
          return place;
        });
        return { ...prevData, publishedPlaces: updatedPlaces };
      });
    } else {
        // 未登入用戶的處理
        const likedPlaces = JSON.parse(localStorage.getItem('likedPlaces') || '[]');
        const placeIndex = likedPlaces.indexOf(placeId);
        if (placeIndex >= 0) {
          likedPlaces.splice(placeIndex, 1);
          localStorage.setItem('likedPlaces', JSON.stringify(likedPlaces));
        } else {
          localStorage.setItem('likedPlaces', JSON.stringify([...likedPlaces, placeId]));
        }
    }
  };

  const handlePlaceDuplicate = async (placeId) => {
    if (!user) {
      // 如果使用者未登入，無法使用複製功能
      alert('請先登入才能複製景點');
      return;
    }

    if (!placeId || !mapData || typeof mapId !== 'string') return;

    if (user && typeof user.uid === 'string') {
  
    const mapRef = doc(db, `publishedMaps/${mapData.userId}/maps`, mapId);
  
    await runTransaction(db, async (transaction) => {
      const mapDoc = await transaction.get(mapRef);
      if (!mapDoc.exists()) {
        throw "Document does not exist!";
      }
        const mapData = mapDoc.data();
        const updatedPublishedPlaces = mapData.publishedPlaces.map(place => {
          if (place.id === placeId) {
            const alreadyDuplicated = place.duplicatedBy && place.duplicatedBy.includes(user.uid);
            const updatedDuplicates = alreadyDuplicated ? place.duplicates : (place.duplicates ? place.duplicates + 1 : 1);
            const updatedDuplicatedBy = alreadyDuplicated ? place.duplicatedBy : [...(place.duplicatedBy || []), user.uid];

            return { ...place, duplicates: updatedDuplicates, duplicatedBy: updatedDuplicatedBy };
          }
          return place;
        });
    
        transaction.update(mapRef, { publishedPlaces: updatedPublishedPlaces });
    
      // 將景點複製到使用者的地圖中

      let placeDataToDuplicate = null;

      const publishedMapDoc = await getDoc(mapRef);

      if (publishedMapDoc.exists()) {
        const publishedMapData = publishedMapDoc.data();
        placeDataToDuplicate = publishedMapData.publishedPlaces.find(place => place.id === placeId);
        if (!placeDataToDuplicate) {
          alert('找不到要複製的景點');
          return;
        }
      } else {
        alert('找不到地圖資料');
        return;
      }

      // 複製景點到使用者的地圖中
      const userPlacesRef = collection(db, `users/${user.uid}/places`);
      const { id, ...placeDataWithoutId } = placeDataToDuplicate;
      await addDoc(userPlacesRef, placeDataWithoutId);

      alert('景點已複製到您的地圖');
    });
  }
}
  
  const handleMarkerClick = (place) => {
    setSelectedPlace(place);
  };

  if (!mapData) return <div>載入中...</div>;
    
  // 登入者是否為地圖作者
  const isMapCreator = user && mapData && user.uid === mapData.userId;

    return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="md:w-2/3 w-full">
        <MapComponentWithNoSSR 
          places={mapData.publishedPlaces}
          onMarkerClick={handleMarkerClick}
          allowLikes={true}
          allowDuplicate = {true}
          handlePlaceLikeClick={handlePlaceLikeClick}
          handlePlaceDuplicate={handlePlaceDuplicate}
        />
      </div>
    
      <div className="md:w-1/3 w-full p-4 overflow-auto">
        <h1 className="text-2xl font-bold mb-3">{mapData.title}</h1>
        <p className="mb-4">
          <strong className="font-semibold">作者：</strong>{mapData.authorName}<br/>
          <strong className="font-semibold">發佈時間：</strong>{new Date(mapData.publishDate).toLocaleDateString()}
        </p>

        <div className="flex items-center mb-4">
          <button title="favorite-button" className="mr-2" onClick={handleLikeClick}>
            <Image src="/images/heart.png" alt="Like" width="20" height="20" />
          </button>
          <span>{mapData.likes} 個喜愛</span>
        </div>

        {mapData.coverImage && (
          <Image src={mapData.coverImage} alt="Cover Image" width="300" height="300" />
        )}

        <div className="bg-white text-black mt-4">
          <ReactQuill value={mapData.content} readOnly={true} theme="snow" />
        </div>
        {isMapCreator && (
          <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded" onClick={() => router.push(`/edit-map/${userId}/${mapId}`)}>  
            編輯地圖(施工中)
          </button>
        )}
      </div>
    </div>
  );
};

export default PublishedMapDetail;