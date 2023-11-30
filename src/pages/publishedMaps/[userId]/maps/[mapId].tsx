// pages/publishedMaps/[userId]/maps/[mapId].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, arrayUnion, arrayRemove, runTransaction, collection, addDoc, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import firebaseServices from '../../../../utils/firebase';
const { db, auth, storage } = firebaseServices;
import { useAuth } from '../../../../context/AuthContext';
import Link from 'next/link';

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
  const [totalPlacesLikes, setTotalPlacesLikes] = useState(0);
  const [showPlacesList, setShowPlacesList] = useState(false);

  // search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // likes
  const [likedPlaces, setLikedPlaces] = useState([]);
  const [showLikedPlacesList, setShowLikedPlacesList] = useState(false); 
  const [alreadyMapLiked, setAlreadyMapLiked] = useState(false);

  //show
  const [showMapContent, setShowMapContent] = useState(true);

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
            mapDetails.authorName = authorSnap.data().name;
            mapDetails.authorAvatar = authorSnap.data().avatar; 
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

          const totalPlacesLikes = placesSnap.docs.reduce((sum, doc) => sum + (doc.data().likes || 0), 0);
          setTotalPlacesLikes(totalPlacesLikes);
          
        } else {
          console.log('找不到地圖資料');
          router.push(`/user-maps/${user.uid}`);
        }


      }
    };

    fetchMapData();
  }, [mapId, userId, user?.uid, router]);

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
    
    if (!user || typeof mapId !== 'string') return;

    if (user && typeof user.uid === 'string') {
      const mapRef = doc(db, `publishedMaps/${mapData.userId}/maps/${mapId}`);
      const placeRef = doc(db, `publishedMaps/${mapData.userId}/maps/${mapId}/places/${placeId}`);
    
      await runTransaction(db, async (transaction) => {
        const placeDoc = await transaction.get(placeRef);
        const mapDoc = await transaction.get(mapRef);
        const mapData = mapDoc.data();

        if (!placeDoc.exists()) {
          throw "Document does not exist!";
        }
    
        const placeData = placeDoc.data();
        const alreadyLiked = placeData.likedBy.includes(user.uid);

        const updatedLikes = alreadyLiked ? (placeData.likes || 0) - 1 : (placeData.likes || 0) + 1;
        const updatedLikedBy = alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid);
    
        transaction.update(placeRef, { likedBy: updatedLikedBy, likes: updatedLikes });
    
        if (!mapDoc.exists()) {
          throw "Map Document does not exist!";
        }

        const otherPlacesLiked = mapData.publishedPlaces?.some(
          place => place.id !== placeId && (place.likedBy || []).includes(user.uid)
        );

        let newPlacesLikedBy;
        if (alreadyLiked && !otherPlacesLiked) {
          newPlacesLikedBy = arrayRemove(user.uid);
        } else if (!alreadyLiked) {
          newPlacesLikedBy = arrayUnion(user.uid);
        }

        const newPlacesLikes = alreadyLiked ? (mapData.placesLikes || 0) - 1 : (mapData.placesLikes || 0) + 1;
       
        transaction.update(mapRef, { placesLikes: newPlacesLikes, placesLikedBy: newPlacesLikedBy });

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

          const newTotalPlacesLikes = updatedPlaces.reduce((sum, place) => sum + (place.likes || 0), 0);
          const newPlacesLikedBy = prevData.placesLikedBy.includes(user.uid) ? prevData.placesLikedBy : [...(prevData.placesLikedBy || []), user.uid];

          setTotalPlacesLikes(newTotalPlacesLikes);

          return {
            ...prevData,
            publishedPlaces: updatedPlaces,
            placesLikes: newTotalPlacesLikes,
            placesLikedBy: newPlacesLikedBy ? newPlacesLikedBy : prevData.placesLikedBy
          };

        });
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
        if (!mapDoc.exists()) {
          throw "Map Document does not exist!";
        }
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

   // 篩選喜愛的景點
   useEffect(() => {
    if (!user || !mapData) return;

    // 假設每個景點都有likedBy陣列，包含喜愛該景點的用戶ID
    const likedPlacesArray = mapData.publishedPlaces.filter(place => 
      place.likedBy && place.likedBy.includes(user.uid)
    );

    setLikedPlaces(likedPlacesArray);
  }, [mapData, user]);

  // 根據搜尋關鍵詞和類別篩選景點
  const filteredPlaces = mapData?.publishedPlaces.filter(place =>
    (place.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
    place.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (place.category === selectedCategory || selectedCategory === '')
  );

  // 根據喜愛搜尋關鍵詞和類別篩選景點
  const filteredLikesPlaces = likedPlaces?.filter(place =>
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
      
        <div className="relative lg:overflow-auto md:overflow-auto md:w-1/3 w-full lg:mb-10 lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5 lg:p-8 md:p-4 p-10 bg-white shadow rounded">
          <div className="">
            <div className="absolute top-0 right-5 flex items-center justify-center mb-5 mt-5">
            <label htmlFor="toggle-like" className="flex items-center cursor-pointer">
              <div className="relative">
                <input type="checkbox" id="toggle-like" className="sr-only" onChange={() =>{setShowPlacesList(!showPlacesList);
                setShowLikedPlacesList(false);}} checked={showPlacesList} />
                <div className={`block w-16 h-9 rounded-full transition-colors ${showPlacesList ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white h-7 w-7 rounded-full transition transform ${showPlacesList ? 'translate-x-full' : ''}`}>
                  <i className={`pl-1 pt-0.5 fas ${showPlacesList ? 'fa-eye' : 'fa-eye-slash'} text-gray-600 text-center`} style={{ lineHeight: '1.5rem' }}></i>
                </div>
              </div>
              <div className="ml-3 text-gray-700 font-medium">
                {showPlacesList ? '隱藏景點' : '顯示景點'}
              </div>
            </label>
            </div>
            <div className="absolute top-0 right-30 flex items-center justify-center mb-5 mt-5">
              <label htmlFor="toggle" className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" id="toggle" className="sr-only" onChange={() => {setShowLikedPlacesList(!showLikedPlacesList);
                  setShowPlacesList(false);}} checked={showLikedPlacesList} />
                  <div className={`block w-16 h-9 rounded-full transition-colors ${showLikedPlacesList ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white h-7 w-7 rounded-full transition transform ${showLikedPlacesList ? 'translate-x-full' : ''}`}>
                    <i className={`pl-1 pt-0.5 fas ${showLikedPlacesList ? 'fa-love' : 'fa-eye-slash'} text-gray-600 text-center`} style={{ lineHeight: '1.5rem' }}></i>
                  </div>
                </div>
                <div className="ml-3 text-gray-700 font-medium">
                  {showLikedPlacesList ? '隱藏所愛' : '顯示所愛'}
                </div>
              </label>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-3 mt-9">{mapData.title}</h1>

          <div className="flex items-center mb-4">
            <button title="favorite-button-map" className="m-2 mr-2" onClick={handleLikeClick}>
              <Image src="/images/heart.png" alt="Like" width="20" height="20" />
            </button>
            <span>{mapData.likes} 枚 喜愛</span>
            {/* <button title="duplicate-button-map" className="m-2 mr-2"> */}
              {/* <Image src="/images/copy.png" alt="Like" width="20" height="20" /> */}
            {/* </button> */}
            <span className="m-2">{totalDuplicates} 次景點複製</span> 
            <span className="m-2">{totalPlacesLikes} 次景點喜愛 </span>
          </div>

        <button className="rounded-2xl bg-sky-100 p-2 mb-4"
            onClick={()=>{ setShowMapContent(!showMapContent)}}> 
          {showMapContent ? '隱藏地圖內容' : '顯示地圖內容'}
        </button>
        {showMapContent && (
          <div className="relative border shadow p-3 rounded-3xl">
            <div className="flex-column items-center mb-4">
              <h1 className="text-2xl font-bold mb-3 mt-9">{mapData.title}</h1>
              <div className="mr-2 flex">
                {mapData.authorAvatar && (
                  <Link href={`/member/${mapData.userId}/`} >
                    <Image src={mapData.authorAvatar} alt="Author Avatar" className="rounded-full w-12 h-12 mr-3" width="50" height="50" />
                  </Link>
                )}
                 <p className="mt-3 text-lg font-semibold">
                {mapData.authorName}
                </p>
              </div>
            </div>
            <p className="mb-4 text-sm">
              {new Date(mapData.publishDate).toLocaleString('zh-TW', { hour12: true })}
            </p>
            {mapData.coverImage && (
              <div className="w-full h-60 relative">
                <Image src={mapData.coverImage} alt="Cover Image" layout="fill" className="object-cover" />
              </div>
            )}
            <div className="bg-white text-black mt-4">
              <ReactQuill value={mapData.content} readOnly={true} theme="snow" modules={quillModules}/>
            </div>
            {isMapCreator && ( 
                <Link href={`/edit-map/${user.uid}/${mapId}`} >
                  <button className="absolute bg-sky-100 right-0 top-0 rounded-full mb-5 mt-5 m-2 flex-column justify-center items-center border-2 border-dashed border-gray-300  h-24 w-24 cursor-pointer hover:border-gray-500 hover:bg-green-300" >  
                  <i className="fa fa-edit"></i>
                    <div>編輯地圖</div>
                  </button>
                </Link>
            )}
          </div>
        )}
        {
          (showPlacesList || showLikedPlacesList) && (
            <div className="places-list mt-4">
              <div className="search-and-filter">
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜尋景點名稱或標籤"
                      className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <select
                      title="category-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">搜尋類別</option>
                      {Object.entries(categoryMapping).map(([key, { text }]) => (
                        <option key={key} value={key}>{text}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {searchTerm || selectedCategory ? (
                  <>
                    <h2 className="text-lg font-semibold mb-2">
                      {showPlacesList ? '搜尋後景點列表' : '搜尋後喜愛景點列表'}
                    </h2>
                    {
                      (showPlacesList && filteredPlaces.length === 0) || 
                      (showLikedPlacesList && filteredLikesPlaces.length === 0) ? (
                        <p className="text-center">找不到符合條件的景點</p>
                      ) : (
                        <>
                          {(showPlacesList ? filteredPlaces : filteredLikesPlaces).map(place => (
                            <div key={place.id} className="hover:bg-yellow-50 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer" onClick={() => handleMarkerClick(place)}>
                              {place.name}
                            </div>
                          ))}
                        </>
                      )
                    }
                  </>
                ) : (
                  <>
                    {showPlacesList && (
                      <>
                        <h2 className="text-lg font-semibold mb-2">景點列表</h2>
                        {mapData.publishedPlaces.map(place => (
                          <div key={place.id} className="hover:bg-green-100 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer" onClick={() => handleMarkerClick(place)}>
                            {place.name}
                          </div>
                        ))}
                      </>
                    )}
                    {showLikedPlacesList && (
                      <div className="liked-places-list mt-4">
                        <h2 className="text-lg font-semibold mb-2">喜愛景點列表</h2>
                        {likedPlaces.length === 0 ? (
                          <p className="text-center">您還沒有喜愛任何景點</p>
                        ) : (
                          <>
                            {likedPlaces.map(place => (
                              <div key={place.id} className="hover:bg-yellow-50 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer" onClick={() => handleMarkerClick(place)}>
                                {place.name}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        }

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
                    fill
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