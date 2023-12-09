// pages/edit-map/[userId]/[mapId].tsx
import { useRouter } from 'next/router';
import Image from 'next/image';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
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
import AlertModal from '@/src/components/AlertModal';
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

  const [tags, setTags] = useState('');

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [showSourceCode, setShowSourceCode] = useState(false);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmFunction, setConfirmFunction] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      if (reduxMapData) {
        setMapData(reduxMapData);
        setTags(reduxMapData.tags.join(', ')); 
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

  const handleFileUpload = (file) => {
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  // const handleCoverImageChange = (event) => {
  //     const file = event.target.files[0];

  //     if (file) {
  //         setCoverImageFile(file);
  //         setCoverImagePreview(URL.createObjectURL(file));
  //     }
  // };

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

    const tagsArray = tags.split(',').map(tag => tag.trim());

    if (typeof mapId === 'string') {
      const mapRef = doc(db, `publishedMaps/${user.uid}/maps`, mapId);
      await updateDoc(mapRef, {
        title: mapData.title,
        content: mapData.content,
        tags: tagsArray, 
        coverImage: coverImageURL,
        publishDate: mapData.publishDate,
        updatedDate : new Date().toISOString()
      });

      router.push(`/publishedMaps/${user.uid}/maps/${mapId}`);
    }
  };

  const resetChanges = () => {
    setConfirmMessage('您確定要取消發佈嗎？文章將清空');
    setConfirmFunction(()=>confirmResetChanges);
    setShowResetConfirm(true);
  };

  const confirmResetChanges  = () => {
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

            <button
              className="p-2 mb-5 rounded-3xl flex-column justify-center items-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-500 hover:bg-gray-200"
              onClick={resetChanges}>
              <i className="fas fa-circle-arrow-left"></i>
              <span className="ml-1.5 hidden lg:inline-block text-sm">取消變更</span>
            </button>
            <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="font-medium text-lg"> 標題更改 </div>
                    <input
                        className="text-black border rounded mb-2 w-full p-2"
                        title="map-title"
                        type="text"
                        value={mapData.title}
                        onChange={(e) => setMapData({ ...mapData, title: e.target.value })}
                    />
                    <div className="font-medium text-lg mb-3"><label> 內容更改 </label></div>

                    <ReactQuill theme="snow" value={mapData.content} onChange={(e) => setMapData({ ...mapData, content: e })} />

                    <button
                      type="button"
                      className={`mb-5  p-3 flex justify-center items-center rounded-lg 
                  cursor-pointer ${showSourceCode ? 'hover:bg-red-100 bg-gray-200' : 'hover:bg-green-200 bg-green-100'}
                  focus:outline-none focus:ring-2 focus:ring-blue-300`}
                      onClick={() => setShowSourceCode(!showSourceCode)}
                    >
                      <i className={`fas ${showSourceCode ? 'fa-eye-slash' : 'fa-eye'} mr-2`}></i>
                      <div>{showSourceCode ? "隱藏原始碼" : "顯示原始碼"}</div>
                    </button>
                    
                    {showSourceCode && (
                    <textarea
                        title="map-source-content"
                        className="mb-2 p-2 w-full border rounded text-black"
                        value={mapData.content}
                        onChange={(e) => setMapData({ ...mapData, content: e.target.value })}
                    />
                    )}

                    <label className="font-medium text-lg mb-3"> Tags 更改 </label>
                    <input 
                      className="text-black border rounded mb-2 w-full p-2"
                      title="map-tags"
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Tag1, Tag2, Tag3"
                    />
                {/* <textarea
                    className="text-black"
                    title="map-content"
                    value={mapData.content}
                    onChange={(e) => setMapData({ ...mapData, content: e.target.value })}
                /> */}
                <div className="mb-4 text-lg font-medium">
                  <label className="font-medium text-lg mb-3"> 變更封面圖片 </label>
                  {/* <input 
                      title="cover-photo"
                      type="file" 
                      accept="image/*" 
                      onChange={handleCoverImageChange} 
                  /> */}
                  <DropzoneImage onFileUploaded={handleFileUpload} />
                  {coverImageFile ? (
                    <div className="mb-5">{coverImageFile.name}</div>
                  ) : (
                    <div className="text-gray-500 mb-5 text-sm">沒有選擇檔案</div>
                  )}
                 {coverImagePreview && (
                    <div className="relative mt-2 mb-10 w-full h-300 w-100 overflow-hidden">
                      <LazyLoadImage effect="blur"src={coverImagePreview} alt="Cover Preview" 
                                  width={400}
                                  height={250} 
                                  className="object-cover"
                                  layout="responsive"
                                    />
                      <button onClick={handleRemoveImage} className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full hover:bg-red-700">
                        移除圖片
                      </button>
                    </div>
                  )}
                  <button type="submit" className="mb-3 m-2 bg-green-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-12 w-40 cursor-pointer hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                    <i className="fas fa-check-circle mr-1"></i> 保存變更
                  </button>
                  <button type="button" onClick={resetChanges} className="mb-5 m-2 bg-red-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-12 w-40 cursor-pointer hover:border--500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                    <i className="fas fa-times-circle mr-1"></i>取消變更
                  </button>
                </div>
            </form>
        </div>
        <AlertModal
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          onConfirm={confirmFunction}
          message={confirmMessage}
          showConfirmButton={true}
        />
    </div>
  );
};

export default EditMap;