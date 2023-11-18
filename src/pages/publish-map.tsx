// pages/publish-map.tsx
import React, { useState, useEffect } from 'react';
import PublishArea from '../components/PublishArea'; // 你需要創建這個組件
import Router from 'next/router';
import Image from 'next/image';
// drop-image
import DropzoneImage from '../components/DropzoneImage';

import { useAuth } from '../context/authContext';

// markdown
import dynamic from 'next/dynamic';
// use dynamic loading to avoid SSR error
// import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; 


import firebaseServices from '../utils/firebase';
const { db, auth, storage } = firebaseServices;

import { onAuthStateChanged } from "firebase/auth";

import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
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

const PublishMapPage = () => {
  const [places, setPlaces] = useState([]);
  const [isPublishing, setIsPublishing] = useState(true);
  const [publishedPlaces, setPublishedPlaces] = useState([]);
  // const [userId, setUserId] = useState<string | null>(null);
  const [showPlacesList, setShowPlacesList] = useState(true);

  const { user } = useAuth();

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

  const router = useRouter();

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
    };
  
    // 清除發佈區的所有景點
    const handleClearAll = () => {
      setPublishedPlaces([]);
    };

  // 處理發佈
  const handleConfirmPublish = async () => {

    if (!title.trim() || !content.trim() || publishedPlaces.length === 0 ) {
      alert('請確保所有欄位都已正確填寫。');
      return;
    }

    let uploadedImageUrl = coverImage;
    if (coverImageFile) {
      uploadedImageUrl = await handleUploadCoverImage();
      setCoverImage(uploadedImageUrl);
    }
   
    // 創建要發布的地圖對象
    const mapToPublish = {
      title: title.trim(),
      content: content.trim(),
      coverImage: uploadedImageUrl,
      publishedPlaces: publishedPlaces.map(place => ({
        ...place,
        tags: place.tags || [], // 如果 tags 為 undefined，則使用空數組
      })),
      publishDate: new Date().toISOString(),
      userId: user.uid || 'anonymous',
      likes: 0,
      likedBy: []
    };

    try {
      const userId = user.uid;
      const mapsRef = collection(db, `publishedMaps/${userId}/maps`);
      const docRef = await addDoc(mapsRef, mapToPublish);
      alert('地圖已成功發布！');
      Router.push(`/published-maps/${docRef.id}`);
      setIsPublishing(false);
    } catch (error) {
      console.error('發布地圖出錯：', error);
      alert('發布地圖時發生錯誤。');
    }
    
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

  const handleRemoveFromPublish = (placeId) => {
    setPublishedPlaces(prev => prev.filter(p => p.id !== placeId));
  };

  const handleSelectPlace = (place) => {
    // 點擊列表中的加號時調用
    handleAddToPublish(place);
  };

    // 處理圖片檔案選擇
  const handleCoverImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverImageFile(file); // 儲存檔案對象
      setCoverImagePreview(URL.createObjectURL(file)); // 創建並儲存預覽圖片的 URL
    }
  };

  const handleFileUpload = (file) => {
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
    // 這裡你可以添加上傳邏輯或者將其留在 handleConfirmPublish 中
  };

  // 處理圖片上傳
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
      <div className="flex flex-col md:flex-row h-screen">
        <div className="md:w-2/3 w-full">
          <MapComponentWithNoSSR
            places={places}
            isPublishing={isPublishing}
            onAddToPublish={handleAddToPublish}
            onRemoveFromPublish={handleRemoveFromPublish}
            publishedPlaces={publishedPlaces}
          />
        </div>
        <div className="md:w-1/3 w-full p-4 overflow-auto">
          <div className="flex flex-col controls mb-4">
            {!isPublishing ? (
              <button onClick={() => setIsPublishing(true)}>發佈地圖</button>
            ) : (
              <>
                <button onClick={handleConfirmPublish}>確定發布</button>
                <button onClick={handleCancelPublish}>取消發布</button>
              </>
            )}
            <button 
              className="mb-4 p-2 bg-blue-500 text-white rounded"
              onClick={() => setShowPlacesList(!showPlacesList)} // 切換景點列表的顯示
            >
              {showPlacesList ? '隱藏景點列表' : '顯示景點列表'}

            
            </button>
            <button onClick={handleAddAll}>景點全部新增</button>
            <button onClick={handleClearAll}>景點全部清除</button>
          </div>
          {showPlacesList && (
            <div className="places-list border mt-5">
              {places.map((place) => (
                <div key={place.id} className="place-item flex justify-between items-center">
                  {place.name}
                  <button
                    onClick={() => handleSelectPlace(place)}
                    className="ml-2 bg-blue-500 text-white p-1 rounded"
                  >
                    (+)
                  </button>
                </div>
              ))}
            </div>
          )}
          <PublishArea
            publishedPlaces={publishedPlaces}
            onRemoveFromPublish={handleRemoveFromPublish}
          />
          <div className="mt-10" >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="地圖標題"
              className="mb-2 p-2 w-full border rounded text-black"
            />
            <button onClick={() => setShowSourceCode(!showSourceCode)}>
              {showSourceCode ? "隱藏原始碼" : "顯示原始碼"}
            </button>
            {showSourceCode && (
              <textarea
                title="地圖內容原始碼"
                value={content}
                // readOnly // 如果不希望用戶在這裡編輯，可以設為只讀
                className="mb-2 p-2 w-full border rounded text-black"
              />
            )}
            <div className='bg-white text-black'>
              <ReactQuill theme="snow" value={content} onChange={handleContentChange} />
            </div>
              <label> 代表圖片 </label>
              <input 
                title="trip-avatar"
                id="cover-image" 
                type="file" 
                accept="image/*" 
                onChange={handleCoverImageChange} 
              />
              {/* {coverImagePreview && (
                <div>
                  <Image src={coverImagePreview} alt="Cover Preview" width="300" height="300" />
                  <button onClick={() => setCoverImagePreview('')}>移除圖片</button>
                </div>
              )} */}
       
            <DropzoneImage  onFileUploaded={handleFileUpload} />
            {coverImagePreview && (
              <div>
                <Image src={coverImagePreview} alt="Cover Preview" width="300" height="300" />
                <button onClick={() => setCoverImagePreview('')}>移除圖片</button>
              </div>
            )}
          </div>
        </div>
      </div>
     </DndProvider>
  );
};

export default PublishMapPage;