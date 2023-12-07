// pages/publish-map.tsx
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
// react modules
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
// redux
import { useSelector } from 'react-redux';
// components
import PublishArea from '../components/PublishArea'; 
import DropzoneImage from '../components/DropzoneImage';
import AlertModal from '../components/AlertModal';
// auth
import { useAuth } from '../context/AuthContext';
// css
import 'react-quill/dist/quill.snow.css'; 
// firebase
import { collection, query, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import firebaseServices from '../utils/firebase';
const { db, storage } = firebaseServices;
// types
// import { Place } from '../types/Place';
// redux
import { selectPlacesRedux } from '../store/slices/placesSlice'
import { categoryMapping } from '../constants'
import { formatCoordinates, decimalToDms } from '../utils/decimalCoordinates';

const MapComponentWithNoSSR = dynamic(
    () => import('../components/MapComponent'),
    { ssr: false }
);
const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});
const PublishMapPage = () => {

  const [activeTab, setActiveTab] = useState('places'); 

  const { user } = useAuth();
  const router = useRouter();

  const [isDragModeEnabled, setIsDragModeEnabled] = useState(true);

  const [places, setPlaces] = useState([]);

  const reduxPlaces = useSelector(selectPlacesRedux);

  // routing mode
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  // search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [areAllPlacesAdded, setAreAllPlacesAdded] = useState(false);

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
  // alert&confirm
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmFunction, setConfirmFunction] = useState(null);
  const [isPublishing, setIsPublishing] = useState(true);
  const [publishedPlaces, setPublishedPlaces] = useState([]);
  const [showPlacesList, setShowPlacesList] = useState(true);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hideRoutingMode, setHideRoutingMode] = useState(false);

  const showIsRoutingMode = () => {
    setHideRoutingMode(false);
  };
  const hideIsRoutingMode = () => {
    setHideRoutingMode(true);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const [itemsPerPage, setItemsPerPage] = useState(5); //每頁顯示幾筆資料
  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === '' || place.category === selectedCategory)
  );

  const activePlaces = searchTerm || selectedCategory ? filteredPlaces : places;
  // 計算總頁數
  const totalPages = Math.ceil(activePlaces.length / itemsPerPage);

  const paginatedPlaces = activePlaces.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 處理翻頁
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPlaces = filteredPlaces.slice(indexOfFirstItem, indexOfLastItem);

  const handleMarkerClick = (place) => {
    setSelectedPlace(place);
  };


  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  useEffect(() => {
    if (!user) return;
    // if (reduxPlaces && reduxPlaces.length > 0) {
    //   setPlaces(reduxPlaces);
    // } else {
      const q = query(collection(db, `users/${user.uid}/places`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const placesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlaces(placesData);
      });
      return () => unsubscribe();
    // }
  }, [user, reduxPlaces]);

  // const handleAddClick = (place) => {
  //   if (!publishedPlaces.some(p => p.id === place.id)) {
  //     setPublishedPlaces([...publishedPlaces, place]);
  //   }
  // };

  const handleContentChange = (content) => {
    setContent(content);
  };
  const handleAddAll = () => {
    setConfirmMessage('您確定要新增全部景點嗎？');
    setConfirmFunction(()=>confirmAddAll);
    setShowPublishConfirm(true);
  };
  const confirmAddAll = () => {
    setPublishedPlaces(places);
    setAreAllPlacesAdded(true);
    setShowPublishConfirm(false);
  }
  const handleClearAll = () => {
    setConfirmMessage('您確定要清空景點嗎？');
    setConfirmFunction(()=>confirmClearAll);
    setShowPublishConfirm(true);
  };
  const confirmClearAll = () => {
    setPublishedPlaces([]);
    setAreAllPlacesAdded(false);
    setShowPublishConfirm(false);
  }
  const handleCancelPublish = () => {
    setConfirmMessage('您確定要取消發佈嗎？文章將清空');
    setConfirmFunction(()=>confirmHandleCancelPublish);
    setShowPublishConfirm(true);
  };
  const confirmHandleCancelPublish = (place) => {
    setIsPublishing(false);
    // setPublishedPlaces([]);
    Router.push('/map/');
  };
  const handleConfirmPublish = async () => {
    if (!title.trim() || !content.trim() || publishedPlaces.length === 0 ) {
      showAlert('請確保已正確填寫標題跟內容，並且至少有一個發佈景點加入發佈區。');
      return;
    }
    setConfirmMessage('您確定要發佈此地圖嗎？');
    setConfirmFunction(()=>confirmPublish);
    setShowPublishConfirm(true);
  };

  const confirmPublish = async () => {
    try {
      // const userId = user.uid;
      // const mapsRef = collection(db, `publishedMaps/${userId}/maps`);
      // const docRef = await addDoc(mapsRef, mapToPublish);
      let uploadedImageUrl = coverImage;
      if (coverImageFile) {
        uploadedImageUrl = await handleUploadCoverImage();
        setCoverImage(uploadedImageUrl);
      }
      const mapRef = doc(collection(db, 'publishedMaps', user.uid, 'maps'));
      
      await setDoc(mapRef, {
        title: title.trim(),
        content: content.trim(),
        tags: [],
        coverImage: uploadedImageUrl,
        publishDate: new Date().toISOString(),
        updatedDate:'',
        userId: user.uid,
        likes: 0,
        likedBy: [],
        duplicates: 0,
        duplicatedBy: [],
        placesLikes: 0,
        placesLikedBy: [],
        popularity: 0
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
      showAlert('地圖已成功發布！');
      Router.push(`/publishedMaps/${user.uid}/maps/${mapRef.id}`);    
    } catch (error) {
      console.error('發布地圖出錯：', error);
      showAlert('發布地圖時發生錯誤。');
      return;
    }
  };
  const handleAddToPublish = (place) => {
    // 假設 placeId 是一個對象而不僅僅是 ID
    if (!publishedPlaces.some(p => p.id === place.id)) {
      setPublishedPlaces(prevPlaces => [...prevPlaces, place]);
    }
    
  };
  const handleSelectPlace = (place) => {
    setSelectedPlace(place); 
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

  const handlePlaceClose = () => {
    setSelectedPlace(null);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen-without-navbar md:flex-row text-black bg-gray-200">
        <div className="lg:w-2/3 md:w-1/2 w-full lg:m-10 md:m-5 m-0 border">
          <MapComponentWithNoSSR
            places={places}
            isPublishing={isPublishing}
            isRoutingMode={isRoutingMode}
            isDragModeEnabled={isDragModeEnabled}
            onAddToPublish={handleAddToPublish}
            onRemoveFromPublish={handleRemoveFromPublish}
            publishedPlaces={publishedPlaces}
            onMarkerClick={setSelectedPlace}
            selectedPlace={selectedPlace}
          />
        </div>

        <div className="relative md:overflow-x-visible lg:overflow-x-visible md:overflow-y-auto
          lg:w-1/3 md:w-1/2 w-full lg:mb-10 lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5 
         bg-white shadow rounded ">
          <div className="sticky top-0 bg-white shadow-lg z-50 flex items-center">
            <button
              className="p-2 rounded-3xl mb-5 mt-5 m-2 flex-column justify-center items-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-500 hover:bg-gray-200"
              onClick={handleCancelPublish}>
              <i className="fas fa-circle-arrow-left mr-2"></i>
              <span className="hidden md:inline-block text-sm">取消發布</span>
            </button>
            <div className="tab-buttons flex">
              <button className="border p-1 rounded-full mr-1" onClick={() => setActiveTab('places')}>景點</button>
              <button className="border-2 p-1 rounded-full mr-1" onClick={() => setActiveTab('content')}>文章</button>
            </div>
            <div className="inline-block">
              <button title="route-mode"
                className={`justify-center items-center relative`}>
                <button
                  className={`p-3 text-sm
                            font-medium hover:bg-black  hover:text-green-500 ${isDragModeEnabled ? 'bg-gray-200' : 'bg-yellow-200'}  
                            rounded-full mr-2`}
                  onClick={() => setIsDragModeEnabled(!isDragModeEnabled)}>
                  <div>
                    {isDragModeEnabled ? <i className="fa-regular fa-star"></i> : <i className="fa-solid fa-star"></i>}
                  </div>
                  <div className="hidden lg:inline">
                    {isDragModeEnabled ? "停用拖曳" : "啟用拖曳"}
                  </div>
                </button>
              </button>
            </div>
            <div className="inline-block">
              <button title="route-mode"
                className={`justify-center items-center relative`}>
                <button
                  className=" p-3 text-sm
                            font-medium hover:bg-black bg-green-200 hover:text-green-500 rounded-full"
                  onClick={() => setIsRoutingMode(!isRoutingMode)}>
                  <div>
                    {isRoutingMode ? <i className="fas fa-door-open"></i> : <i className="fas fa-route"></i>}
                  </div>
                  <div className="hidden lg:inline">
                    {isRoutingMode ? "停止路徑" : "規劃路徑"}
                  </div>
                </button>
              </button>
            </div>
            <div className="show-hide-list flex flex-col w-full lg:w-auto lg:flex-row md:flex-col mb-4 controls">
              <div className=" flex items-center justify-center mb-5 mt-5">
                <label htmlFor="toggle" className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" id="toggle" className="sr-only"
                      onChange={() => setShowPlacesList(!showPlacesList)} checked={showPlacesList} />
                    <div className={`flex items-center w-16 h-9 rounded-full transition-colors ${showPlacesList ? 'bg-green-500' : 'bg-gray-400'}`}>
                      <i className={`fas ${showPlacesList ? 'fa-eye-slash ml-2 text-stone-500 ' : 'fa-eye ml-9 text-gray-900'} text-center`} ></i>
                    </div>
                    <div className={`dot absolute left-1 top-1 bg-white h-7 w-7 rounded-full transition transform ${showPlacesList ? 'translate-x-full' : ''}`}>
                    </div>
                  </div>
                  <div className="ml-2 text-gray-700 font-medium text-sm hidden lg:flex">
                    <i className="fas fa-list-ul"></i>
                    {showPlacesList ? '' : ''}
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="container lg:px-6 md:px-4 px-3 py-3">
          {activeTab === 'places' && (
          <div>
            <div>
              <button
                className=""
                onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="ursor-pointer">
                  <i className="fas fa-chevron-down"></i>
                  <i className="fas fa-question-circle ml-1"></i>
                  <span className="text-sm hidden lg:inline lg:ml-2 font-medium">提示</span>
                </div>
              </button>
              <div className={`transition-all duration-500 ease-in-out pl-2 pt-2 mb-1 mt-3 ${isCollapsed ?
                'max-h-0' : 'max-h-36'} overflow-hidden`}>
                <h1 className="mb-2 text-xl font-bold text-gray-800"> {user.name}即將發佈地圖</h1>
                <div className="text-gray-600 mb-2">
                  新增你想發佈的景點群。你也可開啟拖曳模式，點擊查看後產生 <i className="fas fa-star"></i> 後稍微拖曳就能加入發佈地點。
                  並輸入本地圖的標題、內容、上傳封面照片(可選)。
                </div>
              </div>
            </div>

            <div className="flex">
              <button
                className="py-2 w-1/2 rounded-xl m-2 flex justify-center items-center border-2 bg-green-100 hover:bg-green-300 
                            hover:border-gray-500 cursor-pointer"
                onClick={areAllPlacesAdded ? () => { } : handleAddAll}>
                <i className="fas fa-plus-square text-green-500"></i>
                <div>全部新增</div>
              </button>
              <button
                className="py-2 w-1/2 rounded-xl m-2 flex justify-center items-center border-2 bg-gray-100 hover:bg-red-300 hover:border-gray-500 cursor-pointer"
                onClick={handleClearAll}
              >
                <i className="fas fa-trash text-gray-400"></i>
                <div>全部清除</div>
              </button>
            </div>
            <div className="px-2 mb-6">
              <PublishArea
                publishedPlaces={publishedPlaces}
                onRemoveFromPublish={handleRemoveFromPublish}
                onSelectPlace={setSelectedPlace}
              />
            </div>
            {showPlacesList && (
              <div className="places-list mt-4">
                <div className="search-and-filter border-2 shadow-lg rounded-2xl p-3">
                  <div className="space-x-2 flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
                    <div className="flex-1 relative">
                      <div className="flex items-center justify-center">
                        <div><i className="fas fa-search text-black mr-2"></i></div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="搜尋景點名稱或標籤"
                          className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
                        />
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
                  <h2 className="text-lg font-semibold mb-2"> {searchTerm || selectedCategory ? '搜尋後景點列表' : '景點總表'}</h2>
                  {filteredPlaces.length == 0 ? (
                    <p className="text-center">找不到符合條件的景點</p>
                  ) : (
                    <>
                      <ul>
                        {paginatedPlaces.map(place => (
                          <li key={place.id} className="cursor-pointer place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 hover:bg-green-100"
                            onClick={() => handleSelectPlace(place)}>
                            <span className="text-gray-600 cursor-pointer" > {place.name}</span>
                            <button
                              title="add-to-publish"
                              onClick={() => handleAddPlace(place)}
                              className="ml-2 bg-green-500 text-white p-2 pl-4 pr-4 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300">
                              <i className="fas fa-plus"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="pagination-controls">
                        <>
                          {Array.from({ length: totalPages }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => handlePageChange(i + 1)}
                              className={`mx-1 px-3 py-1  rounded-3xl ml-2
                                      ${currentPage === i + 1
                                  ? 'bg-sky-500 text-white'
                                  : 'bg-white text-black border-gray-300'}`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
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
                      <div key={index} className="image-preview mb-2 relative w-[200px] h-[200px]"  >
                        <Image
                          src={url}
                          alt={`${selectedPlace.name} image ${index}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {selectedPlace.createdTime &&
                      <div className=""> 發佈時間：{new Date(selectedPlace?.createdTime).toLocaleString("zh-TW", { hour12: true })}</div>
                    }
                    {selectedPlace?.updatedTime && selectedPlace?.updatedTime != "" &&
                      <div className=""> 更新時間：{new Date(selectedPlace?.updatedTime).toLocaleString("zh-TW", { hour12: true })} </div>
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
                  </div>
                </div>
              </>
            )}
          </div>
          )}
            {activeTab === 'content' && (
              <div className="mt-10 border-2 shadow-lg rounded-2xl p-3 " >
                <h2 className="text-xl font-bold mb-6"> 文章編輯區 </h2>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="地圖標題"
                  className="rounded-xl mb-5 p-2 w-full border rounded text-black focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <div className="bg-white text-black z-100 overflow-visible rounded-3xl">
                  <ReactQuill theme="snow" value={content} onChange={handleContentChange} />
                </div>
                <button
                  className={`mb-5 mt-5 p-3 flex justify-center items-center rounded-lg 
              cursor-pointer ${showSourceCode ? 'hover:bg-red-100 bg-gray-200' : 'hover:bg-green-200 bg-green-100'}
              focus:outline-none focus:ring-2 focus:ring-blue-300`}
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
                    className="mb-2 p-2 w-full border rounded text-gray-500 rounded-3xl"
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
                <div className=''>

                </div>
                <button
                  className="bg-green-300 mb-5 mt-5 m-2 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-20 w-32 cursor-pointer hover:border-gray-500 hover:bg-green-300"
                  onClick={handleConfirmPublish}>
                  <i className="fas fa-check mr-2"></i>
                  <div>確定發布</div>
                </button>
              </div>
            )}
          </div>
        </div>
        <AlertModal
          isOpen={showPublishConfirm}
          onClose={() => setShowPublishConfirm(false)}
          onConfirm={confirmFunction}
          message={confirmMessage}
          showConfirmButton={true}
        />
        <AlertModal
          isOpen={isAlertOpen}
          onClose={() => setIsAlertOpen(false)}
          message={alertMessage}
        />
      </div>
    </DndProvider>
  );
};
export default PublishMapPage;