import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, getDocs, updateDoc, getDoc, addDoc, where, doc, setDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import firebaseServices from '../../utils/firebase'; 
const { db, auth, storage } = firebaseServices; 

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
}

// const storage = getStorage();

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

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setUserId(user.uid); // 如果用戶已登入，保存用戶 ID
      }
    });

    return () => unsubscribe();
  }, []);

  // 更新 places 資料
  useEffect(() => {
    if (userId) {
      const fetchPlaces = async () => {
        // const userRef = doc(db, 'users', userId);
        const placesQuery = query(collection(db, `users/${userId}/places`));
        // const placesRef = collection(userRef, 'places');
        // const places = placeSnapshots.docs.map(doc => doc.data());
        // setPlaces(places);
        const querySnapshot = await getDocs(placesQuery);
        setPlaces(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
  
      fetchPlaces();
    }
  }, [userId]);

  const handleMarkerPlaced = (latlng) => {
    setNewMarker({ latlng, name: '', description: '', tags: '', category: '', images: [] });
  };

  const handleDeletePlace = async () => {
    if (window.confirm('您確定要刪除此景點嗎？') && selectedPlace) {
      const placeRef = doc(db, `users/${userId}/places`, selectedPlace.id);
      await deleteDoc(placeRef);
      setSelectedPlace(null);
      setPlaces(prevPlaces => prevPlaces.filter(place => place.id !== selectedPlace.id));
    }
  };

  const handleInputChange = (field, value) => {
    setNewMarker(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      setImages(selectedFiles); // 存儲文件對象以進行上傳
      const selectedFilesUrls = selectedFiles.map(file => URL.createObjectURL(file))
      setPreviewImages(selectedFilesUrls); // 產生並存儲預覽 URL
    }
  };
  // cancel adding sites
  const handleCancel = () => {
    setIsAddingMarker(false);
    setNewMarker(null);
    // if (newMarker) {
    //   newMarker.remove(); 
    // }
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
      latlng: place.coordinates,
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

  const updatePlace = async (placeId: string) => {


    if (!newMarker || !userId || !selectedPlace) return;

    //  刪除原有圖片，包含 Storage 和 Firestore
    // const imagesToDelete = originalImageUrls.filter(originalUrl => !newMarker.imageUrls.includes(originalUrl));

    function extractStoragePathFromUrl(downloadUrl: string): string {
      const url = new URL(downloadUrl);
      const path = url.pathname;
    
      // Remove the "/o/" prefix and decode the URI component
      const decodedPath = decodeURIComponent(path).split('/o/')[1];
    
      // Return the path without the token query parameter
      return decodedPath.split('?')[0];
    }

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

    //firestore 刪除圖片
    async function removeImageFromFirestore(placeId, imageUrl, userId) {
      console.log(`Removing image URL from Firestore: ${imageUrl}`);
    
      const placeRef = doc(db, `users/${userId}/places`, placeId);
    
      // Get the document data before updating
      const placeSnap = await getDoc(placeRef);
      if (placeSnap.exists()) {
        const placeData = placeSnap.data();
        const imageUrls = placeData.images || [];
        console.log(`Original image URLs: ${imageUrls}`);
        console.log(`Image URL is in original image URLs: ${imageUrls.includes(imageUrl)}`);
    
        // Create a new images array that does not include the image URL
        const newImages = imageUrls.filter((url) => url !== imageUrl);
    
        await updateDoc(placeRef, { images: newImages });
    
        // Add a delay before fetching the updated document
        await new Promise((resolve) => setTimeout(resolve, 1000));
    
        // Fetch the document again and log the entire document
        const updatedPlaceSnap = await getDoc(placeRef);
        if (updatedPlaceSnap.exists()) {
          const updatedPlaceData = updatedPlaceSnap.data();
          console.log(`Updated document data: `, updatedPlaceData);
        }
      }
    }
    
    // 上傳新圖片並取得URLs
    const newImageUrls = await Promise.all(
      images.map(file => uploadImage(file, userId, placeId))
    );

        
    // const updatedImages = [...previewImages.filter(url => !url.startsWith('blob')), ...imageUrls];
    // const updatedImages = [...(newMarker.imageUrls || []), ...imageUrls];
    const updatedImages = [...(newMarker.images), ...newImageUrls];

    const updatedPlaceData = {
      ...newMarker,
      images: updatedImages,
      tags: newMarker.tags.split(',').map(tag => tag.trim()),
    };

    const placeRef = doc(db, `users/${userId}/places`, placeId);
    await setDoc(placeRef, updatedPlaceData, { merge: true });

    setPlaces(prevPlaces => prevPlaces.map(place => 
      // place.id === selectedPlace.id ? { ...place, ...updatedPlaceData } : place
      place.id === placeId ? { ...place, ...updatedPlaceData } : place
    )); 

    const imagesToDelete = originalImageUrls.filter(url => !previewImages.includes(url));

    const deletePromises = imagesToDelete.map(async(url) => {

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
      
    });
    
    await Promise.all(deletePromises);

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
          lat: newMarker.latlng.lat,
          lng: newMarker.latlng.lng
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


  // function ImageUploader({ images, setImages }) {
  //   const handleImageChange = (e) => {
  //     const files = Array.from(e.target.files);
  //     setImages(prevImages => [...prevImages, ...files]);
  //   };
  // }

  return (
    <div className="flex flex-col md:flex-row h-screen" style={{ paddingTop: "-50px" }}>
      <div className="w-full md:w-2/3 flex justify-center items-center">
        <MapComponentWithNoSSR 
          onMarkerPlaced={handleMarkerPlaced}
          isAddingMarker={isAddingMarker} 
          isEditing={isEditing}
          places={places} 
          onCancel={handleCancel}
          onMarkerClick={setSelectedPlace}
          onMapClick={() => setSelectedPlace(null)}
          selectedPlace={selectedPlace}
        />
      </div>
      
      <div className="w-full md:w-1/3 flex flex-col p-4 space-y-4 overflow-auto">
        {!isEditing && (
          <>
          <button
            onClick={() => setIsAddingMarker(!isAddingMarker)} // 切換 isAddingMarker 的值
            className="p-2 bg-blue-500 text-white rounded"
          >
            {isAddingMarker ? '取消新增景點' : '新增景點'}
          </button>
          <button 
            className="mb-4 p-2 bg-blue-500 text-white rounded"
            onClick={() => setShowPlacesList(!showPlacesList)} // 切換景點列表的顯示
          >
            景點列表
          </button>
          {showPlacesList && (
            <div className="places-list">
              {places.map((place) => (
                <div key={place.id} className="place-item" onClick={() => handlePlaceSelect(place)}>
                  {place.name}
                </div>
              ))}
            </div>
          )}
          </>
        )}

        {selectedPlace && !isEditing && (
          <>
            <button onClick={() => handleEditClick(selectedPlace)}>編輯景點</button>
            <button onClick={handleDeletePlace}>刪除景點</button>
            <div>
              <h2>名稱：{selectedPlace.name}</h2>
              <p>描述：{selectedPlace.description}</p>

              <div className="image-preview relative" style={{ width: 300, height: 300 }}>
              {selectedPlace.images.map((url, index) => (
                <Image 
                  key={index} 
                  src={url}
                  alt={`${selectedPlace.name} image ${index}`} 
                  layout="fill" 
                  className="object-cover" // 使用 CSS 類別來控制尺寸和填充方式
                />
              ))}
              </div>
              {/* <div className="images">
                {selectedPlace.images.map((url, index) => (
                  <Image key={index} src={url} alt={`${selectedPlace.name} image ${index}`} height={300} width={300} />
                ))}
              </div> */}
            </div>
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
              value={newMarker.category} 
              onChange={(e) => handleInputChange('category', e.target.value)} 
              className="p-2 w-full mb-2 border rounded text-black"
            >
              <option value="">選擇類別</option>
              <option value="eat">吃的</option>
              <option value="play">玩的</option>
            </select>
            <div className="image-uploader p-2 w-full mb-2 border rounder">

             {/* {newMarker?.imageUrls?.map((url, index) => (  */}
              {/* { images.map((image, index) => ( */}
              {previewImages.map((src, index) => (
                src ? (
                  <div key={index} className="image-preview relative" style={{ width: 300, height: 300 }}  >
                    <Image 
                      src={src}
                      alt={`Uploaded preview ${index}`} 
                      layout="fill"  //objectFit
                      className ="object-cover"
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
              {images.length < 3 && (
                <label className="image-input-label">
                  <button className="image-input-button text-black"> 
                  <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleImageChange} 
                  /> 
                  <span> + </span>
                  </button>
                </label>
              )}
            </div>
            <button 
              onClick={handleSubmit} 
              className="p-2 w-full text-white bg-green-500 rounded hover:bg-green-600 "
            >
              {isEditing ? '確認修改' : '提交新景點'}
            </button>
            {isEditing && (
              <button 
                onClick={handleCancelEdit}
                className="p-2 w-full text-white bg-red-500 rounded hover:bg-red-600 mt-2"
              >
                取消編輯
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapDemoPage;