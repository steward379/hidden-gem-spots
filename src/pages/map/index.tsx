// map/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import Image from 'next/image';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Link from 'next/link';
import { collection, query, onSnapshot, getDocs, updateDoc, getDoc, 
  addDoc, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import firebaseServices from '../../utils/firebase'; 
const { db, storage } = firebaseServices; 

import { useAuth } from '../../context/AuthContext';
import AlertModal from '../../components/AlertModal'
import DropzoneImage from '../../components/DropzoneImage';
import GooglePlaces from '../../components/GooglePlaces';
// import UploadKMZ from '../../components/UploadKMZ';
import { KmzFileUploader } from '../../components/KmzFileUploader';
import KmzPlacesList  from '../../components/KmzPlacesList';
import { parseFile } from '@/src/utils/kmzKmlParser';

import { useDispatch } from 'react-redux';
import { setPlacesRedux } from '../../store/slices/placesSlice';
import { categoryMapping } from '../../constants';
import { formatCoordinates, decimalToDms } from '../../utils/decimalCoordinates'

import RainbowButtonModule from '@/src/styles/rainbowButton.module.css';
// import { Place } from '../../types/Place';
// import { NewMarkerData } from '../../types/NewMarkerData';
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
  createdTime?: string;
  updatedTime?: string;
  likes?: number;
  likedBy?: string[];
  duplicates?: number;
  duplicatedBy?: string[];
}
const MapComponentWithNoSSR = dynamic(
  () => import('../../components/MapComponent'),
  { ssr: false }
);
const MapDemoPage: React.FC = () => {

  const [file, setFile] = useState(null);
  const [kmzPlaces, setKmzPlaces] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
  };
  const handleUploadClick = async () => {
    confirm("確定要匯入嗎？")
    if (file) {
      setIsProcessing(true);
      try {
        const extractedPlaces = await parseFile(file);
        setKmzPlaces(extractedPlaces as any);
  
        const placesRef = collection(db, `users/${userId}/places`);
        (extractedPlaces as any).forEach(async (place) => {
          await addDoc(placesRef, place);
        });

        await fetchPlaces();
        
      } catch (error) {
        console.error('Error parsing file:', error);
      }
      setIsProcessing(false);
    }
  };
  
  const [googlePlacesSearchForNewMarker, setGooglePlacesSearchForNewMarker] = useState(false);

  // 介面收起
  const [hideAddingMarker, setHideAddingMarker] = useState(false);
  const [hideRoutingMode, setHideRoutingMode] = useState(false);
  const [hideUploadGeo, setHideUploadGeo] = useState(false);

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [googlePlacesSearch, setGooglePlacesSearch] = useState(false);
  
  const dispatch = useDispatch();

  const [isRoutingMode, setIsRoutingMode] = useState(false);

  const [places, setPlaces] = useState([]);
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // 您可以根據需要調整每頁顯示的項目數
  
  const filteredPlaces = places?.filter(place =>
    (place.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
    place.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (place.category === selectedCategory || selectedCategory === '')
  );
  const indexOfLastPlace = currentPage * itemsPerPage;
  const indexOfFirstPlace = indexOfLastPlace - itemsPerPage;
  const currentPlaces = filteredPlaces.slice(indexOfFirstPlace, indexOfLastPlace);
  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const { user } = useAuth();
  let userId = user?.uid;
  
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
  const fetchPlaces = useCallback(async () => {
    if (!userId) return;
    const placesQuery = query(collection(db, `users/${userId}/places`));
    const querySnapshot = await getDocs(placesQuery);
    setPlaces(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }, [userId]); 

  // Redux
  useEffect(() => {
    if (userId) {
      fetchPlaces().then((fetchedPlaces) => {
        dispatch(setPlacesRedux(fetchedPlaces));
      });
    }
  }, [userId, fetchPlaces, dispatch]);
  
  const handleMarkerPlaced = (coordinates) => {
    setNewMarker({ coordinates, name: '', description: '', tags: '', category: '', images: [] });
  };
  // Delete: Place
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
  const toggleAddingMarker = () => {
    if (isAddingMarker) {
      handleCancel();
      setGooglePlacesSearchForNewMarker(false); 
      setActiveTab('places');
    } else {
      setIsAddingMarker(true); 
      setActiveTab('content');
    }
  };

  const handleCancel = () => {
    setIsAddingMarker(false);
    setNewMarker(null);
    setSelectedPlace(null);
  };
  const cancelSelect = () => {
    setSelectedPlace(null);
  }
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
  // DELETE: Images
  const handleRemoveImage = async (index: number, imageSrc: string) => {
    if (typeof previewImages[index] === 'string') {
      const imageUrl = previewImages[index];
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl); // 釋放 Blob URL
      }
      setImages(images.filter((_, i) => i !== index));
      setPreviewImages(previewImages.filter((_, i) => i !== index));
    }

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

    setActiveTab('content');
  };
  const handleCancelEdit = () => {
    // setPreviewImages(originalImageUrls);
    setPreviewImages([]);
    // setImages([]);
    setNewMarker(null);
    setIsEditing(false);
    // setSelectedPlace(null); 

    setActiveTab('places');
  };
  async function removeImageFromFirestore(placeId, imageUrl, userId) {
    console.log(`Removing image URL from Firestore: ${imageUrl}`);
  
    const placeRef = doc(db, `users/${userId}/places`, placeId);
  
    const placeSnap = await getDoc(placeRef);

    if (placeSnap.exists()) {
      const placeData = placeSnap.data();
      const imageUrls = placeData.images;
  
      const newImages = imageUrls.filter((url) => url !== imageUrl);
  
      await updateDoc(placeRef, { images: newImages });

      await fetchPlaces(); 
      // Add a delay before fetching the updated document
      // await new Promise((resolve) => setTimeout(resolve, 1000));
  
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

    const currentTime = new Date().toISOString();

    const updatedPlaceData = {
      ...newMarker,
      images: updatedImages,
      tags: newMarker.tags.split(',').map(tag => tag.trim()) || [],
      // new createdTime
      createdTime: newMarker.createdTime ? newMarker.createdTime : currentTime,
      updatedTime: currentTime
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
          showAlert("圖片不存在，可能原始位置已刪除")
          console.warn(`Image not found in storage, might be already deleted: ${storagePath}`);
        } else {
          showAlert("刪除圖片發生未知錯誤")
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
  // CREATE : place
  const createNewPlace = async ()=> {
    if (!userId || !newMarker) return;
    try {
      const imageUrls = await Promise.all(images.map(file => uploadImage(file, userId, newMarker.name)));

      const currentTime = new Date().toISOString();

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
        createdTime: currentTime, 
        updatedTime: ''
      };
      //  const placesRef = doc(db, `users/${userId}/places`); 
      const placesRef = collection(db, `users/${userId}/places`); 
      const docRef = await addDoc(placesRef, newPlace);

      setPlaces(prev => [...prev, { id: docRef.id, ...newPlace }]);
      setNewMarker(null);

      setIsAddingMarker(false);
      setIsEditing(false);
    } catch (e) {
      showAlert("新增景點失敗");
      console.error("Error adding document: ", e);
    }
    setPreviewImages([]);
    setImages([]);
  };
  const handleSubmit = async() => {
    if (!newMarker || !userId) return;

    const isFieldValid = (field) => field && field.trim().length > 0;
    if (!isFieldValid(newMarker.name)){
      showAlert('請填寫標題');
      return;
    } else if (!isFieldValid(newMarker.description)) {
      showAlert('請填寫內容與選擇類別');
      return;
    } else if (!isFieldValid(newMarker.category)) {
      showAlert('請選擇類別');
      return;
    } else if (!newMarker.coordinates) {
      showAlert('確定有在地圖上標記位置嗎？');
      return;
    }
    console.log("提交景點信息：", newMarker);

    if (isEditing && selectedPlace) {
      await updatePlace(selectedPlace.id);
      setActiveTab('places');
    } else {
      await createNewPlace();
      setActiveTab('places');
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

  const handlePublishClick = () => {
    if (places.length === 0) { // 假設 places 陣列儲存著所有景點
      showAlert('你還沒有新增景點');
      return;
    } 
    Router.push('/publish-map');
  };

  const hideAddingMarkerAction = () => {
    setHideAddingMarker(true);
  }
  const hideIsRoutingMode = () => {
    setHideRoutingMode(true);
  }
  const hideUploadGeoAction = () => {
    setHideUploadGeo(true);
  }
  const showAddingMarkerAction = () => {
    setHideAddingMarker(false);
  }
  const showIsRoutingMode = () => {
    setHideRoutingMode(false);
  }
  const showUploadGeoAction = () => {
    setHideUploadGeo(false);
  }
  const toggleGooglePlacesSearch = (value: boolean, forNewMarker = false) => {
    if (forNewMarker) {
      setGooglePlacesSearchForNewMarker(value);
      setGooglePlacesSearch(false);
    } else {
      setGooglePlacesSearch(value);
      setGooglePlacesSearchForNewMarker(false);
    }
  };
  const handleGooglePlaces = () => {
  if(selectedPlace){
      setLatitude(selectedPlace.coordinates.lat);
      setLongitude(selectedPlace.coordinates.lng)
      toggleGooglePlacesSearch(true);
    }
  }
  const handleGooglePlacesForNewMarker = () => {
    if (newMarker) {
      setLatitude(newMarker.coordinates.lat.toString());
      setLongitude(newMarker.coordinates.lng.toString());
      toggleGooglePlacesSearch(true, true);
    }
  };
  // 回調函數
  const handleSelectPlace = (googlePlaceMigrate) => {
    console.log('景點附近 Google 景點')
    // setSelectedPlace(googlePlaceMigrate);
  };
  const handleSelectPlaceForNewMarker = (place: Place) => {
    console.log('新圖標附近 Google 景點')
    // 處理新標記的選擇
    // 例如，可以更新 newMarker 的狀態或進行其他處理
    // setNewMarker(place);
    // toggleGooglePlacesSearch(false);
  };
  const closeGooglePlacesSearch = () => {
    setGooglePlacesSearch(false);
    setGooglePlacesSearchForNewMarker(false);
  }

  const [activeTab ,setActiveTab] = useState('places');
  const [showPlaceInArticle, setShowPlaceInArticle] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen-without-navbar text-black bg-gray-200">
      <div className="lg:w-2/3 md:w-1/2 w-full lg:m-10 md:m-5 m-0 border">
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
          isRoutingMode={isRoutingMode}
          setIsRoutingMode={setIsRoutingMode}
        />
      </div>
      <div className="relative md:overflow-x-visible lg:overflow-x-visible md:overflow-y-auto
        lg:w-1/3 md:w-1/2 w-full lg:mb-10 lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5 
         bg-white shadow rounded pb-5">
       <div className="sticky top-0 bg-white shadow-lg z-50 flex items-center py-2 pl-3">
          <div className="flex items-center space-x-1 mr-2">
            <button
                  title="add-marker"
                  className="relative h-12 w-12 rounded-full flex justify-center items-center border-2 
                              border-dashed border-gray-300 cursor-pointer hover:border-gray-500 hover:bg-green-300
                            "
              >
              
                <div className=" w-full h-full flex justify-center items-center rounded-full"
                      onClick={toggleAddingMarker}>
                      <i className={`fas ${isAddingMarker ? 'fa-times' : 'fa-location-dot'}`}></i>
                </div>
            </button>
            <div className="text-sm hidden lg:block font-medium">{isAddingMarker ? '取消新增' : '新增座標'}</div>
          </div>

          <div className="flex pr-3">
             <button title="rainbow-route-btn" className="flex items-center space-x-1">
                <button title="route-mode"
                        className={`${RainbowButtonModule.rainbowButton} justify-center items-center relative`}
                        style={{
                          // @ts-ignore
                          '--button-width': '45px',
                          '--button-height': '50px',
                          '--button-border-radius': '100px',
                        }}> 
                  <button
                      className=" bg-white p-3 text-sm
                            font-medium hover:bg-black hover:text-green-500 rounded-full"
                      onClick={() => setIsRoutingMode(!isRoutingMode)}>
                    <div>
                    {isRoutingMode ?  <i className="fas fa-door-open"></i> :  <i className="fas fa-route"></i>}   
                    </div>
                  </button>
                </button>
                <div className="hidden lg:inline text-sm font-medium">
                        {isRoutingMode ? "停止路徑" : "規劃路徑"}
                </div>
              </button>
            </div>

          <button 
            className="flex items-center justify-center bg-teal-50 shadow-md hover:bg-teal-600  py-2 px-4 rounded-xl hover:text-white"
            onClick={handlePublishClick}
          >
            <i className={`fas fa-map p-1`}></i>
            <div className="hidden lg:flex text-sm font-medium">發佈</div>
          </button>
          <div className="tab-buttons flex">
              <button className={`border ml-2 p-1 rounded-full mr-1 text-sm ${activeTab=='places' && 'bg-blue-300 text-base' }`} onClick={() => setActiveTab('places')}>景點</button>
              <button className={`border p-1 rounded-full mr-1 text-sm ${activeTab=='content' && 'bg-green-300 text-base' }`} onClick={() => setActiveTab('content')}>文章</button>
            </div>
          <div className="place-list absolute right-5 flex items-center justify-center mb-5 mt-5">
            <label htmlFor="toggle" className="flex items-center cursor-pointer">
              <div className="relative">
                {/*  */}
                <input type="checkbox" id="toggle" className="sr-only" onChange={() => setShowPlacesList(!showPlacesList)} checked={showPlacesList} />
                <div className={`flex items-center w-16 h-9 rounded-full transition-colors ${showPlacesList ? 'bg-green-500' : 'bg-gray-400'}`}>
                  <i className={`fas ${showPlacesList ? 'fa-eye-slash ml-2 text-stone-500 ' : 'fa-eye ml-9 text-gray-900'} text-center`} ></i>
                </div>
                <div className={`dot absolute left-1 top-1 bg-white h-7 w-7 rounded-full transition transform ${showPlacesList ? 'translate-x-full' : ''}`}>
                </div>
              </div>
              <div className="ml-2 text-gray-700 font-medium text-sm hidden lg:flex">
                <i className="fas fa-list-ul"></i>
              </div>
            </label>
          </div>
      </div>
      <div className="container lg:px-6 md:px-4 px-3 py-3">
        <button
          className=""
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
            <div className="cursor-pointer">
              <i className="fas fa-chevron-down"></i>
              <i className="fas fa-question-circle ml-1"></i>
              <span className="text-sm hidden lg:inline lg:ml-2 font-medium">提示</span>
            </div>
        </button>
        <div className={`mb-4 transition-all duration-500 ease-in-out mt-3 ${isCollapsed ? 'max-h-0' : 'max-h-40'} overflow-hidden`}>
          <h1 className="text-xl font-bold text-gray-800 mb-2"> {user?.name} 的個人地圖</h1>
          <div className="text-gray-600 text-sm max-w-md"> 
              新增座標 <span className="ml-1 mr-1">
              <i className="fas fa-location-dot text-red-500"></i>
              </span> 並放置圖標至地圖上的任意位置，即可新增景點，送出後點選地圖上的 <span className="ml-1 mr-1">
              <i className="fas fa-location-pin text-red-500"></i>
              </span> 以閱讀、編輯或刪除景點。你也可以點選<span className="ml-1 mr-1">
              <i className="fas fa-eye text-red-500"></i>
              </span>  圖示來顯示/隱藏景點列表並搜尋、點選。你可以將 <i className="fab fa-google text-red-500"> </i> 地圖的地點轉移顯示在畫面上。
              有地點之後點擊規劃路徑 <i className="fas fa-route text-green-600"></i> 圖示，點選兩點即可規劃路徑。
              想分享給他人？沒問題！至少發佈一個景點，點選發佈地圖，選擇你的景點，寫下地圖標題跟內容分享吧！ ❤️
          </div>
        </div>
        <div> {isAddingMarker && !newMarker && ( <div className="absolute top-[80px] bg-green-200 shadow-lg  p-2 rounded-2xl  right-[70px] max-w-[120px] text-sm text-black-600"> 🤌 在地圖上點選位置以新增景點</div>)} </div>
        <div> {isRoutingMode && !selectedPlace && ( <div className="absolute top-[80px] bg-green-200 shadow-lg  p-2 rounded-2xl  right-[70px] max-w-[120px] text-sm text-black-600"> 👈選擇第一個景點，接著選擇第二個，會自動連線，以此類推</div>)} </div>
        {activeTab === 'places' && (
          <>
           <div className="flex flex-wrap space-x-2 mb-5">
          <div className="mt-3 lg:mt-0">
            { hideUploadGeo ? (
                <i className={`cursor-pointer hover:text-blue-500 absolute right-5 top-[80px] fas fa-file-import text-xl border-2 rounded-full px-2 py-1 shadow-md`}
                    onClick={showUploadGeoAction}
                ></i> 
              ):(
                <>
                  <div className="border-2 w-60 rounded-3xl p-2 mt-5 md:mt-2 ml-2 shadow-lg flex-col items-center">
                    <div className="relative">
                      <button title="show Geo" 
                              onClick={hideUploadGeoAction} className="absolute hide-upload flex border-2 p-2 rounded-full left-[-20px] top-[-26px] bg-white shadow-lg">
                        <i className="fas fa-minus"></i>
                      </button>
                    </div>
                    <KmzFileUploader onFileSelected={handleFileSelected}  onUploadClick={handleUploadClick}
                                      isProcessing={isProcessing} />
                  </div>
                  <div>
                  { kmzPlaces && (<>
                  <div className="mt-2 text-center cursor-pointer bg-red-400 w-36 text-white p-2 rounded-full hover:bg-white hover:text-blue-500 border-2" 
                        onClick={() => setKmzPlaces('')}>
                          取消顯示匯入區塊
                  </div>
                    <KmzPlacesList places={kmzPlaces} />
                    </>)}
                  </div>
                </>
              )}
          </div>
        </div>
        {!isEditing && (
        <>
          { !newMarker && showPlacesList && (
            <div className="places-list mt-4">
              <div className="search-and-filter border-2 shadow-lg rounded-2xl">
                <div className="flex flex-col px-3 mt-5 md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
                <div className="flex-1 relative">
                  <div className="flex items-center justify-center">
                    <div><i className="fas fa-search text-black mr-2"></i></div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜尋景點名稱或標籤"
                      className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500"/>
                  </div>
                  {searchTerm && (
                      <button
                        title="clear-search"
                        onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black-400 hover:text-gray-600">
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  <div>
                    <select
                      title="category-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500">
                  <option value="">搜尋類別</option>
                  {Object.entries(categoryMapping).map(([key, { text }]) => (
                    <option key={key} value={key}>{text}</option>
                  ))}
                </select>
              </div>
            </div>
            { searchTerm || selectedCategory ? (
            <div className="p-2 flex-column">
              <h2 className="text-lg font-semibold mb-2 text-center">搜尋後景點列表</h2>
              { filteredPlaces.length === 0 ? (
              <p className="text-center">找不到符合條件的景點</p>
              ) : (
              <>
                {currentPlaces.map((place) => (
                  <div key={place.id} className="hover:bg-green-100 place-item flex justify-between items-center
                                      p-2 border border-gray-300 rounded m-2 cursor-pointer"
                      onClick={() => handlePlaceSelect(place)}>
                    {place.name}
                  </div>
                ))}
                <div className="pagination text-center">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => paginate(index + 1)}
                      className={`px-3 py-1 m-1 rounded-full 
                      ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
                        {index + 1}
                    </button>
                  ))}
                </div>
              </>
            )}
            </div>
            ) : (
            <div className="p-2 flex-column">
              <h2 className="text-lg font-semibold mb-2 text-center">景點列表</h2>
              {currentPlaces.map((place) => (
                  <div key={place.id} className="hover:bg-green-100 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer"
                      onClick={() => handlePlaceSelect(place)}>
                    {place.name}
                  </div>
              ))}
                <div className="pagination text-center">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => paginate(index + 1)}
                      className={`rounded-full px-3 py-1 m-1 
                      ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
                        {index + 1}
                    </button>
                  ))}
                </div>
            </div>
            )}
          </div>
        </div>
          )}
        </>
      )}
      {!selectedPlace  &&  (<span className="border-2 rounded-2xl shadow-lg px-3 py-2 text-sm bg-green-200"> 選中的景點會顯示在此處 </span>)}
      {selectedPlace && (
        <>
          <div className="mt-5 mb-5 relative p-4 bg-white border-2 rounded-2xl shadow-lg pr-12"> 
            <div className="absolute right-0 top-0 text-black cursor-pointer p-5" onClick={handlePlaceClose} >
              <i className="fas fa-times"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4">{selectedPlace.name}</h2>
            <h3 className="text-lg text-gray-600 mb-4">{selectedPlace.description}</h3>
            {selectedPlace.tags && selectedPlace.tags.filter(tag => tag.trim().length > 0).length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedPlace.tags.map(tag => (
                  <span key={tag} className="text-xs bg-blue-200 px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
            )}
            <div className={`${categoryMapping[selectedPlace.category]?.color || 'bg-gray-200'} p-2 rounded mb-4 w-24`}>
              {categoryMapping[selectedPlace.category]?.text || '不明'}
            </div>
            
            <div className="mt-5">
              {selectedPlace.images?.map((url, index) => (
                <div key={index} className="image-preview mb-2 relative w-[200px] h-[200px] overflow-hidden"  >
                  <LazyLoadImage effect="blur"
                    src={url}
                    alt={`${selectedPlace.name} image ${index}`}
                    width="200px"
                    height="200px"
                    className="object-cover"
                  />
                </div>
              ))}
              { selectedPlace.createdTime &&
              <div className="text-sm"> 發佈時間：{new Date(selectedPlace?.createdTime ).toLocaleString("zh-TW", { hour12: true })}</div>
              }

              {selectedPlace?.updatedTime && selectedPlace?.updatedTime !="" &&
                <div className="text-sm"> 更新時間：{new Date(selectedPlace?.updatedTime ).toLocaleString("zh-TW", { hour12: true })} </div>
              }
              <div className="mb-3">{formatCoordinates(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng)}</div>
            </div>
            <div className="flex">
              <Link href={`https://www.google.com/maps/place/?q=place_name:${selectedPlace.name}`} target="_blank" passHref>
                <button className="flex items-center mr-3 bg-blue-100 text-black px-3 py-2  rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <i className="fab fa-google mr-1"></i>
                  <i className="fa-solid fa-magnifying-glass mr-1"></i>
                  <i className="fas fa-external-link mr-1.5"></i>
                  <div className="hidden lg:flex"> 名稱</div>
                </button>
              </Link>
              <Link href={`https://www.google.com/maps/place/${decimalToDms(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng)}`} target="_blank" passHref>
                <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <i className="fab fa-google mr-1"></i>
                  <i className="fa-solid fa-globe mr-1.5"></i>
                  <i className="fas fa-external-link mr-1.5"></i>
                  <span className="hidden lg:flex"> 經緯</span>
                </button>
              </Link>
              <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white
                                  focus:outline-none focus:ring-2 focus:ring-blue-300" 
                                onClick={handleGooglePlaces} >
                <i className="fa-solid fa-directions mr-1.5"></i>
                <span className="hidden lg:flex"> 附近景點</span>
              </button>
            </div>
            <button
              title="edit-place"
              className=" h-12 w-12 absolute right-[-15px] top-10 mb-5 mt-5 m-2 bg-blue-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-full cursor-pointer
               hover:border-gray-500 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => handleEditClick(selectedPlace)}>
              <i className="fas fa-edit"></i>
            </button>
            <button
              title="delete-place"
              // className="m-2 px-4 py-2 bg-red-100 text-black border border-black rounded hover:bg-red-400 hover:text-white hover:border-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              className=" h-12 w-12  absolute right-[-15px] top-24 mb-5 mt-5 m-2 bg-red-100 flex-column justify-center items-center border-2 border-gray-300  rounded-full cursor-pointer hover:border-gray-500 hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              onClick={handleDeletePlace}>
              <i className="fas fa-trash-alt"></i>
            </button> 
          </div>
          {googlePlacesSearch && (<div className="flex-col items-center justify-center">
                <button title="close-search" 
                        // tailwind beautiful buttons
                        className="w-full button px-4 py-3 bg-red-100 rounded-full mt-3 " 
                        onClick={closeGooglePlacesSearch}> 
                        關閉 Google Places        
                </button>   
            <GooglePlaces 
              latitude={latitude} 
              longitude={longitude}
              isFetchingAPI={googlePlacesSearch} 
              onSelectPlace={handleSelectPlace}
              placeName={selectedPlace?.name}
            />
            </div>
          )}
        </>
      )}
      </>
      )}
      {activeTab === 'content' && (
        <>
      <button title="show-places" className="bg-blue-300 p-2 rounded-full border-2 px-3 py-2 text-sm bg-yellow-100 hover:bg-yellow-400" 
              onClick={()=>setShowPlaceInArticle(!showPlaceInArticle)}> {showPlaceInArticle ? '不顯示選中景點' : '同時顯示選中景點'} </button>
      <div className="mt-2">
      {!selectedPlace  && showPlaceInArticle &&  (<span className="border-2 rounded-2xl shadow-lg px-3 py-2 text-sm bg-green-200"> 選中的景點會顯示在此處 </span>)}
      {selectedPlace && showPlaceInArticle && (
        <>
           <div className="mt-5 mb-5 relative p-4 bg-white border-2 rounded-2xl shadow-lg pr-12"> 
            <div className="absolute right-0 top-0 text-black cursor-pointer p-5" onClick={handlePlaceClose} >
              <i className="fas fa-times"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4">{selectedPlace.name}</h2>
            <h3 className="text-lg text-gray-600 mb-4">{selectedPlace.description}</h3>
            {selectedPlace.tags && selectedPlace.tags.filter(tag => tag.trim().length > 0).length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedPlace.tags.map(tag => (
                  <span key={tag} className="text-xs bg-blue-200 px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
            )}
            <div className={`${categoryMapping[selectedPlace.category]?.color || 'bg-gray-200'} p-2 rounded mb-4 w-24`}>
              {categoryMapping[selectedPlace.category]?.text || '不明'}
            </div>
            
            <div className="mt-5">
              {selectedPlace.images?.map((url, index) => (
                <div key={index} className="image-preview mb-2 relative w-200 h-200 overflow-hidden"  >
                  <LazyLoadImage effect="blur"
                    src={url}
                    alt={`${selectedPlace.name} image ${index}`}
                    width="200" // 设定宽度
                    height="200" // 设定高度
                    className="object-cover"
                  />
                </div>
              ))}
              { selectedPlace.createdTime &&
              <div className="text-sm"> 發佈時間：{new Date(selectedPlace?.createdTime ).toLocaleString("zh-TW", { hour12: true })}</div>
              }

              {selectedPlace?.updatedTime && selectedPlace?.updatedTime !="" &&
                <div className="text-sm"> 更新時間：{new Date(selectedPlace?.updatedTime ).toLocaleString("zh-TW", { hour12: true })} </div>
              }
              <div className="mb-3">{formatCoordinates(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng)}</div>
            </div>
            <div className="flex">
              <Link href={`https://www.google.com/maps/place/?q=place_name:${selectedPlace.name}`} target="_blank" passHref>
                <button className="flex items-center mr-3 bg-blue-100 text-black px-3 py-2  rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <i className="fab fa-google mr-1"></i>
                  <i className="fa-solid fa-magnifying-glass mr-1"></i>
                  <i className="fas fa-external-link mr-1.5"></i>
                  <div className="hidden lg:flex"> 名稱</div>
                </button>
              </Link>
              <Link href={`https://www.google.com/maps/place/${decimalToDms(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng)}`} target="_blank" passHref>
                <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <i className="fab fa-google mr-1"></i>
                  <i className="fa-solid fa-globe mr-1.5"></i>
                  <i className="fas fa-external-link mr-1.5"></i>
                  <span className="hidden lg:flex"> 經緯</span>
                </button>
              </Link>
              <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white
                                  focus:outline-none focus:ring-2 focus:ring-blue-300" 
                                onClick={handleGooglePlaces} >
                <i className="fa-solid fa-directions mr-1.5"></i>
                <span className="hidden lg:flex"> 附近景點</span>
              </button>
            </div>
            <button
              title="edit-place"
              className=" h-12 w-12 absolute right-[-15px] top-10 mb-5 mt-5 m-2 bg-blue-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-full cursor-pointer
               hover:border-gray-500 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => handleEditClick(selectedPlace)}>
              <i className="fas fa-edit"></i>
            </button>
            <button
              title="delete-place"
              // className="m-2 px-4 py-2 bg-red-100 text-black border border-black rounded hover:bg-red-400 hover:text-white hover:border-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              className=" h-12 w-12  absolute right-[-15px] top-24 mb-5 mt-5 m-2 bg-red-100 flex-column justify-center items-center border-2 border-gray-300  rounded-full cursor-pointer hover:border-gray-500 hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              onClick={handleDeletePlace}>
              <i className="fas fa-trash-alt"></i>
            </button> 
          </div>
          
        </>
      )}
      </div>
      <div className="mt-3 border-2 rounded-2xl shadow-lg px-3 py-2 text-sm bg-green-50"> 新增座標 <i className="fas fa-map-marker-alt"></i>  以新增景點，或點選景點後按 <i className="fas fa-edit"> 編輯景點</i></div>
      {newMarker && (
        <div className="relative mb-5 p-4 bg-white border-2 shadow-lg rounded-2xl">
          <h3 className="text-lg font-semibold mb-2 text-black">{isEditing ? '編輯景點' : '新增景點'}</h3>
          <div className="absolute top-3 right-5 cursor-pointer"> {isEditing ? (
            <div onClick={handleCancelEdit}> <i className="fas fa-times"></i></div> 
          ):( 
            <div onClick={toggleAddingMarker}> <i className="fas fa-times"></i></div> 
          )} 
          </div>
          <input 
            type="text" 
            placeholder="名稱" 
            value={newMarker.name} 
            onChange={(e) => handleInputChange('name', e.target.value)} 
            className="p-2 w-full mb-2 border rounded text-black"/>
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
            className="p-2 w-full mb-2 border rounded text-black">
            <option value="">選擇類別</option>
            {Object.entries(categoryMapping).map(([key, { text }]) => (
              <option key={key} value={key}>{text}</option>
            ))}
          </select>
          <div className="image-uploader p-2 w-full mb-2 border rounded">
          <DropzoneImage onFileUploaded={handleFileUpload} />
          {previewImages.map((src, index) => (
              src ? (
                <div key={index} className="image-preview relative w-[200px] h-[200px] overflow-hidden" >
                  <LazyLoadImage effect="blur"
                    src={src}
                    alt={`Uploaded preview ${index}`} 
                    width="200px"
                    height="200px"
                    className="object-cover"/>
                  <button 
                    className="absolute top-0 right-0 bg-red-500 text-white p-1"
                    onClick={() => handleRemoveImage(index, src)}>
                    刪除
                  </button>
                </div>
              ) : null
            ))}
          </div>
          <div> 
            <span>{formatCoordinates(newMarker.coordinates.lat, newMarker.coordinates.lng)}</span>
            <div className="flex mt-2">
              <Link href={`https://www.google.com/maps/place/?q=place_name:${newMarker.name}`} target="_blank" passHref>
                <button className="flex items-center bg-blue-100 mr-2 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                <i className="mr-1 fa-solid fa-arrow-up-right-from-square"></i><i className="fab fa-google mr-1"></i><i className="fa-solid fa-magnifying-glass mr-1.5"></i><span className="hidden lg:flex"> 名稱</span>
                </button>
              </Link>
              <Link href={`https://www.google.com/maps/place/${decimalToDms(newMarker.coordinates.lat, newMarker.coordinates.lng)}`} target="_blank" passHref>
                <button className="flex items-center bg-blue-100 mr-2 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                <i className="mr-1fa-solid fa-arrow-up-right-from-square"></i><i className="fab fa-google mr-1"></i><i className="fa-solid fa-globe mr-1.5"></i><span className="hidden lg:flex"> 經緯</span>
                </button>
              </Link>
              <button className={`${RainbowButtonModule.rainbowButton} flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300`}
                      onClick={handleGooglePlacesForNewMarker}  
              >
                <button className="bg-white flex items-center px-3 py-1 rounded-md">
                  <i className="fab fa-google mr-1"></i>
                  <i className="fa-solid fa-directions mr-1.5"></i>
                  <span className="hidden lg:flex text-sm"> 附近景點</span>
                </button>
              </button>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="mb-3 mt-5 m-2 bg-green-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-12 w-40 cursor-pointer hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isEditing ? (
              <span>
                <i className="fas fa-check-circle"></i> 確認修改
              </span>
            ) : (
              <span>
                <i className="fas fa-upload "></i> 提交新景點
              </span>
            )}
          </button>
          {isEditing && (
            <button
              onClick={handleCancelEdit}
              className="mb-5 m-2 bg-red-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-12 w-40 cursor-pointer hover:border--500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>
                <i className="fas fa-times-circle"></i> 取消編輯
              </span>
            </button>
          )}
        </div>
      )}
      {googlePlacesSearch && (<div className="flex-col items-center justify-center">
                <button title="close-search" 
                        // tailwind beautiful buttons
                        className="w-full button px-4 py-3 bg-red-100 rounded-full mt-3 " 
                        onClick={closeGooglePlacesSearch}> 
                        關閉 Google Places        
                </button>   
        <GooglePlaces 
          latitude={latitude} 
          longitude={longitude}
          isFetchingAPI={googlePlacesSearch} 
          onSelectPlace={handleSelectPlace}
          placeName={selectedPlace?.name}
        />
        </div>
      )}
      {googlePlacesSearchForNewMarker && (<>
                <button title="close-search" 
                        // tailwind beautiful buttons
                        className="w-full button px-4 py-3 bg-red-100 rounded-full mt-3 " 
                        onClick={closeGooglePlacesSearch}> 
                        關閉 Google Places        
                </button>   
      
        <GooglePlaces 
          latitude={latitude} 
          longitude={longitude}
          isFetchingAPI={googlePlacesSearchForNewMarker} 
          onSelectPlace={handleSelectPlaceForNewMarker}
        />
        </>
      )}
      </>
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
    />
  </div>
  </div>
  );
};
export default MapDemoPage;