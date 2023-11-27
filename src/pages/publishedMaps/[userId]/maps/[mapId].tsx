// pages/publishedMaps/[userId]/maps/[mapId].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, arrayUnion, arrayRemove, runTransaction, collection, addDoc, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import firebaseServices from '../../../../utils/firebase';
const { db, auth, storage } = firebaseServices;
import { useAuth } from '../../../../context/authContext';

import 'react-quill/dist/quill.snow.css'; 
import { categoryMapping } from '@/src/constants';

const MapComponentWithNoSSR = dynamic(
    () => import('../../../../components/MapComponent'),
    { ssr: false }
);

const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});


const PublishedMapDetail = () => {

  const quillModules = {
    toolbar: false // 這將隱藏工具列
  };

  const router = useRouter();

  const [mapData, setMapData] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // auth
  const { user } = useAuth();
  const { userId, mapId } = router.query;

  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [showPlacesList, setShowPlacesList] = useState(false);

  // search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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

          // 取得地圖中的景點
          const placesRef = collection(db, `publishedMaps/${userId}/maps/${mapId}/places`);
          const placesSnap = await getDocs(placesRef);
          mapDetails.publishedPlaces = placesSnap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id  // 添加新的 placeId
          }));

          // 使用包含作者名字的數據
          setMapData(mapDetails);  

          const totalDups = placesSnap.docs.reduce((sum, doc) => sum + (doc.data().duplicates || 0), 0);
          setTotalDuplicates(totalDups);
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
      console.log(placeId);
      
      if (!user || typeof mapId !== 'string') return;

      if (user && typeof user.uid === 'string') {
    
        const mapRef = doc(db, `publishedMaps/${mapData.userId}/maps/${mapId}`);
        const placeRef = doc(db, `publishedMaps/${mapData.userId}/maps/${mapId}/places/${placeId}`);
      
        await runTransaction(db, async (transaction) => {
          const placeDoc = await transaction.get(placeRef);
          if (!placeDoc.exists()) {
            throw "Document does not exist!";
          }
      
          const placeData = placeDoc.data();
          const alreadyLiked = placeData.likedBy.includes(user.uid);
          const updatedLikes = alreadyLiked ? (placeData.likes || 0) - 1 : (placeData.likes || 0) + 1;
          const updatedLikedBy = alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid);
      
          transaction.update(placeRef, { likedBy: updatedLikedBy, likes: updatedLikes });
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
      const mapRef = doc(db, `publishedMaps/${mapData.userId}/maps/${mapId}`);
      const placeRef = doc(db, `publishedMaps/${mapData.userId}/maps/${mapId}/places/${placeId}`);
      const userPlacesRef = collection(db, `users/${user.uid}/places`);
    
      await runTransaction(db, async (transaction) => {
        const placeDoc = await transaction.get(placeRef);
        const mapDoc = await transaction.get(mapRef);
        if (!mapDoc.exists()) {
          throw "Map Document does not exist!";
        }

        if (!placeDoc.exists()) {
          throw "Place Document does not exist!";
        }

        const placeData = placeDoc.data();
        const updatedDuplicates = (placeData.duplicates || 0) + 1;
        const updatedDuplicatedBy = placeData.duplicatedBy.includes(user.uid) ? placeData.duplicatedBy : arrayUnion(user.uid);
        // arrayUnion(user.uid) 會將 user.uid 加入到陣列中，但如果 user.uid 已經存在於陣列中，則不會有任何變化
  
        transaction.update(placeRef, { duplicatedBy: updatedDuplicatedBy, duplicates: updatedDuplicates });
  
        // 複製景點到使用者的地圖中
        // const placeDataToDuplicate = { ...placeData, likes: 0, likedBy: [], duplicates: 0, duplicatedBy: [] };

        const placeDataForUserMap = {
          name: placeData.name,
          description: placeData.description,
          tags: placeData.tags,
          category: placeData.category,
          coordinates: placeData.coordinates,
          images: placeData.images
        };
        // delete placeDataToDuplicate.id; // 移除原有的 id
        await transaction.set(doc(userPlacesRef), placeDataForUserMap);

        // 更新地圖的 duplicates 和 duplicatedBy
        const mapData = mapDoc.data();
        const newMapDuplicates = (mapData.duplicates || 0) + 1;
        const newMapDuplicatedBy = mapData.duplicatedBy.includes(user.uid) ? mapData.duplicatedBy : arrayUnion(user.uid);

        transaction.update(mapRef, { duplicates: newMapDuplicates, duplicatedBy: newMapDuplicatedBy });
         // 更新本地狀態
        setMapData(prevData => {
          const updatedPlaces = prevData.publishedPlaces.map(place => {
            if (place.id === placeId) {
              const newDuplicatedBy = place.duplicatedBy.includes(user.uid) ? place.duplicatedBy : [...(place.duplicatedBy || []), user.uid];
              return { ...place, duplicates: updatedDuplicates, duplicatedBy: newDuplicatedBy };
            }
            return place;
          });
          const newMapDuplicatedBy = prevData.duplicatedBy.includes(user.uid) ? prevData.duplicatedBy : [...(prevData.duplicatedBy || []), user.uid];
          return {
            ...prevData,
            publishedPlaces: updatedPlaces,
            duplicates: prevData.duplicates + 1,
            duplicatedBy: newMapDuplicatedBy
          };
        });
        setTotalDuplicates(prev => prev + 1);

        alert('景點已複製到您的地圖');

      });
    }
  }
  
  const handleMarkerClick = (place) => {
    setSelectedPlace(place);
  };
  const handleMarkerClose = () => {
    setSelectedPlace(null);
  };

  // 根據搜尋關鍵詞和類別篩選景點
  const filteredPlaces = mapData?.publishedPlaces.filter(place =>
    (place.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
    place.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (place.category === selectedCategory || selectedCategory === '')
  );

  if (!mapData) {
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
    
  // 登入者是否為地圖作者
  const isMapCreator = user && mapData && user.uid === mapData.userId;

    return (
      <div className="flex flex-col h-screen-without-navbar md:flex-row text-black bg-gray-200">
        <div className="md:w-2/3 w-full lg:m-10 md:m-5 m-0 border">
          <MapComponentWithNoSSR 
            places={mapData.publishedPlaces}
            onMarkerClick={handleMarkerClick}
            allowLikes={true}
            allowDuplicate = {true}
            handlePlaceLikeClick={handlePlaceLikeClick}
            handlePlaceDuplicate={handlePlaceDuplicate}
            selectedPlace={selectedPlace}
          />
        </div>
      
        <div className="lg:overflow-auto md:overflow-auto md:w-1/3 w-full lg:mb-10 lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5 lg:p-8 md:p-4 p-10 bg-white shadow rounded">
          <h1 className="text-2xl font-bold mb-3">{mapData.title}</h1>
          <p className="mb-4">
            <strong className="font-semibold">作者：</strong>{mapData.authorName}<br/>
            <strong className="font-semibold">發佈時間：</strong>{new Date(mapData.publishDate).toLocaleDateString()}
          </p>

          <div className="flex items-center mb-4">
            <button title="favorite-button-map" className="m-2 mr-2" onClick={handleLikeClick}>
              <Image src="/images/heart.png" alt="Like" width="20" height="20" />
            </button>
            <span>{mapData.likes} 枚喜愛</span>
            {/* <button title="duplicate-button-map" className="m-2 mr-2"> */}
              {/* <Image src="/images/copy.png" alt="Like" width="20" height="20" /> */}
            {/* </button> */}
            <span className="m-2">{mapData.duplicates} 次景點複製</span>
          </div>

          {mapData.coverImage && (
            <div className="w-full h-60 relative">
              <Image src={mapData.coverImage} alt="Cover Image" layout="fill" className="object-cover" />
            </div>
          )}

          <div className="bg-white text-black mt-4">
            <ReactQuill value={mapData.content} readOnly={true} theme="snow" modules={quillModules}/>
          </div>
          {isMapCreator && ( 
            <button className="mt-4 bg-gray-500 text-white py-2 px-4 rounded" onClick={() => router.push(`/edit-map/${user.uid}/${mapId}`)}>  
              編輯地圖
            </button>
          )}
           <button
          onClick={() => setShowPlacesList(!showPlacesList)}
          className="m-4 bg-blue-500 text-white py-2 px-4 rounded"
        >
          {showPlacesList ? '隱藏景點列表' : '顯示景點列表'}
        </button>
        {showPlacesList && (
          <div className="places-list mt-4">
              {/* 搜尋和篩選 UI */}
            <div className="search-and-filter">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋景點名稱或標籤"
                className="p-2 w-full mb-2 border rounded text-black"
              />
              <select
                title="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 w-full mb-2 border rounded text-black"
              >
                  <option value="">搜尋類別</option>
                  {Object.entries(categoryMapping).map(([key, { text }]) => (
                    <option key={key} value={key}>{text}</option>
                  ))}
              </select>

              { searchTerm || selectedCategory ? (
                <>
                  <h2 className="text-lg font-semibold mb-2">搜尋後景點列表</h2>
                  { filteredPlaces.length === 0 ? (
                    <p className="text-center">找不到符合條件的景點</p>
                  ) : (
                  <>
                    {filteredPlaces.map(place => (
                      <div key={place.id} className="hover:bg-yellow-50 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer" onClick={() => handleMarkerClick(place)}>
                        {place.name}
                      </div>
                    ))}
                  </>
                  )}
                </>
                ) : (
                <>
                  <h2 className="text-lg font-semibold mb-2">景點列表</h2>
                  {mapData.publishedPlaces.map((place) => (
                    <div key={place.id} className="hover:bg-green-100 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer"
                         onClick={() => handleMarkerClick(place)}>
                      {place.name}
                    </div>
                  ))}
                </>
                )
              }
            </div>
          </div>
        )}

         {selectedPlace && (
          <div className="relative selected-place-detail mt-4 border shadow p-5">
            <p className="absolute right-0 top-0 cursor-pointer p-5" onClick={handleMarkerClose} >
              <i className="fas fa-times"></i>
            </p>
            <h3 className="text-xl font-bold">{selectedPlace.name}</h3>
            <p className="text-gray-700 mt-2">{selectedPlace.description}</p>

            {/* 類別 */}
            <div className={`text-sm ${categoryMapping[selectedPlace.category]?.color || 'bg-gray-200'} p-1 rounded mt-2`}>
              {categoryMapping[selectedPlace.category]?.text || '不明'}
            </div>

            {/* 標籤 */}
            {selectedPlace.tags && selectedPlace.tags.filter(tag => tag.trim().length > 0).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPlace.tags.map(tag => (
                  <span key={tag} className="text-xs bg-blue-200 px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* 圖片 */}
            <div className="mt-4">
              {selectedPlace.images.map((url, index) => (
                <div key={index} className="image-preview mb-2 relative" style={{ width: 300, height:  300 }}>
                  <Image 
                    src={url}
                    alt={`${selectedPlace.name} image ${index}`}
                    layout="fill" 
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
    </div>
  );
};

export default PublishedMapDetail;