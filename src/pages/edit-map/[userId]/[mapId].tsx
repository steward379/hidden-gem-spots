// pages/edit-map/[userId]/[mapId].tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import firebaseServices from  '../../../utils/firebase';
const { db, auth, storage } = firebaseServices;
import { useAuth } from '../../../context/authContext';

import 'react-quill/dist/quill.snow.css'; 

const MapComponentWithNoSSR = dynamic(
    () => import('../../../components/MapComponent'),
    { ssr: false }
);

const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});

const EditMap = () => {
  
  const router = useRouter();

  const { user } = useAuth();

  const userId = user.uid

  const { mapId } = router.query;
  
  const [mapData, setMapData] = useState({ title: '', content: '' });

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showSourceCode, setShowSourceCode] = useState(false);

  // 圖片處理
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');

  // 切換原始碼顯示
  const toggleSourceCode = () => {
    setShowSourceCode(!showSourceCode);
  };

  // 處理圖片選擇
  const handleCoverImageChange = (event) => {
      const file = event.target.files[0];

      if (file) {
          setCoverImageFile(file);
          setCoverImagePreview(URL.createObjectURL(file));
      }
  };

  // 刪除當前圖片
  const handleRemoveImage = () => {
      setCoverImageFile(null);
      setCoverImagePreview('');
      setMapData({ ...mapData, coverImage: '' });
  };

  //get map
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
    
            setMapData(mapDetails);  // 使用包含作者名字的數據
          } else {
            console.log('找不到地圖資料');
          }
        }
    };

    fetchMapData();
  }, [mapId, userId]);

  const handleMarkerClick = (place) => {
    setSelectedPlace(place);
  };

  if (!mapData) return <div>載入中...</div>;

  // 保存變更
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (typeof mapId === 'string' && typeof userId === 'string') {
      const mapRef = doc(db, `publishedMaps/${userId}/maps`, mapId);
      await updateDoc(mapRef, {
        title: mapData.title,
        content: mapData.content,
        publishDate: new Date().toISOString() 
      });

      router.push(`/publishedMaps/${userId}/maps/${mapId}`);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
        <div className="md:w-2/3 w-full">
        <MapComponentWithNoSSR 
            places={mapData.publishedPlaces}
            onMarkerClick={handleMarkerClick}
        />
        </div>
        
        <div className="bg-white text-black md:w-1/3 w-full p-4 overflow-auto">
            <form onSubmit={handleSubmit}>
                <label> 標題更改 </label>
                <input
                    className="text-black"
                    title="標題"
                    type="text"
                    value={mapData.title}
                    onChange={(e) => setMapData({ ...mapData, title: e.target.value })}
                />
                <label> 內容更改 </label>

                <div className='bg-white text-black'>
                    <button onClick={toggleSourceCode}>
                    {showSourceCode ? "隱藏原始碼" : "顯示原始碼"}
                    </button>
                    {showSourceCode && (
                    <textarea
                        title="source-content"
                        className="mb-2 p-2 w-full border rounded text-black"
                        value={mapData.content}
                        onChange={(e) => setMapData({ ...mapData, content: e.target.value })}
                    />
                    )}
                    <ReactQuill theme="snow" value={mapData.content} onChange={(e) => setMapData({ ...mapData, content: e })} />
                </div>
                <textarea
                    className="text-black"
                    title="內容"
                    value={mapData.content}
                    onChange={(e) => setMapData({ ...mapData, content: e.target.value })}
                />
                <label> 變更封面圖片 </label>
                <input 
                    title="cover-photo"
                    type="file" 
                    accept="image/*" 
                    onChange={handleCoverImageChange} 
                />
                {coverImagePreview && (
                    <div>
                        <Image src={coverImagePreview} alt="Cover Preview" width="300" height="300" />
                        <button onClick={handleRemoveImage}>移除圖片</button>
                    </div>
                )}
                <button type="submit">保存變更</button>
            </form>
        </div>
    </div>
  );
};

export default EditMap;