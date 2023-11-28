// map/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Router from 'next/router';

import DropzoneImage from '../../components/DropzoneImage';

import { onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, getDocs, updateDoc, getDoc, addDoc, where, doc, setDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import firebaseServices from '../../utils/firebase'; 
const { db, auth, storage } = firebaseServices; 

import { useAuth } from '../../context/authContext';

import { categoryMapping } from '../../constants'

import Image from 'next/image';
// import { Place } from '../../types/Place';
import { NewMarkerData } from '../../types/NewMarkerData';

export interface Place {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  images: string[];
  likes?: number;
  likedBy?: string[];
  duplicates?: number;
  duplicatedBy?: string[];
}

const AlertModal = ({ isOpen, onClose, onConfirm = () => {}, message, showConfirmButton = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center">
      <div className="bg-white bg-opacity-60 p-6 rounded-lg shadow-xl backdrop-blur-sm">
        <p className="text-black">{message}</p>
        <div className="flex justify-end space-x-4">
          {showConfirmButton && (
            <button onClick={onConfirm} className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600">
              確認刪除
            </button>
          )}
          <button onClick={onClose} className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
            {showConfirmButton ? '取消' : '確定'}
          </button>
        </div>
      </div>
    </div>
  );
};


// import L from 'leaflet';
// import MapComponent from '../../components/MapComponent';

const MapComponentWithNoSSR = dynamic(
  () => import('../../components/MapComponent'),
  { ssr: false }
);

const MapDemoPage: React.FC = () => {
  const [places, setPlaces] = useState([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [images, setImages] = useState<File[]>([]);
  const [isAddingMarker, setIsAddingMarker] = useState(false); 
  const [newMarker, setNewMarker] = useState(null); 
  // const [markers, setMarkers] = useState([]);
  // const [image, setImage] = useState(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [originalImageUrls, setOriginalImageUrls] =  useState<string[]>([]);
  const [showPlacesList, setShowPlacesList] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  // alert&confirm
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // userAuth
  const { user } = useAuth();

  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
  };
  const handlePlaceClose = () => {
    setSelectedPlace(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setUserId(user.uid); // 如果用戶已登入，保存用戶 ID
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchPlaces = useCallback(async () => {
    if (!userId) return;
    const placesQuery = query(collection(db, `users/${userId}/places`));
    const querySnapshot = await getDocs(placesQuery);
    setPlaces(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, [userId]); 

  // 更新 places 資料
  useEffect(() => {
    if (userId) {
      fetchPlaces();
    }
  }, [userId, fetchPlaces]);

  const handleMarkerPlaced = (coordinates) => {
    setNewMarker({ coordinates, name: '', description: '', tags: '', category: '', images: [] });
  };

  const handleDeletePlace = async () => {
    if (selectedPlace) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (selectedPlace) {
      const placeRef = doc(db, `users/${userId}/places`, selectedPlace.id);
      await deleteDoc(placeRef);
      setSelectedPlace(null);
      setPlaces(prevPlaces => prevPlaces.filter(place => place.id !== selectedPlace.id));
    }
    setShowDeleteConfirm(false);
  };

  const handleInputChange = (field, value) => {
    setNewMarker(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (file) => {
    const newImageUrls = [...previewImages, URL.createObjectURL(file)];
    setPreviewImages(newImageUrls);
    setImages([...images, file]);
  };

  // const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   if (event.target.files) {
  //     const selectedFiles = Array.from(event.target.files);
  //     setImages(selectedFiles); 
  //     const selectedFilesUrls = selectedFiles.map(file => URL.createObjectURL(file))
  //     setPreviewImages(selectedFilesUrls); 
  //   }
  // };

  const toggleAddingMarker = () => {
    if (isAddingMarker) {
      handleCancel(); // 如果正在新增景點，則取消並重置狀態
    } else {
      setIsAddingMarker(true); // 否則，開始新增景點
    }
  };
  
  // cancel adding sites
  const handleCancel = () => {
    setIsAddingMarker(false);
    setNewMarker(null);
    setSelectedPlace(null);
  };

  const uploadImage = async (file: File, userId: string, placeName: string): Promise<string> => {
    const storageRef = ref(storage, `places/${userId}/${placeName}/${file.name}`);

    const uploadTask = uploadBytesResumable(storageRef, file);
  
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // 更新進度條, 使用 snapshot.bytesTransferred 和 snapshot.totalBytes
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  } 

  const handleRemoveImage = async (index: number, imageSrc: string) => {

    if (typeof previewImages[index] === 'string') {
      const imageUrl = previewImages[index];
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl); // 釋放 Blob URL
      }
      // 移除對應的檔案物件
      setImages(images.filter((_, i) => i !== index));
      // 移除對應的預覽圖片
      setPreviewImages(previewImages.filter((_, i) => i !== index));
    }

    // 移除對應的檔案物件
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleEditClick = (place: Place) => {
    setNewMarker({
      coordinates: place.coordinates,
      name: place.name,
      description: place.description,
      tags: place.tags.join(', '), 
      category: place.category,
      images: place.images,
    });

    setOriginalImageUrls(place.images); 
    // setPreviewImages(place.images); 
    setPreviewImages(place.images);
    setIsEditing(true);
    setSelectedPlace(place);  // 設置當前選中地點
  };

  const handleCancelEdit = () => {
    // setPreviewImages(originalImageUrls);
    setPreviewImages([]);
    // setImages([]);
    setNewMarker(null);
    setIsEditing(false);
    // setSelectedPlace(null); 
  };

  //firestore 刪除圖片
  async function removeImageFromFirestore(placeId, imageUrl, userId) {
    console.log(`Removing image URL from Firestore: ${imageUrl}`);
  
    const placeRef = doc(db, `users/${userId}/places`, placeId);
  
    // Get the document data before updating
    const placeSnap = await getDoc(placeRef);

    if (placeSnap.exists()) {
      const placeData = placeSnap.data();
      const imageUrls = placeData.images;
  
      // Create a new images array that does not include the image URL
      const newImages = imageUrls.filter((url) => url !== imageUrl);
  
      await updateDoc(placeRef, { images: newImages });

      await fetchPlaces(); 
      // Add a delay before fetching the updated document
      // await new Promise((resolve) => setTimeout(resolve, 1000));
  
      // Fetch the document again and log the entire document
      const updatedPlaceSnap = await getDoc(placeRef);
      if (updatedPlaceSnap.exists()) {
        const updatedPlaceData = updatedPlaceSnap.data();
        console.log(`Updated document data: `, updatedPlaceData);
      }
    }
  }

  function extractStoragePathFromUrl(downloadUrl: string): string {
    const url = new URL(downloadUrl);
    const path = url.pathname;
  
    // Remove the "/o/" prefix and decode the URI component
    const decodedPath = decodeURIComponent(path).split('/o/')[1];
  
    // Return the path without the token query parameter
    return decodedPath.split('?')[0];
  }

  const updatePlace = async (placeId: string) => {

    if (!newMarker || !userId || !selectedPlace) return;

      //  刪除原有圖片，包含 Storage 和 Firestore
      // const imagesToDelete = originalImageUrls.filter(originalUrl => !newMarker.imageUrls.includes(originalUrl));
      // async function removeImageFromFirestore(placeId, imageUrl, userId) {
      //   const placeRef = doc(db, `users/${userId}/places`, placeId);
      //   const placeSnap = await getDoc(placeRef);
      //   if (placeSnap.exists()) {
      //     const placeData = placeSnap.data();
      //     const imageUrls = placeData.images || [];
      //     const updatedImageUrls = imageUrls.filter(url => url !== imageUrl);
      //     await updateDoc(placeRef, { images: updatedImageUrls });
      //   }
      // }
    
      // 上傳新圖片並取得URLs
    const newImageUrls = await Promise.all(
        images.map(file => uploadImage(file, userId, placeId))
      );
          
      // const updatedImages = [...previewImages.filter(url => !url.startsWith('blob')), ...imageUrls];
      // const updatedImages = [...(newMarker.imageUrls || []), ...imageUrls];
    const updatedImages = [...(newMarker.images || []) , ...newImageUrls];

    const updatedPlaceData = {
      ...newMarker,
      images: updatedImages,
      tags: newMarker.tags.split(',').map(tag => tag.trim()) || [],
    };

    const placeRef = doc(db, `users/${userId}/places`, placeId);
    await setDoc(placeRef, updatedPlaceData, { merge: true });

    setPlaces(prevPlaces => prevPlaces.map(place => 
    // place.id === selectedPlace.id ? { ...place, ...updatedPlaceData } : place
    place.id === placeId ? { ...place, ...updatedPlaceData } : place
    )); 

    const imagesToDelete = originalImageUrls.filter(url => !previewImages.includes(url));

    // const deletePromises = imagesToDelete.map(async(url) => {
    for (const url of imagesToDelete) {

      const storagePath = extractStoragePathFromUrl(url);
      // const fullPath = `places/${userId}/${placeName}/${fileName}`;
      const imageRef = ref(storage, storagePath);

      try {
        await deleteObject(imageRef);
        console.log(`Deleted image: ${storagePath}`);
        // 刪除成功後，移除Firestore中的URL
        await removeImageFromFirestore(placeId, url, userId);
      } catch (error) {
        if (error.code === 'storage/object-not-found') {
          console.warn(`Image not found in storage, might be already deleted: ${storagePath}`);
        } else {
          console.error(`Error deleting image from storage: ${error}`);
        }
      }
    }
      
    // });
    
    // await Promise.all(deletePromises);

    setIsEditing(false);
    setSelectedPlace(null);
    setNewMarker(null);
    setImages([]);
    setPreviewImages([]);
  };

  // 儲存使用者的新地點
  const createNewPlace = async ()=> {
    if (!userId || !newMarker) return;

    try {
      const imageUrls = await Promise.all(images.map(file => uploadImage(file, userId, newMarker.name)));

      const newPlace =  {
        name: newMarker.name,
        description: newMarker.description,
        tags: newMarker.tags.split(','), 
        category: newMarker.category,
        coordinates: {
          lat: newMarker.coordinates.lat,
          lng: newMarker.coordinates.lng
        },
        images: imageUrls,
      };
       // const placesRef = doc(db, `users/${userId}/places`); 
      const placesRef = collection(db, `users/${userId}/places`); 
      const docRef = await addDoc(placesRef, newPlace);

      setPlaces(prev => [...prev, { id: docRef.id, ...newPlace }]);
      setNewMarker(null);

      setIsAddingMarker(false);
      setIsEditing(false);
      console.log('提交景點資訊：', newPlace);
    } catch (e) {
      console.error("Error adding document: ", e);
    }

    setPreviewImages([]);
    setImages([]);
  };

  const handleSubmit = async() => {
    if (!newMarker || !userId) return;

    // 檢查文字欄位是否有效（不僅僅是空格）
    const isFieldValid = (field) => field && field.trim().length > 0;

    if (!isFieldValid(newMarker.name)){
      showAlert('請填寫標題');
      return;
    } else if (!isFieldValid(newMarker.description)) {
      showAlert('請填寫內容');
      return;
    } else if (!isFieldValid(newMarker.category)) {
      showAlert('請選擇類別');
      return;
    } else if (!newMarker.coordinates) {
      showAlert('確定有在地圖上標記位置嗎？');
      return;
    }

    console.log('提交景點信息：', newMarker);

    if (isEditing && selectedPlace) {
      await updatePlace(selectedPlace.id);
    } else {
      await createNewPlace();
    }
  };

  // users mapping
  useEffect(() => {
    if (!userId) return;
  
    const placesCollection = collection(db, 'places');
    const q = query(placesCollection, where('userId', '==', userId)); 
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newPlaces = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlaces(newPlaces);
    });
  
    return () => unsubscribe();
  }, [userId]);

  const filteredPlaces = places?.filter(place =>
    (place.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
    place.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (place.category === selectedCategory || selectedCategory === '')
  );

  const formatCoordinates = (lat, lng) => {
    const latText = Math.round(lat * 10000) / 10000;
    const lngText = Math.round(lng * 10000) / 10000;
  
    // const latText = roundedLat >= 0 ? `${roundedLat} N` : `${Math.abs(roundedLat)} S`;
    // const lngText = roundedLng >= 0 ? `${roundedLng} E` : `${Math.abs(roundedLng)} W`;
  
    return `${latText}, ${lngText}`;
  };
  
  return (
    <div className="flex flex-col h-screen-without-navbar md:flex-row text-black bg-gray-200">
      <div className="md:w-2/3 w-full lg:m-10 md:m-5 m-0 border">
        <MapComponentWithNoSSR 
          onMarkerPlaced={handleMarkerPlaced}
          isAddingMarker={isAddingMarker} 
          isEditing={isEditing}
          places={places} 
          onCancel={handleCancel}
          onMarkerClick={setSelectedPlace}
          onMapClick={() => setSelectedPlace(null)}
          selectedPlace={selectedPlace}
          showInteract = {false}
        />
      </div>
    
      <div className="lg:overflow-auto md:overflow-auto md:w-1/3 w-full lg:mb-10 lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5 lg:p-8 md:p-4 p-10 bg-white shadow rounded">
        <h1 className="text-2xl font-bold text-gray-800 mb-4"> {user.name} 的地圖</h1>
        <div className="text-gray-600"> 
          點選圖標以閱讀、編輯或刪除景點，或點選新增來新增景點
        </div>
        {!isEditing && (
        <>
        
          <button
            // onClick={() => setIsAddingMarker(!isAddingMarker)}
            onClick={toggleAddingMarker} 
            className="mb-5 mt-5 m-2 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-20 w-32 cursor-pointer hover:border-gray-500 hover:bg-green-300"
          >
            <i className={`fas ${isAddingMarker ? 'fa-minus' : 'fa-map-pin'}`}></i>
            <div>{isAddingMarker ? '取消新增景點' : '新增景點'}</div>
          </button>

          <button 
            onClick={() => setShowPlacesList(!showPlacesList)}
            className="mb-5 mt-5 m-2 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-20 w-32 cursor-pointer hover:border-gray-500 hover:bg-blue-200"
          >
             <i className={`fas ${showPlacesList ? 'fa-eye-slash' : 'fa-eye'}`}></i>
             <div>{showPlacesList ? '隱藏景點列表' : '顯示景點列表'}</div>
           
          </button>
          <button
            onClick={() => Router.push('/publish-map')}
            className="mb-5 mt-5 m-2 flex-column justify-center items-center border-2 border-dashed bg-pink-200 border-gray-300 rounded-lg h-20 w-32 cursor-pointer hover:border-gray-500 hover:bg-pink-100"
          >
            <i className={`fas fa-upload`}></i> 
            <div>發佈地圖</div>
          </button>

          { !newMarker && showPlacesList && (
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
                     <div key={place.id} className="hover:bg-yellow-50 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer" 
                          onClick={() => handlePlaceSelect(place)}>
                       {place.name}
                     </div>
                   ))}
                 </>
                 )}
               </>
               ) : (
               <>
                 <h2 className="text-lg font-semibold mb-2">景點列表</h2>
                 {places.map((place) => (
                   <div key={place.id} className="hover:bg-green-100 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer"
                        onClick={() => handlePlaceSelect(place)}>
                     {place.name}
                   </div>
                 ))}
               </>
               )
             }
           </div>
         </div>
          )}
        </>
      )}

      {selectedPlace && !isEditing && (
        <>
         
          <div className="relative p-4 bg-white rounded shadow-md">
         
            {/* 標題部分 */}
            <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4">{selectedPlace.name}</h2>
            <p className="absolute right-0 top-0 text-black cursor-pointer p-5" onClick={handlePlaceClose} >
              <i className="fas fa-times"></i>
            </p>

            {/* 描述 */}
            <h3 className="text-lg text-gray-600 mb-4">{selectedPlace.description}</h3>

            {/* 標籤 */}
            {selectedPlace.tags && selectedPlace.tags.filter(tag => tag.trim().length > 0).length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {selectedPlace.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-200 px-2 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 類別 */}
            <div className={`${categoryMapping[selectedPlace.category]?.color || 'bg-gray-200'} p-2 rounded mb-4 w-24`}>
              {categoryMapping[selectedPlace.category]?.text || '不明'}
            </div>
            
            {/* 圖片 */}
            <div className="mt-5">
              {selectedPlace.images.map((url, index) => (
                <div key={index} className="image-preview mb-2 relative" style={{ width: 300, height: 300 }}>
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
          <button
            className="mb-5 mt-5 m-2 bg-blue-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-12 w-40 cursor-pointer hover:border-gray-500 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => handleEditClick(selectedPlace)}
          >
            <i className="fas fa-edit"></i> 編輯景點
          </button>

          <button
            // className="m-2 px-4 py-2 bg-red-100 text-black border border-black rounded hover:bg-red-400 hover:text-white hover:border-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            className="mb-5 mt-5 m-2 bg-red-100 flex-column justify-center items-center border-2 border-gray-300 rounded-lg h-12 w-40  cursor-pointer hover:border-gray-500 hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={handleDeletePlace}
          >
            <i className="fas fa-trash-alt"></i> 刪除景點
          </button>
          
        </>
      )}


      {newMarker && (
        <div className="p-4 bg-white rounded shadow-md">
          <h3 className="text-lg font-semibold mb-2 text-black">{isEditing ? '編輯景點' : '新增景點'}</h3>
          <input 
            type="text" 
            placeholder="名稱" 
            value={newMarker.name} 
            onChange={(e) => handleInputChange('name', e.target.value)} 
            className="p-2 w-full mb-2 border rounded text-black"
          />
          <textarea 
            placeholder="描述" 
            value={newMarker.description} 
            onChange={(e) => handleInputChange('description', e.target.value)} 
            className="p-2 w-full mb-2 border rounded text-black"
          ></textarea>
          <input 
            type="text" 
            placeholder="標籤 (用逗號分隔)" 
            value={newMarker.tags} 
            onChange={(e) => handleInputChange('tags', e.target.value)} 
            className="p-2 w-full mb-2 border rounded text-black"
          />
          <select
            title="choose-category" 
            value={newMarker.category} 
            onChange={(e) => handleInputChange('category', e.target.value)} 
            className="p-2 w-full mb-2 border rounded text-black"
          >
            <option value="">選擇類別</option>
            {Object.entries(categoryMapping).map(([key, { text }]) => (
              <option key={key} value={key}>{text}</option>
            ))}
          </select>
          <div className="image-uploader p-2 w-full mb-2 border rounded">
          <DropzoneImage onFileUploaded={handleFileUpload} />

          {previewImages.map((src, index) => (
              src ? (
                <div key={index} className="image-preview relative" style={{ width: 300, height: 300 }}  >
                  <Image 
                    src={src}
                    alt={`Uploaded preview ${index}`} 
                    layout="fill" 
                    className="object-cover"
                  />
                  <button 
                    className="absolute top-0 right-0 bg-red-500 text-white p-1"
                    onClick={() => handleRemoveImage(index, src)}
                  >
                    刪除
                  </button>
                </div>
              ) : null
            ))}
            {/* {images.length < 3 && ( */}
              {/* <label className="image-input-label">
                  <div className="image-input-button text-black"> 
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleImageChange} 
                    /> 
                    <span> + </span>
                  </div>
              </label> */}
            {/* )} */}
          </div>
          <div> 
            {formatCoordinates(newMarker.coordinates.lat, newMarker.coordinates.lng)}
          </div>
          <button
            onClick={handleSubmit}
            className="mb-5 mt-5 m-2 bg-green-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-12 w-40 cursor-pointer hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isEditing ? (
              <span>
                <i className="fas fa-check-circle"></i> 確認修改
              </span>
            ) : (
              <span>
                <i className="fas fa-plus-circle"></i> 提交新景點
              </span>
            )}
          </button>

          {isEditing && (
            <button
              onClick={handleCancelEdit}
              className="mb-5 mt-5 m-2 bg-red-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-12 w-40 cursor-pointer hover:border--500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>
                <i className="fas fa-times-circle"></i> 取消編輯
              </span>
            </button>
          )}
        </div>
      )}
    </div>
    <AlertModal 
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          message="您確定要刪除此景點嗎？"
          showConfirmButton={true}
        />
    <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        message={alertMessage}
        showConfirmButton={false}
      />
  </div>
  );
};

export default MapDemoPage;