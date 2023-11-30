// pages/publish-map.tsx
import React, { useState, useEffect } from 'react';
import PublishArea from '../components/PublishArea'; // 你需要創建這個組件
import Router from 'next/router';
import Image from 'next/image';
// drop-image
import DropzoneImage from '../components/DropzoneImage';

import { useAuth } from '../context/AuthContext';

import dynamic from 'next/dynamic';
// use dynamic loading to avoid SSR error

// markdown
import 'react-quill/dist/quill.snow.css'; 

import firebaseServices from '../utils/firebase';
const { db, auth, storage } = firebaseServices;

import { onAuthStateChanged } from "firebase/auth";

import { collection, query, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { useDrag } from 'react-dnd';
import { useRouter } from 'next/router';

import { Place } from '../types/Place';

const MapComponentWithNoSSR = dynamic(
    () => import('../components/MapComponent'),
    { ssr: false }
);

const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});

const AlertModal = ({ isOpen, onClose, onConfirm = ()=> {}, message, showConfirmButton = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <p className="text-black">{message}</p>
        <div className="flex justify-end space-x-4">
          {showConfirmButton && (
            <button onClick={onConfirm} className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600">
              確認發佈？
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

const PublishMapPage = () => {
  const [places, setPlaces] = useState([]);
  const [isPublishing, setIsPublishing] = useState(true);
  const [publishedPlaces, setPublishedPlaces] = useState([]);
  // const [userId, setUserId] = useState<string | null>(null);
  const [showPlacesList, setShowPlacesList] = useState(true);

  const [selectedPlace, setSelectedPlace] = useState(null);

  const handleMarkerClick = (place) => {
    setSelectedPlace(place);
  };

  const { user } = useAuth();

  const router = useRouter();

  // content 
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [publishDate, setPublishDate] = useState('');
  
  //show source code
  const [showSourceCode, setShowSourceCode] = useState(false);

  // images 
  const [coverImageFile, setCoverImageFile] = useState(null); // 用於上傳的檔案對象
  const [coverImagePreview, setCoverImagePreview] = useState(''); // 用於顯示預覽圖片的 URL

  const [areAllPlacesAdded, setAreAllPlacesAdded] = useState(false);

  // alert&confirm
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };
  
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, user => {
  //     if (user) {
  //       setUserId(user.uid); 
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, `users/${user.uid}/places`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const placesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlaces(placesData);
    });
    return () => unsubscribe();
  }, [user]);

  // const handleAddClick = (place) => {
  //   if (!publishedPlaces.some(p => p.id === place.id)) {
  //     setPublishedPlaces([...publishedPlaces, place]);
  //   }
  // };

    const handleContentChange = (content) => {
      setContent(content);
    };

    // 添加全部景點到發佈區
    const handleAddAll = () => {
      setPublishedPlaces(places);
      setAreAllPlacesAdded(true);
    };
  
    // 清除發佈區的所有景點
    const handleClearAll = () => {
      setPublishedPlaces([]);
      setAreAllPlacesAdded(false);
    };

  // 處理發佈
  const handleConfirmPublish = async () => {

    if (!title.trim() || !content.trim() || publishedPlaces.length === 0 ) {
      showAlert('請確保已正確填寫標題跟內容，並且至少有一個發佈景點加入發佈區。');
      return;
    }
   
    try {
      // const userId = user.uid;
      // const mapsRef = collection(db, `publishedMaps/${userId}/maps`);
      // const docRef = await addDoc(mapsRef, mapToPublish);
      // alert('地圖已成功發布！');

      // showAlert('地圖已成功發布！');
      setShowPublishConfirm(true);
    } catch (error) {
      console.error('發布地圖出錯：', error);
      // alert('發布地圖時發生錯誤。');
      showAlert('發布地圖時發生錯誤。');
    }
    
  };

  const confirmPublish = async () => {

    let uploadedImageUrl = coverImage;
    if (coverImageFile) {
      uploadedImageUrl = await handleUploadCoverImage();
      setCoverImage(uploadedImageUrl);
    }

    const mapRef = doc(collection(db, 'publishedMaps', user.uid, 'maps'));
    await setDoc(mapRef, {
      title: title.trim(),
      content: content.trim(),
      coverImage: uploadedImageUrl,
      publishDate: new Date().toISOString(),
      userId: user.uid,
      likes: 0,
      likedBy: [],
      duplicates: 0,
      duplicatedBy: [],
      placesLikes: 0,
      placesLikedBy: [],
    });

    const newPublishedPlaces = [];
    for (const place of publishedPlaces) {
      const placeRef = doc(collection(db, 'publishedMaps', user.uid, 'maps', mapRef.id, 'places'));
      const placeData =  {
        ...place,
        coordinates: {
          lat: place.coordinates.lat, 
          lng: place.coordinates.lng
        },
        likes: 0,
        likedBy: [],
        duplicates: 0,
        duplicatedBy: []
      };
      console.log(placeData);
      await setDoc(placeRef, placeData);
      newPublishedPlaces.push({ ...place, id: placeRef.id });
    }
    
    setPublishedPlaces(newPublishedPlaces);

    setIsPublishing(false);


    Router.push(`/publishedMaps/${user.uid}/maps/${mapRef.id}`);    
  };

  const handleCancelPublish = (place) => {

    setIsPublishing(false);
    // 清除已選擇發布的地點
    setPublishedPlaces([]);
    // 導航回 map/index.tsx 頁面
    Router.push('/map/');
  };

  const handleAddToPublish = (place) => {
    // 假設 placeId 是一個對象而不僅僅是 ID

    if (!publishedPlaces.some(p => p.id === place.id)) {
      setPublishedPlaces(prevPlaces => [...prevPlaces, place]);
    }
  };


  const handleSelectPlace = (place) => {
    setSelectedPlace(place); // 更新選中的景點
  };


  const handleRemoveFromPublish = (placeId) => {
    setPublishedPlaces(prev => prev.filter(p => p.id !== placeId));
  };

  const handleAddPlace = (place) => {
    handleAddToPublish(place);
  };

  const handleFileUpload = (file) => {
    // const file = event.target.files[0];
    // if (file) {
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  // }
  };

  const handleUploadCoverImage = async (): Promise<string> => {
    if (!coverImageFile || !user.uid) return;

    const storageRef = ref(storage, `covers/${user.uid}/${coverImageFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, coverImageFile);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // 可以用 snapshot.bytesTransferred 和 snapshot.totalBytes 更新上傳進度
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL as string); // 當上傳完成後，解析圖片的 URL
          });
        }
      );
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen-without-navbar md:flex-row text-black bg-gray-200">
        <div className="md:w-2/3 w-full lg:m-10 md:m-5 m-0 border">
          <MapComponentWithNoSSR
            places={places}
            isPublishing={isPublishing}
            onAddToPublish={handleAddToPublish}
            onRemoveFromPublish={handleRemoveFromPublish}
            publishedPlaces={publishedPlaces}
            onMarkerClick={setSelectedPlace}
            selectedPlace={selectedPlace} 
          />
        </div>
        <div className="lg:overflow-auto md:overflow-auto md:w-1/3 w-full lg:mb-10 lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5 lg:p-8 md:p-4 p-10 bg-white shadow rounded">
          <h1 className="text-2xl font-bold text-gray-800 mb-4"> {user.name}即將發佈地圖</h1>
          <div className="text-gray-600 mb-5"> 
            新增你想發佈的景點群。你也可拖曳圖標 (Marker) 以加入發佈地點。
            並輸入本地圖的標題、內容、上傳封面照片(可選)。
          </div>
          <div className="flex flex-col w-full lg:w-auto lg:flex-row md:flex-col mb-4 controls">
            {!isPublishing ? (
              <button className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300" onClick={() => setIsPublishing(true)}>
                <i className="fas fa-map-marked-alt"></i> 發佈地圖
              </button>
            ) : (
              <>
                <button 
                  className="mb-5 mt-5 m-2 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-20 w-32 cursor-pointer hover:border-gray-500 hover:bg-green-300"
                  onClick={handleConfirmPublish}>
                  <i className="fas fa-check mr-2"></i>
                  <div>確定發布</div>
                </button>
                <button 
                    className="mb-5 mt-5 m-2 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-20 w-32 cursor-pointer hover:border-gray-500 hover:bg-gray-200" 
                    onClick={handleCancelPublish}>
                  <i className="fas fa-times mr-2"></i>
                  <div>取消發布</div>
                </button>
              </>
            )}
            <button 
                className="mb-5 mt-5 m-2 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-20 w-32 cursor-pointer hover:border-gray-500 hover:bg-blue-200" 
                onClick={() => setShowPlacesList(!showPlacesList)}>
              <i className={`fas ${showPlacesList ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              <div>{showPlacesList ? '隱藏景點列表' : '顯示景點列表'}</div>
           </button>
          </div>
          {showPlacesList && (
            <div className="places-list border mt-5">
                   <ul>
              {places.map((place) => (
                  <li key={place.id} className="cursor-pointer place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 hover:bg-green-100"
                      onClick={() => handleSelectPlace(place)}>
                    <span className="text-gray-600 cursor-pointer" > {place.name}</span>
                    <button
                      title="add-to-publish"
                      onClick={() => handleAddPlace(place)}
                      className="ml-2 bg-green-500 text-white p-2 pl-4 pr-4 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </li>
              ))}
               </ul>
            </div>
          )}
          
          <span> 你也可拖曳圖標 (Marker) 以加入發佈地點</span>
          <button 
            className={`mb-5 mt-5 m-2 flex flex-col justify-center items-center border-2 border-dashed ${areAllPlacesAdded ? 'border-red-300 hover:bg-red-300' : 'border-gray-300 hover:bg-green-300'} rounded-lg h-20 w-32 cursor-pointer hover:border-gray-500`}
            onClick={areAllPlacesAdded ? handleClearAll : handleAddAll}
          >
            <i className={`fas ${areAllPlacesAdded ? 'fa-minus-square text-red-500' : 'fa-plus-square text-green-500'} mr-2 mb-2`}></i>
            <div>{areAllPlacesAdded ? '景點全部清除' : '景點全部新增'}</div>
          </button>
          <PublishArea
            publishedPlaces={publishedPlaces}
            onRemoveFromPublish={handleRemoveFromPublish}
            onSelectPlace={setSelectedPlace} 
          />
          <div className="mt-10" >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="地圖標題"
              className="mb-2 p-2 w-full border rounded text-black focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <div className="bg-white text-black">
              <ReactQuill theme="snow" value={content} onChange={handleContentChange} />
            </div>
            <button 
              className="mb-5 mt-5  flex justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-14 w-40 cursor-pointer hover:border-gray-500 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={() => setShowSourceCode(!showSourceCode)}
            >
              <i className={`fas ${showSourceCode ? 'fa-eye-slash' : 'fa-eye'} mr-2`}></i>
              <div>{showSourceCode ? "隱藏原始碼" : "顯示原始碼"}</div>
            </button>

            {showSourceCode && (
              <textarea
                title="地圖內容原始碼"
                value={content}
                // readOnly // 如果不希望用戶在這裡編輯，可以設為只讀
                className="mb-2 p-2 w-full border rounded text-black"
              />
            )}
              <div> 代表圖片 </div>
              {/* {coverImagePreview && (
                <div>
                  <Image src={coverImagePreview} alt="Cover Preview" width="300" height="300" />
                  <button onClick={() => setCoverImagePreview('')}>移除圖片</button>
                </div>
              )} */}

            <DropzoneImage onFileUploaded={handleFileUpload} />
            {coverImagePreview && (
            <div className="relative mt-2 mb-10 w-full h-60">
                <Image src={coverImagePreview} alt="Cover Preview" 
                fill className="object-cover" />
                <button className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full hover:bg-red-700"
                        onClick={() => setCoverImagePreview('')}>
                  移除圖片
                </button>
              </div>
              )}
          </div>
        </div>
      </div>
      <AlertModal 
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        onConfirm={confirmPublish}
        message="您確定要發佈此地圖嗎？"
        showConfirmButton={true}
      />
      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        message={alertMessage}
        showConfirmButton={false}
      />
    </DndProvider>
  );
};

export default PublishMapPage;