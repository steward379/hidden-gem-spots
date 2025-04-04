import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import RainbowButtonModule from '@/src/styles/rainbowButton.module.css';
import QuillEditor from '@/src/components/QuillEditor';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSelector } from 'react-redux';
import PublishArea from '../components/PublishArea';
import DropzoneImage from '../components/DropzoneImage';
import AlertModal from '../components/AlertModal';
import { useAuth } from '../context/AuthContext';
import 'react-quill/dist/quill.snow.css';
import { collection, query, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import firebaseServices from '../utils/firebase';
const { db, storage } = firebaseServices;
import { selectPlacesRedux } from '../store/slices/placesSlice'
import { categoryMapping } from '../constants'
import { categoryMappingEN } from '../constants';
import { formatCoordinates, decimalToDms } from '../utils/decimalCoordinates';
import { useTranslation } from 'next-i18next';

const MapComponentWithNoSSR = dynamic(
  () => import('../components/MapComponent'),
  { ssr: false }
);

const PublishMapPage = () => {
  const { t, i18n } = useTranslation('common');

  function getCategoryText(categoryKey, language) {
    const categoryMappingNow = language === 'en-US' ? categoryMappingEN : categoryMapping;
    return categoryMappingNow[categoryKey]?.text || 'Unknown 不明';
  }

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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [articleTags, setArticleTags] = useState('');
  // const [showSourceCode, setShowSourceCode] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
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
  // const [hideRoutingMode, setHideRoutingMode] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const pagesPerGroup = 5;

  // const showIsRoutingMode = () => {
  //   setHideRoutingMode(false);
  // };
  // const hideIsRoutingMode = () => {
  //   setHideRoutingMode(true);
  // };

  // const toggleCollapse = () => {
  //   setIsCollapsed(!isCollapsed);
  // };

  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === '' || place.category === selectedCategory)
  );

  const activePlaces = searchTerm || selectedCategory ? filteredPlaces : places;
  const totalPages = Math.ceil(activePlaces.length / itemsPerPage);
  const totalGroups = Math.ceil(totalPages / pagesPerGroup);

  const paginatedPlaces = activePlaces.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleNextGroup = () => {
    const newGroupIndex = currentGroupIndex + 1;
    setCurrentGroupIndex(newGroupIndex);
    const newPage = newGroupIndex * pagesPerGroup + 1;
    setCurrentPage(newPage);
  };

  const handlePrevGroup = () => {
    if (currentGroupIndex > 0) {
      const newGroupIndex = currentGroupIndex - 1;
      setCurrentGroupIndex(newGroupIndex);
      const newPage = newGroupIndex * pagesPerGroup + 1;
      setCurrentPage(newPage);
    }
  };


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // const currentPlaces = filteredPlaces.slice(indexOfFirstItem, indexOfLastItem);

  // const handleMarkerClick = (place) => {
  //   // if ( selectedPlace == null||!selectedPlace || selectedPlace.id !== place.id) {
  //     setSelectedPlace(place);
  //   // }  
  //   // if ( selectedPlace == null||!selectedPlace || selectedPlace.id !== place.id) {
  //     setSelectedPlace(place);
  //   // }  
  // };

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

  // const handleContentChange = (content) => {
  //   setContent(content);
  // };

  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  const handleAddAll = () => {
    setConfirmMessage(t('publish-confirm-add-all'));
    setConfirmFunction(() => confirmAddAll);
    setShowPublishConfirm(true);
  };
  const confirmAddAll = () => {
    setPublishedPlaces(places);
    setAreAllPlacesAdded(true);
    setShowPublishConfirm(false);
  }
  const handleClearAll = () => {
    setConfirmMessage(t('publish-cancel-add-all'));
    setConfirmFunction(() => confirmClearAll);
    setShowPublishConfirm(true);
  };
  const confirmClearAll = () => {
    setPublishedPlaces([]);
    setAreAllPlacesAdded(false);
    setShowPublishConfirm(false);
  }
  const handleCancelPublish = () => {
    setConfirmMessage(t('publish-cancel-confirm'));

    setConfirmFunction(() => confirmHandleCancelPublish);
    setShowPublishConfirm(true);
  };
  const confirmHandleCancelPublish = (place) => {
    setIsPublishing(false);
    // setPublishedPlaces([]);
    Router.push('/map/');
  };

  const handleConfirmPublish = async () => {
    if (!title.trim() || !content.trim() || publishedPlaces.length === 0) {
      showAlert(t('publish-confirm-error'));

      return;
    }
    setConfirmMessage(t('publish-confirm-map'));
    setConfirmFunction(() => confirmPublish);
    setShowPublishConfirm(true);
  };

  const confirmPublish = async () => {
    try {
      let uploadedImageUrl = coverImage;
      if (coverImageFile) {
        uploadedImageUrl = await handleUploadCoverImage();
        setCoverImage(uploadedImageUrl);

      }
      const mapRef = doc(collection(db, 'publishedMaps', user.uid, 'maps'));

      const tagsArray = articleTags.split(',').map(tag => tag.trim());
      await setDoc(mapRef, {
        title: title.trim(),
        content: content.trim(),
        tags: tagsArray,
        coverImage: uploadedImageUrl,
        publishDate: new Date().toISOString(),
        updatedDate: '',
        userId: user.uid,
        likes: 0,
        likedBy: [],
        duplicates: 0,
        duplicatedBy: [],
        placesLikes: 0,
        placesLikedBy: [],
        popularity: 0,
      });

      const newPublishedPlaces = [];

      for (const place of publishedPlaces) {
        const placeRef = doc(collection(db, 'publishedMaps', user.uid, 'maps', mapRef.id, 'places'));
        const placeData = {
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
        await setDoc(placeRef, placeData);
        newPublishedPlaces.push({ ...place, id: placeRef.id });
      }
      setPublishedPlaces(newPublishedPlaces);
      setIsPublishing(false);
      showAlert(t('publish-map-success-msg'));
      Router.push(`/publishedMaps/${user?.uid}/maps/${mapRef?.id}`);
    } catch (error) {
      console.error('error while publishing the map', error);
      showAlert(t('publish-map-client-error-msg'));
      return;
    }
  };
  const handleAddToPublish = (place) => {
    if (!place || !place.id) {
      console.log('Invalid place object:', place);
      return;
    }
      
    // 檢查該地點是否已經在發布列表中
    if (!publishedPlaces.some(p => p?.id === place?.id)) {
      console.log('Adding place to published list:', place);
      setPublishedPlaces(prevPlaces => [...prevPlaces, place]);
    } else {
      console.log('Place already in published list:', place.id);
    }

  };
  const handleSelectPlace = (place) => {
    if (selectedPlace === null || !selectedPlace || selectedPlace?.id !== place?.id) {
      setSelectedPlace(place);
    }
    if (selectedPlace === null || !selectedPlace || selectedPlace?.id !== place?.id) {
      setSelectedPlace(place);
    }
  };

  const handleRemoveFromPublish = (placeId) => {
    setPublishedPlaces(prev => prev.filter(p => p?.id !== placeId));
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

    const storageRef = ref(storage, `covers/${user?.uid}/${coverImageFile?.name}`);
    const uploadTask = uploadBytesResumable(storageRef, coverImageFile);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask?.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL as string);
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
      <div className="publish-body flex flex-col h-screen-without-navbar md:flex-row text-black bg-gray-200">
        <div className="map-component lg:w-3/7 md:w-1/2 w-full lg:m-10 md:m-5 m-0 border">
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
            isTyping={isTyping}
          />
        </div>

        <div className="content-component relative md:overflow-y-auto overflow-hidden 
          lg:w-4/7 md:w-1/2 w-full lg:mb-10 lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5 
        bg-white shadow rounded ">
          <div className="content-nav sticky top-0 bg-white shadow-lg z-10 flex items-center space-x-3 px-3 py-2 overflow-hidden ">

            <div className="cancel-publish-btn p-2 rounded-3xl flex-column justify-center items-center bg-red-100 
                              border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-500 hover:bg-gray-200"
              onClick={handleCancelPublish}>
              <i className="cancel-publish-icon fas fa-circle-arrow-left "></i>
              <span className="cancel-publish-text ml-2 hidden lg:inline-block text-sm">
                {t('publish-cancel')}
              </span>
            </div>

            {activeTab === 'content' && (
              <div className="cancel-publish-btn p-2 rounded-3xl flex-column justify-center items-center 
                              border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-500 hover:bg-gray-200"
                onClick={() => setActiveTab('places')} >
                <i className="cancel-publish-icon fas fa-circle-arrow-left"></i>
                <span className="cancel-publish-text ml-2 hidden lg:inline-block text-sm">
                  {t('publish-switch-to-places-button')}
                </span>
              </div>
            )}

            {activeTab === 'places' && (
              <div className="cancel-publish-btn p-2 rounded-3xl flex-column justify-center items-center 
                              border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-500 hover:bg-gray-200"
                onClick={() => setActiveTab('content')} >
                <i className="cancel-publish-icon fas fa-circle-arrow-right"></i>
                <span className="cancel-publish-text ml-2 hidden lg:inline-block text-sm">
                  {t('publish-switch-to-content-button')}
                </span>
              </div>
            )}

            <div className="content-route-div flex">
              <div title="rainbow-route-btn" className="content-route-btn flex items-center space-x-1">
                <div title="route-mode"
                  className={`${RainbowButtonModule.rainbowButton} content-route-rainbow-btn justify-center items-center relative`}
                  style={{
                    // @ts-ignore
                    '--button-width': '45px',
                    '--button-height': '50px',
                    '--button-border-radius': '100px',
                  }}>
                  <div
                    className=" bg-white p-3 text-sm
                            font-medium hover:bg-black hover:text-green-500 rounded-full"
                    onClick={() => setIsRoutingMode(!isRoutingMode)}>
                    <div className="route-btn-icon">
                      {isRoutingMode ? <i className="fas fa-door-open"></i> : <i className="fas fa-route"></i>}
                    </div>
                  </div>
                </div>
                <div className="route-btn-text hidden lg:inline text-sm font-medium">
                  {isRoutingMode ? t('map-route-stop') : t('map-route-machine')}
                </div>
              </div>
            </div>

            {/* {activeTab === 'places' && (
              <div className="show-list flex items-center justify-start">
                <label htmlFor="toggle-spot-list" className="flex items-center cursor-pointer">
                  <div className="toggle-show-tab-div relative">
                    <input type="checkbox" id="toggle-spot-list" className="sr-only"
                      onChange={() => setShowPlacesList(!showPlacesList)} checked={showPlacesList} />
                    <div className={`toggle-spot-list-icon flex items-center w-16 h-9 rounded-full transition-colors ${showPlacesList ? 'bg-green-500' : 'bg-gray-400'}`}>
                      <i className={`fas ${showPlacesList ? 'fa-eye-slash ml-2 text-stone-500 ' : 'fa-eye ml-9 text-gray-900'} text-center`} ></i>
                    </div>
                    <div className={`dot absolute left-1 top-1 bg-white h-7 w-7 rounded-full transition transform ${showPlacesList ? 'translate-x-full' : ''}`}>
                    </div>
                  </div>
                  <div className="toggle-spot-list-text ml-2 text-gray-700 font-medium text-sm hidden lg:flex">
                    <i className="fas fa-list-ul"></i>
                    {showPlacesList ? '' : ''}
                  </div>
                </label>
              </div>
            )} */}

          </div>


          <div className="container lg:px-6 md:px-4 px-3 py-3">

            {/* <div className="toggle-content flex items-center justify-center">
              <label htmlFor="toggle-tab" className="flex items-center cursor-pointer">
                <div className="toggle-tab-div relative">
                  <input type="checkbox" id="toggle-tab" className="sr-only"
                    onChange={() => setActiveTab(activeTab === 'places' ? 'content' : 'places')}
                    checked={activeTab === 'content'} />
                  <div className={`toggle-content-icon flex items-center justify-${activeTab === 'content' ? 'start' : 'end'} w-16 h-9
                  rounded-full transition-colors ${activeTab === 'content' ? 'bg-yellow-500' : 'bg-blue-300'}`}>
                    <i className={`fas ${activeTab === 'content' ? 'fa-mountain-sun text-stone-500 pl-2' : 'fa-pencil text-gray-900 pr-2.5'} `} ></i>
                  </div>
                  <div className={`dot absolute left-1 top-1 bg-white h-7 w-7 rounded-full transition transform ${activeTab === 'content' ? 'translate-x-full' : ''}`}>
                  </div>
                </div>
                <div className="toggle-content-text ml-2 text-gray-700 font-medium text-sm hidden lg:flex">
                  {activeTab === 'places' ? t('publish-map-post') : t('map-spot')}
                </div>
              </label>
            </div> */}
            {activeTab === 'places' && (
              <div>
                <div>
                  <button
                    className=""
                    onClick={() => setIsCollapsed(!isCollapsed)}>
                    <div className="cursor-pointer">
                      <i className="fas fa-chevron-down"></i>
                      <i className="fas fa-question-circle ml-1"></i>
                      <span className="text-sm hidden lg:inline lg:ml-2 font-medium">{t('map-hint')}</span>
                    </div>
                  </button>
                  <div className={`transition-all duration-500 ease-in-out pl-2 pt-2 mb-1 mt-3 ${isCollapsed ?
                    'max-h-0' : 'max-h-36'} overflow-hidden`}>
                    <h1 className="mb-2 text-xl font-bold text-gray-800"> {user?.name} {t('publish-now-title')}</h1>
                    <div className="text-gray-600 mb-2">
                      {t('publish-hint-text-1')} <i className="fas fa-star"></i> {t('publish-hint-text-2')}
                    </div>
                  </div>

         

                </div>
                <div className="flex justify-start align-items m-4">
                    <button
                      className="publish-switch-places bg-amber-600 text-white font-bold py-2 px-4 rounded hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer mb-5"
                      onClick={() => setActiveTab('places')}
                    >
                      {t('publish-switch-to-content-button')}
                    </button>

                  <div title="route-mode"
                    className={`justify-center items-center relative`}>
                    <div
                      className={`px-4 py-2 text-sm text-center
                            font-medium hover:bg-black  hover:text-green-500
                            ${isDragModeEnabled ? 'bg-gray-200' : 'bg-yellow-200'}  
                            rounded-full mr-2`}
                      onClick={() => setIsDragModeEnabled(!isDragModeEnabled)}>
                      <div>
                        {isDragModeEnabled ? <i className="fa-regular fa-star"></i> : <i className="fa-solid fa-star"></i>}
                      </div>
                      <div className="hidden lg:inline">
                        {isDragModeEnabled ? t('publish-stop-drag') : t('publish-drag')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex">
                  <button
                    className="py-2 w-1/2 rounded-xl m-2 flex justify-center items-center border-2 bg-green-100 hover:bg-green-300 
                            hover:border-gray-500 cursor-pointer"
                    onClick={areAllPlacesAdded ? () => { } : handleAddAll}>
                    <i className="fas fa-plus-square text-green-500 mr-2"></i>
                    <div> {t('publish-add-all')}</div>
                  </button>
                  <button
                    className="py-2 w-1/2 rounded-xl m-2 flex justify-center items-center border-2 bg-gray-100 
                          hover:bg-red-300 hover:border-gray-500 cursor-pointer"
                    onClick={handleClearAll}
                  >
                    <i className="fas fa-trash text-gray-400 mr-2"></i>
                    <div> {t('publish-delete-all')}</div>
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
                              onFocus={() => setIsTyping(true)}
                              onBlur={() => setIsTyping(false)}
                              placeholder={t('map-search-name-tag')}
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
                            <option value="">{t('map-search-cat')}</option>
                            {Object.entries(categoryMapping).map(([key, { text }]) => (
                              <option key={key} value={key}>{text}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <h2 className="text-lg font-semibold mb-2 text-center">
                        {searchTerm || selectedCategory ? t('map-search-list') : t('map-all-attractions')}
                      </h2>
                      {filteredPlaces.length == 0 ? (
                        <p className="text-center">{t('map-search-not-found')}</p>
                      ) : (
                        <>
                          <ul>
                            {paginatedPlaces.map(place => (
                              <li key={place.id} className="cursor-pointer place-item flex justify-between 
                          items-center p-2 border border-gray-300 rounded m-2 hover:bg-green-100"
                                onClick={() => handleSelectPlace(place)}>
                                <span className="text-gray-600 cursor-pointer" > {place.name}</span>
                                <button
                                  title="add-to-publish"
                                  onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    handleAddPlace(place);
                                  }}
                                  className="ml-2 bg-green-500 text-white p-2 pl-4 pr-4 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300">
                                  <i className="fas fa-plus"></i>
                                </button>
                              </li>
                            ))}
                          </ul>

                          <div className="pagination-controls text-center mt-4">
                            <>
                              {currentGroupIndex > 0 && (
                                <button
                                  onClick={handlePrevGroup}
                                  className="pagination-prev mx-1 px-3 py-1 rounded-3xl bg-sky-300 text-black border-gray-300">
                                  {t("publish-map-last-group-page")}
                                </button>
                              )}

                              {Array.from({
                                length: Math.min(pagesPerGroup, totalPages - currentGroupIndex * pagesPerGroup)
                              }, (_, i) => {
                                const pageIndex = currentGroupIndex * pagesPerGroup + i + 1;
                                return (
                                  <button
                                    key={pageIndex}
                                    onClick={() => handlePageChange(pageIndex)}
                                    className={`mx-1 px-3 py-1 rounded-3xl ml-2 ${currentPage === pageIndex ? 'bg-sky-500 text-white' : 'bg-white text-black border-gray-300'
                                      }`}
                                  >
                                    {pageIndex}
                                  </button>
                                );
                              })}

                              {currentGroupIndex < totalGroups - 1 && (
                                <button
                                  onClick={handleNextGroup}
                                  className="pagination-next mx-1 px-3 py-1 rounded-3xl bg-sky-300 text-black border-gray-300">
                                  {t("publish-map-next-group-page")}
                                </button>
                              )}
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
                        {getCategoryText(selectedPlace.category, i18n.language) || t('unknown')}
                      </div>
                      <div className="mt-5">
                        {selectedPlace.images?.map((url, index) => (
                          <div key={index} className="image-preview mb-2 relative w-[200px] h-[200px] overflow-hidden"  >
                            <LazyLoadImage effect="blur"
                              src={url}
                              alt={`${selectedPlace.name} image ${index}`}
                              layout="responsive"
                              width={200}
                              height={200}
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {selectedPlace.createdTime &&
                          <div className=""> {t('map-publish-time')}{new Date(selectedPlace?.createdTime).toLocaleString("zh-TW", { hour12: true })}</div>
                        }
                        {selectedPlace?.updatedTime && selectedPlace?.updatedTime != "" &&
                          <div className=""> {t('map-update-time')}{new Date(selectedPlace?.updatedTime).toLocaleString("zh-TW", { hour12: true })} </div>
                        }
                        <div className="mb-3">{formatCoordinates(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng)}</div>
                      </div>
                      <div className="flex">
                        <Link href={`https://www.google.com/maps/place/?q=place_name:${selectedPlace.name}`} target="_blank" passHref>
                          <button className="flex items-center mr-3 bg-blue-100 text-black px-3 py-2  rounded hover:bg-blue-400 
                      hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                            <i className="fab fa-google mr-1"></i>
                            <i className="fa-solid fa-magnifying-glass mr-1"></i>
                            <i className="fas fa-external-link mr-1.5"></i>
                            <div className="hidden lg:flex"> {t('map-spot-title')}</div>
                          </button>
                        </Link>
                        <Link href={`https://www.google.com/maps/place/${decimalToDms(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng)}`}
                          target="_blank" passHref>
                          <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 
                      hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                            <i className="fab fa-google mr-1"></i>
                            <i className="fa-solid fa-globe mr-1.5"></i>
                            <i className="fas fa-external-link mr-1.5"></i>
                            <span className="hidden lg:flex"> {t('map-spot-coordinates')} </span>
                          </button>
                        </Link>
                      </div>
                    </div>
                  </>
                )}

<div className="sticky bg-white bottom-0 left-0 w-[100%] shadow-inner z-10 flex justify-end items-center py-2 px-3 space-x-3">
                <button
                  className="mb-3 mt-5 m-2 bg-green-100 flex justify-center items-center border-2 border-dashed 
                          border-gray-300 rounded-lg h-12 w-40 cursor-pointer hover:border-green-500 
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => setActiveTab('content')} >
                  <i className="fas fa-arrow-right mr-2"></i>
                  <span> {t('publish-switch-to-content-button')} </span>
                </button>
              </div>
              </div>

              

              
            )}
            {activeTab === 'content' && (
              <>
              <div className="publish-content mt-10 border-2 shadow-lg rounded-2xl p-3 " >

                <h1 className="publish-map-post-slogan text-xl font-bold mb-6">
                  {t('publish-map-post-slogan')}
                </h1>
                <button
                  className="publish-switch-places bg-amber-600 text-white font-bold py-2 px-4 
                  rounded hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 
                  cursor-pointer mb-5"
                  onClick={() => setActiveTab('places')}
                >
                  {t('publish-switch-to-places-button')}
                </button>

                <h2 className="publish-map-title font-medium text-lg mb-3">
                  {t('publish-map-post-title')}
                </h2>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  placeholder={t("publish-map-post-title")}
                  className=" mb-5 p-2 w-full border rounded-xl text-black focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />

                <h3 className="publish-map-content font-medium text-lg mb-3">
                  {t('publish-map-post-content')}
                </h3>

                <QuillEditor
                  content={content}
                  onContentChange={setContent}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)} />

                <h3 className="publish-map-tags font-medium text-lg mb-3">
                  {t('publish-map-post-tags')}
                </h3>

                <input
                  type="text"
                  placeholder={t('map-spot-tags')}
                  value={articleTags}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  onChange={(e) => setArticleTags(e.target.value)}
                  className="p-2 w-full mb-2 border  text-black rounded-xl"
                />

                <h3 className="publish-map-cover font-medium text-lg mb-3">
                  {t('publish-map-post-cover-photo')}
                </h3>

                <DropzoneImage onFileUploaded={handleFileUpload} />
                {coverImagePreview && (
                  <div className="relative mt-2 mb-10 w-200 h-100 overflow-hidden">
                    <LazyLoadImage
                      effect="blur"
                      src={coverImagePreview}
                      alt="Cover Preview"
                      width="200"
                      height="100"
                      className="object-cover"
                      layout="responsive"
                    />
                    <button
                      className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full hover:bg-red-700"
                      onClick={() => setCoverImagePreview('')}>
                      {t('publish-delete-cover')}
                    </button>
                  </div>
                )}
              </div>
              <div className="sticky bg-white bottom-0 left-0 w-[100%] shadow-inner z-10 flex justify-end items-center py-2 px-3 space-x-3">
                <button
                  className="mb-3 mt-5 m-2 bg-green-100 flex justify-center items-center border-2 border-dashed 
                          border-gray-300 rounded-lg h-12 w-40 cursor-pointer hover:border-green-500 
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleConfirmPublish}>
                  <i className="fas fa-check mr-2"></i>
                  <span> {t('publish-map-post-publish')} </span>
                </button>
              </div>
              </>
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