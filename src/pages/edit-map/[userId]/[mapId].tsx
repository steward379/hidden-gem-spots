// pages/edit-map/[userId]/[mapId].tsx
import { useRouter } from 'next/router';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
// redux
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from  '../../../store/store';
import { setMapDataRedux } from '../../../store/slices/mapSlice';
// firebase
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import firebaseServices from  '../../../utils/firebase';
const { db, storage } = firebaseServices;
import { useAuth } from '../../../context/AuthContext';
// component, dnd
import DropzoneImage from '../../../components/DropzoneImage';
import LoadingIndicator from '@/src/components/LoadingIndicator';
// static
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

  const { mapId } = router.query;

  const reduxMapData = useSelector((state: RootState) => state.map.mapDataRedux);
  
  const [mapData, setMapData] = useState(null);

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [showSourceCode, setShowSourceCode] = useState(false);

  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      if (reduxMapData) {

        setMapData(reduxMapData);
        setCoverImagePreview(reduxMapData.coverImage || '');

      } else if (typeof mapId === "string" && typeof user.uid === "string") {
        const mapRef = doc(db, `publishedMaps/${user.uid}/maps`, mapId);
        const docSnap = await getDoc(mapRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const mapDetails = {
            title: data.title || '',
            content: data.content || '',
            coverImage: data.coverImage || '',
            authorName: '', // 初始化 authorName
            publishedPlaces: [] // 初始化 publishedPlaces
          };
          const authorRef = doc(db, 'users', user.uid);
          const authorSnap = await getDoc(authorRef);
          if (authorSnap.exists()) {
            mapDetails.authorName = authorSnap.data().name || '未知';
          }
          const placesRef = collection(db, `publishedMaps/${user.uid}/maps/${mapId}/places`);
          const placesSnap = await getDocs(placesRef);
          mapDetails.publishedPlaces = placesSnap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id 
          }));

          setMapData(mapDetails); 
          setCoverImagePreview(data.coverImage || '');
        } else {
          console.log('找不到地圖資料');
        }
      }
    };

    fetchMapData();

  }, [mapId, user.uid, reduxMapData]);

  const toggleSourceCode = () => {
    setShowSourceCode(!showSourceCode);
  };

  const handleFileUpload = (file) => {
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const handleCoverImageChange = (event) => {
      const file = event.target.files[0];

      if (file) {
          setCoverImageFile(file);
          setCoverImagePreview(URL.createObjectURL(file));
      }
  };

  const handleRemoveImage = () => {
      setCoverImageFile(null);
      setCoverImagePreview('');
      setMapData({ ...mapData, coverImage: '' });
  };

  const handleMarkerClick = (place) => {
    setSelectedPlace(place);
  };

  if (!mapData) {
    return <LoadingIndicator />;
  }

  const  uploadImageToStorage = async (file) => {
    if (!file || !user.uid) return null;
  
    const storageRef = ref(storage, `covers/${user.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
  
    try {
      await uploadTask;
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('上傳圖片時發生錯誤: ', error);
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    let coverImageURL = coverImagePreview;
    if (coverImageFile) {
      coverImageURL = await uploadImageToStorage(coverImageFile);
    }

    if (typeof mapId === 'string') {
      const mapRef = doc(db, `publishedMaps/${user.uid}/maps`, mapId);
      await updateDoc(mapRef, {
        title: mapData.title,
        content: mapData.content,
        coverImage: coverImageURL,
        publishDate: new Date().toISOString()
      });

      router.push(`/publishedMaps/${user.uid}/maps/${mapId}`);
    }
  };

  const resetChanges = () => {
    setMapData({ title: '', content: '', coverImage: '',authorName: '', publishedPlaces: [] });
    setCoverImageFile(null);
    setCoverImagePreview('');
    setShowSourceCode(false);

    router.back();
  };

  return (
    <div className="flex flex-col h-screen-without-navbar md:flex-row text-black bg-gray-200">
        <div className="lg:w-2/3 md:w-1/2 w-full lg:m-10 md:m-5 m-0 border">
          <MapComponentWithNoSSR 
              places={mapData.publishedPlaces}
              onMarkerClick={handleMarkerClick}
          />
        </div>
        
        <div className="lg:overflow-auto md:overflow-auto lg:w-1/3 md:w-1/2 w-full lg:mb-10 lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5 lg:p-8 md:p-4 p-10 bg-white shadow rounded">
            <form onSubmit={handleSubmit}>
                    <div> 標題更改 </div>
                    <input
                        className="text-black border rounded mb-2 w-full"
                        title="map-title"
                        type="text"
                        value={mapData.title}
                        onChange={(e) => setMapData({ ...mapData, title: e.target.value })}
                    />
                    <div><label> 內容更改 </label></div>
                    <button type="button" onClick={toggleSourceCode} className="mt-2 mb-5 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700">
                      {showSourceCode ? "隱藏原始碼" : "顯示原始碼"}
                    </button>
                    {showSourceCode && (
                    <textarea
                        title="map-source-content"
                        className="mb-2 p-2 w-full border rounded text-black"
                        value={mapData.content}
                        onChange={(e) => setMapData({ ...mapData, content: e.target.value })}
                    />
                    )}
                    <ReactQuill theme="snow" value={mapData.content} onChange={(e) => setMapData({ ...mapData, content: e })} />
                {/* <textarea
                    className="text-black"
                    title="map-content"
                    value={mapData.content}
                    onChange={(e) => setMapData({ ...mapData, content: e.target.value })}
                /> */}
                <div className="mb-4">
                  <label> 變更封面圖片 </label>
                  {/* <input 
                      title="cover-photo"
                      type="file" 
                      accept="image/*" 
                      onChange={handleCoverImageChange} 
                  /> */}
                  <DropzoneImage onFileUploaded={handleFileUpload} />
                  {coverImageFile ? (
                    <span className="ml-4">{coverImageFile.name}</span>
                  ) : (
                    <span className="ml-4 text-gray-500">沒有選擇檔案</span>
                  )}
                 {coverImagePreview && (
                    <div className="relative mt-2 mb-10 w-full h-60">
                      <Image src={coverImagePreview} alt="Cover Preview" 
                            fill className="object-cover" />
                      <button onClick={handleRemoveImage} className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full hover:bg-red-700">
                        移除圖片
                      </button>
                    </div>
                  )}
                  <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700">
                    保存變更
                  </button>
                  <button type="button" onClick={resetChanges} className="ml-4 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-700">
                    取消變更
                  </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default EditMap;