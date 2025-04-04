import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Link from 'next/link';
import {
  collection, query, onSnapshot, getDocs, updateDoc, getDoc,
  addDoc, where, doc, setDoc, deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import firebaseServices from '../../utils/firebase';
const { db, storage } = firebaseServices;
import { useAuth } from '../../context/AuthContext';

import AlertModal from '../../components/AlertModal'
import DropzoneImage from '../../components/DropzoneImage';
import GooglePlaces from '../../components/GooglePlaces';
import { KmzFileUploader } from '../../components/KmzFileUploader';
import KmzPlacesList from '../../components/KmzPlacesList';
import { parseFile } from '@/src/utils/kmzKmlParser';

import { useDispatch } from 'react-redux';
import { setPlacesRedux } from '../../store/slices/placesSlice';

import { categoryMapping } from '../../constants';
import { categoryMappingEN } from '../../constants';

import { formatCoordinates, decimalToDms } from '../../utils/decimalCoordinates'

import RainbowButtonModule from '@/src/styles/rainbowButton.module.css';

import { useTranslation } from 'next-i18next';

import { useRouter } from 'next/router';

import { Place } from '../../types/Place';
// import { NewMarkerData } from '../../types/NewMarkerData';

const MapComponentWithNoSSR = dynamic(
  () => import('../../components/MapComponent'),
  { ssr: false }
);
const MapDemoPage: React.FC = () => {
  const [file, setFile] = useState(null);
  const [kmzPlaces, setKmzPlaces] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [googlePlacesSearchForNewMarker, setGooglePlacesSearchForNewMarker] = useState(false);
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

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]);
  const [showPlacesList, setShowPlacesList] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(7);

  const router = useRouter();
  const { t, i18n } = useTranslation('common');

  function getCategoryText(categoryKey, language) {
    const categoryMappingNow = language === 'en-US' ? categoryMappingEN : categoryMapping;
    return categoryMappingNow[categoryKey]?.text || 'Unknown 不明';
  }

  const pagesPerGroup = 5;

  const filteredPlaces = places?.filter(place =>
    (place.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      place.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (place.category === selectedCategory || selectedCategory === '')
  );

  const indexOfLastPlace = currentPage * itemsPerPage;
  const indexOfFirstPlace = indexOfLastPlace - itemsPerPage;
  const currentPlaces = filteredPlaces.slice(indexOfFirstPlace, indexOfLastPlace);

  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  // const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const totalGroups = Math.ceil(totalPages / pagesPerGroup);

  const paginatedPlaces = filteredPlaces.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleGroupChange = (newGroupIndex) => {
    setCurrentGroupIndex(newGroupIndex);
    // 設置當前頁面為新分組的第一頁
    const firstPageOfNewGroup = newGroupIndex * pagesPerGroup + 1;
    setCurrentPage(firstPageOfNewGroup);
  };



  useEffect(() => {
    const handleRouteChange = () => {
      i18n.changeLanguage(router.locale);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.locale, router.events, i18n]);

  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
  };
  const handleUploadClick = () => {
    setShowImportConfirm(true);
  };
  const confirmUpload = async () => {
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
  // const cancelSelect = () => {
  //   setSelectedPlace(null);
  // }
  const uploadImage = async (file: File, userId: string, placeName: string): Promise<string> => {
    const storageRef = ref(storage, `places/${userId}/${placeName}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // snapshot.bytesTransferred 和 snapshot.totalBytes
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
        URL.revokeObjectURL(imageUrl);
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
    setPreviewImages(place.images);
    setIsEditing(true);
    setSelectedPlace(place);

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
    const placeRef = doc(db, `users/${userId}/places`, placeId);

    const placeSnap = await getDoc(placeRef);

    if (placeSnap.exists()) {
      const placeData = placeSnap.data();
      const imageUrls = placeData.images;

      const newImages = imageUrls.filter((url) => url !== imageUrl);

      await updateDoc(placeRef, { images: newImages });
      await fetchPlaces();

      const updatedPlaceSnap = await getDoc(placeRef);
      if (updatedPlaceSnap.exists()) {
        const updatedPlaceData = updatedPlaceSnap.data();
      }
    }
  }
  function extractStoragePathFromUrl(downloadUrl: string): string {
    const url = new URL(downloadUrl);
    const path = url.pathname;

    const decodedPath = decodeURIComponent(path).split('/o/')[1];
    return decodedPath.split('?')[0];
  }
  const updatePlace = async (placeId: string) => {
    if (!newMarker || !userId || !selectedPlace) return;
    const newImageUrls = await Promise.all(
      images.map(file => uploadImage(file, userId, placeId))
    );
    const updatedImages = [...(newMarker.images || []), ...newImageUrls];

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
      place.id === placeId ? { ...place, ...updatedPlaceData } : place
    ));

    const imagesToDelete = originalImageUrls.filter(url => !previewImages.includes(url));

    for (const url of imagesToDelete) {

      const storagePath = extractStoragePathFromUrl(url);
      const imageRef = ref(storage, storagePath);

      try {
        await deleteObject(imageRef);
        await removeImageFromFirestore(placeId, url, userId);
      } catch (error) {
        if (error.code === 'storage/object-not-found') {
          showAlert(t('map-image-not-found'))
          // console.warn(`Image not found in storage, might be already deleted: ${storagePath}`);
        } else {
          showAlert(t('map-image-unknown-error'))
          console.error(`Error deleting image from storage: ${error}`);
        }
      }
    }
    setIsEditing(false);
    setSelectedPlace(null);
    setNewMarker(null);
    setImages([]);
    setPreviewImages([]);
  };

  const createNewPlace = async () => {
    if (!userId || !newMarker) return;
    try {
      const imageUrls = await Promise.all(images.map(file => uploadImage(file, userId, newMarker.name)));

      const currentTime = new Date().toISOString();

      const newPlace = {
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

      const placesRef = collection(db, `users/${userId}/places`);
      const docRef = await addDoc(placesRef, newPlace);

      setPlaces(prev => [...prev, { id: docRef.id, ...newPlace }]);
      setNewMarker(null);

      setIsAddingMarker(false);
      setIsEditing(false);
    } catch (e) {
      showAlert(t('map-add-spot-fail'));
      console.error("Error adding document: ", e);
    }
    setPreviewImages([]);
    setImages([]);
  };
  const handleSubmit = async () => {
    if (!newMarker || !userId) return;

    const isFieldValid = (field) => field && field.trim().length > 0;
    if (!isFieldValid(newMarker.name)) {
      showAlert(t('map-add-spot-title-alert'));
      return;
    } else if (!isFieldValid(newMarker.description)) {
      showAlert(t('map-add-spot-des-alert'));
      return;
    } else if (!isFieldValid(newMarker.category)) {
      showAlert(t('map-add-spot-cat-alert'));
      return;
    } else if (!newMarker.coordinates) {
      showAlert(t('map-add-spot-marker-alert'));
      return;
    }

    if (isEditing && selectedPlace) {
      await updatePlace(selectedPlace.id);
      setActiveTab('places');
    } else {
      await createNewPlace();
      setActiveTab('places');
    }
  };

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
    if (places.length === 0) {
      showAlert(t('map-not-yet-spot'));
      return;
    }
    Router.push('/publish-map');
  };

  // const hideAddingMarkerAction = () => {
  //   setHideAddingMarker(true);
  // }
  // const hideIsRoutingMode = () => {
  //   setHideRoutingMode(true);
  // }
  const hideUploadGeoAction = () => {
    setHideUploadGeo(true);
  }
  // const showAddingMarkerAction = () => {
  //   setHideAddingMarker(false);
  // }
  // const showIsRoutingMode = () => {
  //   setHideRoutingMode(false);
  // }
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
    if (selectedPlace) {
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
  const handleSelectPlace = (googlePlaceMigrate) => {
    // setSelectedPlace(googlePlaceMigrate);
  };
  const handleSelectPlaceForNewMarker = (place: Place) => {
    // setNewMarker(place);
    // toggleGooglePlacesSearch(false);
  };
  const closeGooglePlacesSearch = () => {
    setGooglePlacesSearch(false);
    setGooglePlacesSearchForNewMarker(false);
  }

  const [activeTab, setActiveTab] = useState('places');
  const [showPlaceInArticle, setShowPlaceInArticle] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen-without-navbar text-black bg-gray-200">
      <div className="lg:w-3/7 md:w-1/2 w-full lg:m-10 md:m-5 m-0 border">
        <MapComponentWithNoSSR
          onMarkerPlaced={handleMarkerPlaced}
          isAddingMarker={isAddingMarker}
          isEditing={isEditing}
          places={places}
          onCancel={handleCancel}
          onMarkerClick={setSelectedPlace}
          onMapClick={() => setSelectedPlace(null)}
          selectedPlace={selectedPlace}
          showInteract={false}
          isRoutingMode={isRoutingMode}
          setIsRoutingMode={setIsRoutingMode}
        />
      </div>
      <div className="relative md:overflow-x-visible lg:overflow-x-visible md:overflow-y-auto
        lg:w-4/7 md:w-1/2 w-full lg:mb-10 lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5 
         bg-white shadow rounded">

        <div className="sticky top-0 bg-white shadow-lg z-10 flex items-center py-2 pl-3 space-x-3 my-5">
          
          <div className="flex items-center justify-center">
            <label htmlFor="toggle-tab" className="flex items-center cursor-pointer">
              <div className="relative">
                <input type="checkbox" id="toggle-tab" className="sr-only"
                  onChange={() => setActiveTab(activeTab === 'places' ? 'content' : 'places')}
                  checked={activeTab === 'content'} />
                <div className={`flex items-center justify-${activeTab === 'content' ? 'start' : 'end'} w-16 h-9 rounded-full transition-colors 
                                    ${activeTab === 'content' ? 'bg-yellow-500' : 'bg-blue-300'}`}>
                  <i className={`fas ${activeTab === 'content' ? 'fa-mountain-sun text-gray-700 pl-2' : 'fa-pencil text-gray-900 pr-2.5'} `} ></i>
                </div>
                <div className={`dot absolute left-1 top-1 bg-white h-7 w-7 rounded-full transition transform ${activeTab === 'content' ? 'translate-x-full' : ''}`}>
                </div>
              </div>
              <div className="ml-2 text-gray-700 font-medium text-sm hidden lg:flex">
                {activeTab === 'places' ? t('map-post') : t('map-spot')}
              </div>
            </label>
          </div>

          {activeTab === 'places' && (
            <div className="place-list flex items-center justify-center">
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
          )}

<div className="flex">
            <div title="rainbow-route-btn" className="flex items-center space-x-1">
              <div title="route-mode"
                className={`${RainbowButtonModule.rainbowButton} justify-center items-center relative`}
                style={{
                  // @ts-ignore
                  '--button-width': '45px',
                  '--button-height': '50px',
                  '--button-border-radius': '50%',
                }}>
                <button
                  className=" bg-white p-3 text-sm
                            font-medium hover:bg-black hover:text-green-500 rounded-full"
                  onClick={() => setIsRoutingMode(!isRoutingMode)} aria-label="Route-mode">
                  <div>
                    {isRoutingMode ? <i className="fas fa-door-open"></i> : <i className="fas fa-route"></i>}
                  </div>
                </button>
              </div>
              <div key={router.locale} className="hidden lg:inline text-sm font-medium">
                {isRoutingMode ? t('map-route-stop') : t('map-route-machine')}
              </div>
            </div>
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
              <span className="text-sm hidden lg:inline lg:ml-2 font-medium">{t('map-hint')}</span>
            </div>
          </button>
          <div className={`mb-4 transition-all duration-500 ease-in-out mt-3 ${isCollapsed ? 'max-h-0' : 'max-h-40'} overflow-hidden`}>
            <h1 className="text-xl font-bold text-gray-800 mb-2"> {user?.name} {t('map-big-title')}</h1>
            <div className="text-gray-600 text-sm max-w-md">
              {t('map-des-1')} <span className="ml-1 mr-1">
                <i className="fas fa-location-dot text-red-500"></i>
              </span> {t('map-des-2')}  <span className="ml-1 mr-1">
                <i className="fas fa-location-pin text-red-500"></i>
              </span> {t('map-des-3')} <span className="ml-1 mr-1">
                <i className="fas fa-eye text-red-500"></i>
              </span>  {t('map-des-4')} <i className="fab fa-google text-red-500 pr-[0.5px]"> </i>{t('map-des-5')}
              <i className="fas fa-route text-green-600"></i> {t('map-des-6')}
            </div>
          </div>

          <div className="flex items-center space-x-1 mb-6">
            <button
              title="add-marker"
              className="relative py-1 px-3 rounded-full flex justify-center items-center border-2 
                            border-dashed border-gray-300 cursor-pointer hover:border-gray-500 hover:bg-green-300">
              <div className=" w-full h-full flex-column justify-center items-center rounded-full ml-1 mr-1"
                onClick={toggleAddingMarker}>
                <i className={`fas ${isAddingMarker ? 'fa-times' : 'fa-location-dot'}`}></i>
                <div className="text-sm hidden lg:block font-medium">{isAddingMarker ? t('map-cancel-add-marker') : t('map-add-marker')}</div>
              </div>
            </button>
          </div>


          <div> {isAddingMarker && !newMarker && (<div className="absolute top-[80px] bg-green-200 shadow-lg mt-6 p-2 rounded-2xl right-[70px] max-w-[120px] text-sm text-black-600">
            {t('map-hint-add')}</div>)}
          </div>
          <div> {isRoutingMode && !selectedPlace && (<div className="absolute top-[110px] bg-green-200 shadow-lg  p-2 rounded-2xl right-[70px] max-w-[120px] text-sm text-black-600">
            {t('map-hint-route')}</div>)} </div>
          {activeTab === 'places' && (
            <>
              <div className="flex flex-wrap space-x-2 mb-5">
                <div className="mt-3 lg:mt-0">
                  {hideUploadGeo ? (
                    <i className={`cursor-pointer hover:text-blue-500 absolute right-5 top-[150px] fas fa-file-import text-xl border-2 rounded-full px-2 py-1 shadow-md`}
                      onClick={showUploadGeoAction}
                    ></i>
                  ) : (
                    <>
                      <div className="border-2 w-60 rounded-3xl p-2 mt-5 md:mt-2 ml-2 shadow-lg flex-col items-center">
                        <div className="relative">
                          <button title="show Geo"
                            onClick={hideUploadGeoAction} className="absolute hide-upload flex border-2 p-2 rounded-full left-[-20px] top-[-26px] bg-white shadow-lg">
                            <i className="fas fa-minus"></i>
                          </button>
                        </div>
                        <KmzFileUploader onFileSelected={handleFileSelected} onUploadClick={handleUploadClick}
                          isProcessing={isProcessing} />
                      </div>
                      <div>
                        {kmzPlaces && (<>
                          <div className="mt-6 mb-4 text-center cursor-pointer bg-red-200 w-36 text-red-700 p-2 rounded-full hover:bg-black hover:text-blue-500 "
                            onClick={() => setKmzPlaces('')}>
                            {t('map-kmz-close')}
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
                  {!newMarker && showPlacesList && (
                    <div className="places-list mt-4 mb-6">
                      <div className="search-and-filter border-2 shadow-lg rounded-2xl">
                        <div className="flex flex-col px-3 mt-5 md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
                          <div className="flex-1 relative">
                            <div className="flex items-center justify-center">
                              <div><i className="fas fa-search text-black mr-2"></i></div>
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('map-search-name-tag')}
                                className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500" />
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
                                <option key={key} value={key}>
                                  {/* {text} */}
                                  {getCategoryText(key, i18n.language)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {searchTerm || selectedCategory ? (
                          <div className="p-2 flex-column">
                            <h2 className="text-lg font-semibold mb-2 text-center">{t('map-search-list')}</h2>
                            {filteredPlaces.length === 0 ? (
                              <p className="text-center">{t('map-search-not-found')}</p>
                            ) : (
                              <>
                                {currentPlaces.map((place) => (
                                  <div key={place.id} className="hover:bg-green-100 place-item flex justify-between items-center
                                      p-2 border border-gray-300 rounded m-2 cursor-pointer"
                                    onClick={() => handlePlaceSelect(place)}>
                                    {place.name}
                                  </div>
                                ))}
                                <div className="pagination-controls pagination text-center mt-4">
                                  {currentGroupIndex > 0 && (
                                    <button onClick={() => handleGroupChange(currentGroupIndex - 1)} className="pagination-prev mx-1 px-3 py-1 rounded-lg bg-sky-300 text-black">
                                      {t("publish-map-last-group-page")}
                                    </button>
                                  )}
                                  {/* {Array.from({ length: totalPages }, (_, index) => (
                                    <button
                                      key={index}
                                      onClick={() => paginate(index + 1)}
                                      className={`px-3 py-1 m-1 rounded-full 
                                      ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
                                        {index + 1}
                                    </button>
                                  ))} */}
                                  {Array.from({
                                    length: Math.min(pagesPerGroup, totalPages - currentGroupIndex * pagesPerGroup)
                                  }, (_, i) => {
                                    const pageIndex = currentGroupIndex * pagesPerGroup + i + 1;
                                    return (
                                      <button key={pageIndex} onClick={() => handlePageChange(pageIndex)} className={`mx-1 px-3 py-1 rounded-lg ${currentPage === pageIndex ? 'bg-sky-500 text-white' : 'bg-white text-black'}`}>
                                        {pageIndex}
                                      </button>
                                    );
                                  })}

                                  {currentGroupIndex < totalGroups - 1 && (
                                    <button onClick={() => handleGroupChange(currentGroupIndex + 1)} className="pagination-next mx-1 px-3 py-1 rounded-lg bg-sky-300 text-black">
                                      {t("publish-map-next-group-page")}
                                    </button>
                                  )}

                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 flex-column">
                            <h2 className="text-lg font-semibold mb-2 text-center">
                              {t('map-all-attractions')}
                            </h2>
                            {currentPlaces.map((place) => (
                              <div key={place.id} className="hover:bg-green-100 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer"
                                onClick={() => handlePlaceSelect(place)}>
                                {place.name}
                              </div>
                            ))}
                            {/* <div className="pagination text-center">
                              {Array.from({ length: totalPages }, (_, index) => (
                                <button
                                  key={index}
                                  onClick={() => paginate(index + 1)}
                                  className={`rounded-full px-3 py-1 m-1 
                                  ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
                                    {index + 1}
                                </button>
                              ))}
                            </div> */}
                            <div className="pagination-controls pagination text-center mt-4">
                              {currentGroupIndex > 0 && (
                                <button onClick={() => handleGroupChange(currentGroupIndex - 1)} className="pagination-prev mx-1 px-3 py-1 rounded-lg bg-sky-300 text-black">
                                  {t("publish-map-last-group-page")}
                                </button>
                              )}
                              {Array.from({
                                length: Math.min(pagesPerGroup, totalPages - currentGroupIndex * pagesPerGroup)
                              }, (_, i) => {
                                const pageIndex = currentGroupIndex * pagesPerGroup + i + 1;
                                return (
                                  <button key={pageIndex} onClick={() => handlePageChange(pageIndex)} className={`mx-1 px-3 py-1 rounded-lg ${currentPage === pageIndex ? 'bg-sky-500 text-white' : 'bg-white text-black'}`}>
                                    {pageIndex}
                                  </button>
                                );
                              })}

                              {currentGroupIndex < totalGroups - 1 && (
                                <button onClick={() => handleGroupChange(currentGroupIndex + 1)} className="pagination-next mx-1 px-3 py-1 rounded-lg bg-sky-300 text-black">
                                  {t("publish-map-next-group-page")}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              {!selectedPlace && (<span className="border-2 rounded-2xl shadow-lg px-3 py-2 text-sm bg-green-200">{t('map-selected-spot-hint')} </span>)}
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
                            width="200px"
                            height="200px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                      {selectedPlace.createdTime &&
                        <div className="text-sm"> {t('map-publish-time')}{new Date(selectedPlace?.createdTime).toLocaleString("zh-TW", { hour12: true })}</div>
                      }

                      {selectedPlace?.updatedTime && selectedPlace?.updatedTime != "" &&
                        <div className="text-sm"> {t('map-update-time')}{new Date(selectedPlace?.updatedTime).toLocaleString("zh-TW", { hour12: true })} </div>
                      }
                      <div className="mb-3">{formatCoordinates(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng)}</div>
                    </div>
                    <div className="flex">
                      <Link href={`https://www.google.com/maps/place/?q=place_name:${selectedPlace.name}`} target="_blank" passHref>
                        <button className="flex items-center mr-3 bg-blue-100 text-black px-3 py-2  rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                          <i className="fab fa-google mr-1"></i>
                          <i className="fa-solid fa-magnifying-glass mr-1"></i>
                          <i className="fas fa-external-link mr-1.5"></i>
                          <div className="hidden lg:flex"> {t('map-spot-title')}</div>
                        </button>
                      </Link>
                      <Link href={`https://www.google.com/maps/place/${decimalToDms(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng)}`} target="_blank" passHref>
                        <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                          <i className="fab fa-google mr-1"></i>
                          <i className="fa-solid fa-globe mr-1.5"></i>
                          <i className="fas fa-external-link mr-1.5"></i>
                          <span className="hidden lg:flex"> {t('map-spot-coordinates')}</span>
                        </button>
                      </Link>
                      <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-black hover:text-red-500
                                  focus:outline-none focus:ring-2 focus:ring-blue-300"
                        onClick={handleGooglePlaces} >
                        <i className="fa-solid fa-directions mr-1.5"></i>
                        <span className="hidden lg:flex"> {t('map-spots-nearby')}</span>
                      </button>
                    </div>
                    <button
                      title="edit-place"
                      className=" h-12 w-12 absolute right-[-15px] top-10 mb-5 mt-5 m-2 bg-blue-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-full cursor-pointer
               hover:border-gray-500 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => handleEditClick(selectedPlace)} aria-label="Edit the spot">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      title="delete-place"
                      className=" h-12 w-12  absolute right-[-15px] top-24 mb-5 mt-5 m-2 bg-red-100 flex-column justify-center items-center border-2 border-gray-300  rounded-full cursor-pointer hover:border-gray-500 hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                      onClick={handleDeletePlace} aria-label="Delete the Spot">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  {googlePlacesSearch && (<div className="flex-col items-center justify-center">
                    <button title="close-search"
                      // tailwind beautiful buttons
                      className="w-full button px-4 py-3 bg-red-100 rounded-full mt-3 "
                      onClick={closeGooglePlacesSearch}>
                      {t('map-close-google-places')}
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
              <button title="show-places" className="bg-blue-100 p-2 rounded-full border-2 px-3 py-2 text-sm  hover:bg-yellow-400"
                onClick={() => setShowPlaceInArticle(!showPlaceInArticle)}> {showPlaceInArticle ? t('map-not-show-selected') : t('map-show-selected')} </button>
              <div className="mt-2">
                {!selectedPlace && showPlaceInArticle && (<span className="border-2 rounded-2xl shadow-lg px-3 py-2 text-sm bg-green-200"> {t('map-selected-spot-hint')} </span>)}
                {selectedPlace && showPlaceInArticle && (
                  <>
                    <div className="mt-5 mb-5 relative p-4 bg-white border-2 rounded-2xl shadow-lg pr-12">
                      <div className="absolute right-0 top-0 text-black cursor-pointer p-5" onClick={handlePlaceClose} aria-label="hidden_spot_display">
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
                        {/* {categoryMapping[selectedPlace.category]?.text || t('unknown')} */}
                        {getCategoryText(selectedPlace.category, i18n.language) || t('unknown')}
                      </div>

                      <div className="mt-5">
                        {selectedPlace.images?.map((url, index) => (
                          <div key={index} className="image-preview mb-2 relative w-200 h-200 overflow-hidden"  >
                            <LazyLoadImage effect="blur"
                              src={url}
                              alt={`${selectedPlace.name} image ${index}`}
                              width="200"
                              height="200"
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {selectedPlace.createdTime &&
                          <div className="text-sm"> {t('map-publish-time')}{new Date(selectedPlace?.createdTime).toLocaleString("zh-TW", { hour12: true })}</div>
                        }

                        {selectedPlace?.updatedTime && selectedPlace?.updatedTime != "" &&
                          <div className="text-sm"> {t('map-update-time')}{new Date(selectedPlace?.updatedTime).toLocaleString("zh-TW", { hour12: true })} </div>
                        }
                        <div className="mb-3">{formatCoordinates(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng)}</div>
                      </div>
                      <div className="flex">
                        <Link href={`https://www.google.com/maps/place/?q=place_name:${selectedPlace.name}`} target="_blank" passHref>
                          <button className="flex items-center mr-3 bg-blue-100 text-black px-3 py-2  rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                            <i className="fab fa-google mr-1"></i>
                            <i className="fa-solid fa-magnifying-glass mr-1"></i>
                            <i className="fas fa-external-link mr-1.5"></i>
                            <div className="hidden lg:flex">{t('map-spot-title')}</div>
                          </button>
                        </Link>
                        <Link href={`https://www.google.com/maps/place/${decimalToDms(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng)}`} target="_blank" passHref>
                          <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                            <i className="fab fa-google mr-1"></i>
                            <i className="fa-solid fa-globe mr-1.5"></i>
                            <i className="fas fa-external-link mr-1.5"></i>
                            <span className="hidden lg:flex">{t('map-spot-coordinates')}</span>
                          </button>
                        </Link>
                        <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-black hover:text-red-500
                                    focus:outline-none focus:ring-2 focus:ring-blue-300"
                          onClick={handleGooglePlaces} >
                          <i className="fa-solid fa-directions mr-1.5"></i>
                          <span className="hidden lg:flex"> {t('map-spots-nearby')}</span>
                        </button>
                      </div>
                      <button
                        title="edit-place"
                        className=" h-12 w-12 absolute right-[-15px] top-10 mb-5 mt-5 m-2 bg-blue-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 rounded-full cursor-pointer
                hover:border-gray-500 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => handleEditClick(selectedPlace)} aria-label="Edit the spot">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        title="delete-place"
                        className=" h-12 w-12  absolute right-[-15px] top-24 mb-5 mt-5 m-2 bg-red-100 flex-column justify-center items-center border-2 border-gray-300  rounded-full cursor-pointer hover:border-gray-500 hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                        onClick={handleDeletePlace} aria-label="Delete the spot">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>

                  </>
                )}
              </div>

              <div className="mt-3 border-2 rounded-2xl shadow-lg px-4 py-2 text-sm bg-green-50"> {t('map-add-marker-hint-1')} <i className="fas fa-map-marker-alt"></i> {t('map-add-marker-hint-2')} <i className="fas fa-edit"></i> {t('map-add-marker-hint-3')}</div>
              {newMarker && (
                <div className="relative mb-5 p-4 bg-white border-2 shadow-lg rounded-2xl">
                  <h3 className="text-lg font-semibold mb-2 text-black">{isEditing ? t('map-edit-spot') : t('map-add-spot')}</h3>
                  <div className="absolute top-3 right-5 cursor-pointer"> {isEditing ? (
                    <div onClick={handleCancelEdit}> <i className="fas fa-times"></i></div>
                  ) : (
                    <div onClick={toggleAddingMarker}> <i className="fas fa-times"></i></div>
                  )}
                  </div>
                  <input
                    type="text"
                    placeholder={t('map-spot-title')}
                    value={newMarker.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="p-2 w-full mb-2 border rounded text-black" />
                  <textarea
                    placeholder={t('map-spot-des')}
                    value={newMarker.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="p-2 w-full mb-2 border rounded text-black"
                  ></textarea>
                  <input
                    type="text"
                    placeholder={t('map-spot-tags')}
                    value={newMarker.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    className="p-2 w-full mb-2 border rounded text-black"
                  />
                  <select
                    title="choose-category"
                    value={newMarker.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="p-2 w-full mb-2 border rounded text-black">
                    <option value="">{t('map-spot-category')}</option>
                    {Object.entries(categoryMapping).map(([key, { text }]) => (
                      <option key={key} value={key}>
                        {/* {text} */}
                        {getCategoryText(key, i18n.language)}
                      </option>
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
                            className="object-cover" />
                          <button
                            className="absolute top-0 right-0 bg-red-500 text-white p-1"
                            onClick={() => handleRemoveImage(index, src)}>
                            {t('map-spot-delete')}
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
                          <i className="mr-1 fa-solid fa-arrow-up-right-from-square"></i><i className="fab fa-google mr-1"></i><i className="fa-solid fa-magnifying-glass mr-1.5"></i><span className="hidden lg:flex">
                            {t('map-spot-title')}
                          </span>
                        </button>
                      </Link>
                      <Link href={`https://www.google.com/maps/place/${decimalToDms(newMarker.coordinates.lat, newMarker.coordinates.lng)}`} target="_blank" passHref>
                        <button className="flex items-center bg-blue-100 mr-2 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                          <i className="mr-1fa-solid fa-arrow-up-right-from-square"></i><i className="fab fa-google mr-1"></i><i className="fa-solid fa-globe mr-1.5"></i><span className="hidden lg:flex">
                            {t('map-spot-coordinates')}</span>
                        </button>
                      </Link>
                      <button title="google places for new marker" className={`${RainbowButtonModule.rainbowButton} flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-black hover:text-red-500`}
                        onClick={handleGooglePlacesForNewMarker}
                      >
                        <button className="bg-white flex items-center px-3 py-1 rounded-md">
                          <i className="fab fa-google mr-1"></i>
                          <i className="fa-solid fa-directions mr-1.5"></i>
                          <span className="hidden lg:flex text-sm"> {t('map-spots-nearby')} </span>
                        </button>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="mb-3 mt-5 m-2 bg-green-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 
                        rounded-lg h-12 w-40 cursor-pointer hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {isEditing ? (
                      <span>
                        <i className="fas fa-check-circle"></i> {t('map-finish-edit')}
                      </span>
                    ) : (
                      <span>
                        <i className="fas fa-upload "></i> {t('map-spot-submit')}
                      </span>
                    )}
                  </button>
                  {isEditing && (
                    <button
                      onClick={handleCancelEdit}
                      className="mb-5 m-2 bg-red-100 flex-column justify-center items-center border-2 border-dashed border-gray-300 
                          rounded-lg h-12 w-40 cursor-pointer hover:border--500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span>
                        <i className="fas fa-times-circle"></i> {t("map-cancel-edit")}
                      </span>
                    </button>
                  )}
                </div>
              )}
              {googlePlacesSearch && (<div className="flex-col items-center justify-center">
                <button title="close-search"
                  className="w-full button px-4 py-3 bg-red-100 rounded-full mt-3 "
                  onClick={closeGooglePlacesSearch}>
                  {t('map-close-google-places')}
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
                  {t('map-close-google-places')}
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

        <div className="sticky bg-white bottom-0 left-0 w-[100%] shadow-inner z-10 flex justify-end items-center py-2 px-3 space-x-3">
          <button
            className="flex items-center justify-center
            cancel-publish-btn p-2 rounded-3xl flex-column 
                            border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-500 hover:bg-gray-200"
            onClick={handlePublishClick} aria-label="map post publish"
          >
            <i className={`fas fa-map px-2 py-2`}></i>
            <div className="hidden lg:flex text-sm font-medium"> {t('map-publish')} </div>
          </button>
        </div>

        <AlertModal
          isOpen={showImportConfirm}
          onClose={() => setShowImportConfirm(false)}
          onConfirm={confirmUpload}
          message={t('map-confirm-import')}
          showConfirmButton={true}
        />
        <AlertModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          message={t('map-confirm-delete')}
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