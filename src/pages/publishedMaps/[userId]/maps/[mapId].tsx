// pages/publishedMaps/[userId]/maps/[mapId].tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import GooglePlaces from "@/src/components/GooglePlaces";
import { doc, getDoc, getDocs,
    collection, arrayUnion,arrayRemove, runTransaction
} from "firebase/firestore";
import firebaseServices from "../../../../utils/firebase";
const { db } = firebaseServices;
import { useAuth } from "../../../../context/AuthContext";
import { decimalToDms } from "../../../../utils/decimalCoordinates";

import AlertModal from "../../../../components/AlertModal";
import LoadingIndicator from "@/src/components/LoadingIndicator";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../store/store";
import { setMapDataRedux } from "../../../../store/slices/mapSlice";

import RainbowButtonModule from "@/src/styles/rainbowButton.module.css";
import "react-quill/dist/quill.snow.css";
import { categoryMapping } from "@/src/constants";
import { categoryMappingEN } from '@/src/constants';
import { useTranslation } from 'next-i18next';

const MapComponentWithNoSSR = dynamic(
    () => import("../../../../components/MapComponent"),
    { ssr: false }
);
const ReactQuill = dynamic(() => import("react-quill"), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});
const PublishedMapDetail = () => {
    const { t, i18n } = useTranslation('common'); 

    function getCategoryText(categoryKey, language) {
        const categoryMappingNow = language === 'en-US' ? categoryMappingEN : categoryMapping;
        return categoryMappingNow[categoryKey]?.text || 'Unknown 不明';
    }
    
    const [showGooglePlaces, setShowGooglePlaces] = useState(false);
    const [googlePlacesCoords, setGooglePlacesCoords] = useState({ lat: 0, lng: 0 });

    const handleGooglePlacesToggle = (place) => {
        setShowGooglePlaces(!showGooglePlaces);
        setGooglePlacesCoords({ lat: place.coordinates.lat, lng: place.coordinates.lng });
    };
    
    const dispatch = useDispatch();
    const mapDataRedux = useSelector(
        (state: RootState) => state.map.mapDataRedux
    );

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const showAlert = (message) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
    };

    const router = useRouter();

    const { user } = useAuth();
    const { userId, mapId } = router.query;

    const [isRoutingMode, setIsRoutingMode] = useState(false);

    const quillModules = {
        toolbar: false,
    };

    const [showMapContent, setShowMapContent] = useState(true);

    const [mapData, setMapData] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);

    const [showPlacesList, setShowPlacesList] = useState(false);

    const [detailsExpanded, setDetailsExpanded] = useState(true);

    const toggleDetails = () => {
        setDetailsExpanded(!detailsExpanded);
    };

    const [likedPlaces, setLikedPlaces] = useState([]);
    const [showLikedPlacesList, setShowLikedPlacesList] = useState(false);
    // const [alreadyMapLiked, setAlreadyMapLiked] = useState(false);
    const [isMapLiked, setIsMapLiked] = useState(false);

    const [totalDuplicates, setTotalDuplicates] = useState(0);
    const [totalPlacesLikes, setTotalPlacesLikes] = useState(0);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [likedCurrentPage, setLikedCurrentPage] = useState(1);
    const itemsPerPage = 5; 
    const maxPageButtons = 5;
    const pagesPerGroup = 5;

    const filteredPlaces = mapData?.publishedPlaces.filter(
        (place) =>
            (place.name
                .toLowerCase()
                .includes(searchTerm.trim().toLowerCase()) ||
                place.tags.some((tag) =>
                    tag.toLowerCase().includes(searchTerm.toLowerCase())
                )) &&
            (place.category === selectedCategory || selectedCategory === "")
    );

    const filteredLikesPlaces = likedPlaces?.filter(
        (place) =>
            (place.name
                .toLowerCase()
                .includes(searchTerm.trim().toLowerCase()) ||
                place.tags.some((tag) =>
                    tag.toLowerCase().includes(searchTerm.toLowerCase())
                )) &&
            (place.category === selectedCategory || selectedCategory === "")
    );

    const totalPageCount = Math.ceil(filteredPlaces?.length / itemsPerPage);
    const totalLikedPageCount = Math.ceil(filteredLikesPlaces?.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPlaces = filteredPlaces?.slice(startIndex, endIndex);

    const likedStartIndex = (likedCurrentPage - 1) * itemsPerPage;
    const likedEndIndex = likedStartIndex + itemsPerPage;
    const currentLikedPlaces = filteredLikesPlaces?.slice(likedStartIndex, likedEndIndex);

    const renderPagination = (currentPage, setPage, totalCount, isLiked = false) => {
        const totalPages = Math.ceil(totalCount / itemsPerPage);
        // let startPage = Math.floor((currentPage - 1) / maxPageButtons) * maxPageButtons + 1;
        // const pageNumbers = Array.from({ length: Math.min(maxPageButtons, totalPages - startPage + 1) }, (_, i) => i + startPage);
        const totalGroups = Math.ceil(totalPages / pagesPerGroup);
        const currentGroupIndex = Math.floor((currentPage - 1) / pagesPerGroup);

        let startPage = currentGroupIndex * pagesPerGroup + 1;
        let endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);
        
        return (
            <div className="flex justify-center items-center gap-2 mt-4">
            {currentGroupIndex > 0 && (
                    <button onClick={() => setPage((currentGroupIndex - 1) * pagesPerGroup + 1)} className="pagination-prev mx-1 px-3 py-1 rounded-lg bg-sky-300 text-black">
                        {t('<-')}
                    </button>
                )}
                {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(pageIndex => (
                    <button key={pageIndex} onClick={() => setPage(pageIndex)} className={`mx-1 px-3 py-1 rounded-lg ${currentPage === pageIndex ? 'bg-sky-500 text-white' : 'bg-white text-black'}`}>
                        {pageIndex}
                    </button>
                ))}
                {currentGroupIndex < totalGroups - 1 && (
                    <button onClick={() => setPage((currentGroupIndex + 1) * pagesPerGroup + 1)} className="pagination-next mx-1 px-3 py-1 rounded-lg bg-sky-300 text-black">
                        {t('->')}
                    </button>
                )}
            </div>
        );
    };

    useEffect(() => {
        if (selectedPlace !== null) {
          setShowMapContent(false);
        }
      }, [selectedPlace]);

    useEffect(() => {
        if (mapData && user) {
            setIsMapLiked(mapData.likedBy.includes(user.uid));
        }
    }, [mapData, user]);

    useEffect(() => {
        const fetchMapData = async () => {
            if (typeof mapId === "string" && typeof userId === "string") {
                const mapRef = doc(db, `publishedMaps/${userId}/maps`, mapId);
                const docSnap = await getDoc(mapRef);

                if (docSnap.exists()) {
                    const mapDetails = docSnap.data();
                    const authorRef = doc(db, "users", userId);
                    const authorSnap = await getDoc(authorRef);

                    if (authorSnap.exists()) {
                        mapDetails.authorName = authorSnap.data().name;
                        mapDetails.authorAvatar = authorSnap.data().avatar;
                    }

                    const placesRef = collection(
                        db,
                        `publishedMaps/${userId}/maps/${mapId}/places`
                    );
                    const placesSnap = await getDocs(placesRef);
                    mapDetails.publishedPlaces = placesSnap.docs.map((doc) => ({
                        ...doc.data(),
                        id: doc.id, 
                    }));

                    mapDetails.publishedPlaces.forEach((place) => {
                        place.isLiked =
                            user && place.likedBy.includes(user.uid);
                    });

                    setMapData(mapDetails);

                    const totalDups = placesSnap.docs.reduce(
                        (sum, doc) => sum + (doc.data().duplicates || 0),
                        0
                    );
                    setTotalDuplicates(totalDups);

                    const totalPlacesLikes = placesSnap.docs.reduce(
                        (sum, doc) => sum + (doc.data().likes || 0),
                        0
                    );
                    setTotalPlacesLikes(totalPlacesLikes);

                    const transformedMapDetails = {
                        title: mapDetails.title,
                        content: mapDetails.content,
                        coverImage: mapDetails.coverImage,
                        authorName: authorSnap.data().name,
                        tags: mapDetails.tags || [], 
                        publishedPlaces: placesSnap.docs.map((doc) => {
                            const placeData = doc.data();
                            return {
                                id: doc.id,
                                name: placeData.name,
                                description: placeData.description,
                                tags: placeData.tags || [],
                                category: placeData.category,
                                coordinates: placeData.coordinates || {
                                    lat: 0,
                                    lng: 0,
                                },
                                images: placeData.images || [],
                                likes: placeData.likes || 0,
                                likedBy: placeData.likedBy || [],
                                duplicates: placeData.duplicates || 0,
                                duplicatedBy: placeData.duplicatedBy || [],
                            };
                        }),
                        publishDate: mapDetails.publishDate,
                        updatedDate: mapDetails.updatedDate || ''
                    };

                    dispatch(setMapDataRedux(transformedMapDetails));
                } else {
                    console.log("Map not found!");
                    showAlert(t('mapId-not-found'));
                    router.push(`/user-maps/${user.uid}`);
                }
            }
            // dispatch(setMapDataRedux(fetchedMapData));
        };

        fetchMapData();
    }, [mapId, userId, router, dispatch, user, user?.uid, t]);

    const handleMarkerClick = (place) => {
        setSelectedPlace(place);
    };
    const handleMarkerClose = () => {
        setSelectedPlace(null);
    };


    const handleLikeClick = async () => {
        if (!mapData || typeof mapId !== "string") return;

        if (user && typeof user.uid === "string") {
            const mapRef = doc(
                db, `publishedMaps/${mapData.userId}/maps`, mapId
            );
            const userLikedMapsRef = doc(
                db, `users/${user.uid}/likedMaps`, mapId
            );
            const alreadyLiked = mapData.likedBy.includes(user.uid);

            // if (user && mapData) {
            // const userLikedMapDoc = await getDoc(userLikedMapsRef);
            // const alreadyLiked = userLikedMapDoc.exists();

            await runTransaction(db, async (transaction) => {
                const mapDoc = await transaction.get(mapRef);
                if (!mapDoc.exists()) {
                    throw "Document does not exist!";
                }

                const newLikedBy = alreadyLiked
                    ? arrayRemove(user.uid)
                    : arrayUnion(user.uid);
                const newLikes = alreadyLiked
                    ? (mapDoc.data().likes || 0) - 1
                    : (mapDoc.data().likes || 0) + 1;

                transaction.update(mapRef, {
                    likedBy: newLikedBy,
                    likes: newLikes,
                });

                if (!alreadyLiked) {
                    transaction.set(userLikedMapsRef, {
                        mapId: mapId,
                        title: mapData.title,
                        authorId: mapData.userId,
                    });
                } else {
                    transaction.delete(userLikedMapsRef);
                }
            });

            setMapData((prevData) => ({
                ...prevData,
                likes: alreadyLiked ? prevData.likes - 1 : prevData.likes + 1,
                likedBy: alreadyLiked
                    ? prevData.likedBy.filter((uid) => uid !== user.uid)
                    : [...prevData.likedBy, user.uid],
            }));

            setIsMapLiked(!isMapLiked);
        } else {
            const likedMaps = JSON.parse(
                localStorage.getItem("likedMaps") || "[]"
            );
            const mapIndex = likedMaps.indexOf(mapId);
            if (mapIndex >= 0) {
                likedMaps.splice(mapIndex, 1);
                localStorage.setItem("likedMaps", JSON.stringify(likedMaps));
            } else {
                localStorage.setItem(
                    "likedMaps",
                    JSON.stringify([...likedMaps, mapId])
                );
            }
        }
    };

    const handlePlaceLikeClick = async (placeId) => {
        if (!user || typeof mapId !== "string") return;

        if (user && typeof user.uid === "string") {
            const mapRef = doc(
                db,
                `publishedMaps/${mapData.userId}/maps/${mapId}`
            );
            const placeRef = doc(
                db,
                `publishedMaps/${mapData.userId}/maps/${mapId}/places/${placeId}`
            );

            await runTransaction(db, async (transaction) => {
                const placeDoc = await transaction.get(placeRef);
                const mapDoc = await transaction.get(mapRef);

                if (!placeDoc.exists()) {
                    throw "Document does not exist!";
                }

                const placeData = placeDoc.data();
                const alreadyLiked = placeData.likedBy.includes(user.uid);

                const updatedLikes = alreadyLiked
                    ? (placeData.likes || 0) - 1
                    : (placeData.likes || 0) + 1;
                const updatedLikedBy = alreadyLiked
                    ? arrayRemove(user.uid)
                    : arrayUnion(user.uid);

                transaction.update(placeRef, {
                    likedBy: updatedLikedBy,
                    likes: updatedLikes,
                });

                if (!mapDoc.exists()) {
                    throw "Map Document does not exist!";
                }
                const mapData = mapDoc.data();

                const otherPlacesLiked = mapData.publishedPlaces?.some(
                    (place) =>
                        place.id !== placeId &&
                        (place.likedBy || []).includes(user.uid)
                );

                let newPlacesLikedBy;

                if (alreadyLiked && !otherPlacesLiked) {
                    newPlacesLikedBy = arrayRemove(user.uid);
                } else if (!alreadyLiked) {
                    newPlacesLikedBy = arrayUnion(user.uid);
                }

                const newPlacesLikes = alreadyLiked
                    ? (mapData.placesLikes || 0) - 1
                    : (mapData.placesLikes || 0) + 1;

                transaction.update(mapRef, {
                    placesLikes: newPlacesLikes,
                    placesLikedBy: newPlacesLikedBy,
                });

                setMapData((prevData) => {
                    const updatedPlaces = prevData.publishedPlaces.map(
                        (place) => {
                            if (place.id === placeId) {
                                const alreadyLiked =
                                    place.likedBy &&
                                    place.likedBy.includes(user.uid);
                                const updatedLikes = alreadyLiked
                                    ? place.likes - 1
                                    : place.likes + 1;
                                const updatedLikedBy = alreadyLiked
                                    ? place.likedBy.filter(
                                        (uid) => uid !== user.uid
                                    )
                                    : [...place.likedBy, user.uid];
                                return {
                                    ...place,
                                    likes: updatedLikes,
                                    likedBy: updatedLikedBy,
                                    isLiked: !alreadyLiked,
                                };
                            }
                            return place;
                        }
                    );

                    const newTotalPlacesLikes = updatedPlaces.reduce(
                        (sum, place) => sum + (place.likes || 0),
                        0
                    );
                    const newPlacesLikedBy = prevData.placesLikedBy.includes(
                        user.uid
                    )
                        ? prevData.placesLikedBy
                        : [...(prevData.placesLikedBy || []), user.uid];

                    setTotalPlacesLikes(newTotalPlacesLikes);

                    return {
                        ...prevData,
                        publishedPlaces: updatedPlaces,
                        placesLikes: newTotalPlacesLikes,
                        placesLikedBy: newPlacesLikedBy
                            ? newPlacesLikedBy
                            : prevData.placesLikedBy,
                    };
                });
            });
        } else {
            const likedPlaces = JSON.parse(
                localStorage.getItem("likedPlaces") || "[]"
            );
            const placeIndex = likedPlaces.indexOf(placeId);
            if (placeIndex >= 0) {
                likedPlaces.splice(placeIndex, 1);
                localStorage.setItem(
                    "likedPlaces",
                    JSON.stringify(likedPlaces)
                );
            } else {
                localStorage.setItem(
                    "likedPlaces",
                    JSON.stringify([...likedPlaces, placeId])
                );
            }
        }
    };

    const arraysEqual = (a, b) => {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    };

    const handlePlaceDuplicate = async (placeId) => {
        if (!user) {
            showAlert(t('mapId-login-copy-alert'))
            return;
        }

        if (!placeId || !mapData || typeof mapId !== "string") return;

        if (user && typeof user.uid === "string") {
            const mapRef = doc(
                db, `publishedMaps/${mapData.userId}/maps/${mapId}`
            );
            const placeRef = doc(
                db,`publishedMaps/${mapData.userId}/maps/${mapId}/places/${placeId}`
            );
            const userPlacesRef = collection(db, `users/${user.uid}/places`);

            await runTransaction(db, async (transaction) => {
                const placeDoc = await transaction.get(placeRef);
                const mapDoc = await transaction.get(mapRef);
                if (!placeDoc.exists()) {
                    throw "Place Document does not exist!";
                }

                const placeData = placeDoc.data();

                const userPlacesSnapshot = await getDocs(userPlacesRef);
                const existingPlace = userPlacesSnapshot.docs.find((doc) => {
                    const data = doc.data();
                    return (
                        data.name === placeData.name &&
                        data.description === placeData.description &&
                        data.coordinates.lat === placeData.coordinates.lat &&
                        data.coordinates.lng === placeData.coordinates.lng &&
                        arraysEqual(data.images, placeData.images)
                    );
                });
                if (existingPlace) {
                    showAlert(t('mapId-cant-duplicate-alert'));
                    return;
                }

                const updatedDuplicates = (placeData.duplicates || 0) + 1;
                const updatedDuplicatedBy = placeData.duplicatedBy.includes(
                    user.uid
                )
                    ? placeData.duplicatedBy
                    : arrayUnion(user.uid);

                transaction.update(placeRef, {
                    duplicatedBy: updatedDuplicatedBy,
                    duplicates: updatedDuplicates,
                });

                // const placeDataToDuplicate = { ...placeData, likes: 0, likedBy: [], duplicates: 0, duplicatedBy: [] };

                const placeDataForUserMap = {
                    name: placeData.name,
                    description: placeData.description,
                    tags: placeData.tags,
                    category: placeData.category,
                    coordinates: placeData.coordinates,
                    images: placeData.images,
                    createdTime: new Date().toISOString(),
                    updatedTime: "",
                };
                // delete placeDataToDuplicate.id; 
                await transaction.set(doc(userPlacesRef), placeDataForUserMap);

                if (!mapDoc.exists()) {
                    throw "Map Document does not exist!";
                }
                const mapData = mapDoc.data();

                const newMapDuplicates = (mapData.duplicates || 0) + 1;
                const newMapDuplicatedBy = mapData.duplicatedBy.includes(
                    user.uid
                )
                    ? mapData.duplicatedBy
                    : arrayUnion(user.uid);

                transaction.update(mapRef, {
                    duplicates: newMapDuplicates,
                    duplicatedBy: newMapDuplicatedBy,
                });

                setMapData((prevData) => {
                    const updatedPlaces = prevData.publishedPlaces.map(
                        (place) => {
                            if (place.id === placeId) {
                                const newDuplicatedBy =
                                    place.duplicatedBy.includes(user.uid)
                                        ? place.duplicatedBy
                                        : [
                                            ...(place.duplicatedBy || []),
                                            user.uid,
                                        ];
                                return {
                                    ...place,
                                    duplicates: updatedDuplicates,
                                    duplicatedBy: newDuplicatedBy,
                                };
                            }
                            return place;
                        }
                    );
                    const newMapDuplicatedBy = prevData.duplicatedBy.includes(
                        user.uid
                    )
                        ? prevData.duplicatedBy
                        : [...(prevData.duplicatedBy || []), user.uid];
                    return {
                        ...prevData,
                        publishedPlaces: updatedPlaces,
                        duplicates: prevData.duplicates + 1,
                        duplicatedBy: newMapDuplicatedBy,
                    };
                });
                setTotalDuplicates((prev) => prev + 1);
                showAlert(t('map-spot-duplicate-success'));
            });
        }
    };

    useEffect(() => {
        if (!user || !mapData) return;

        const likedPlacesArray = mapData.publishedPlaces.filter(
            (place) => place.likedBy && place.likedBy.includes(user.uid)
        );

        setLikedPlaces(likedPlacesArray);
    }, [mapData, user]);

    const isMapCreator = user && mapData && user.uid === mapData.userId;

    if (!mapData) {
        return <LoadingIndicator />;
    }

    return (
        <div className="flex flex-col h-screen-without-navbar md:flex-row text-black bg-gray-200">
            <div className="lg:w-2/3 md:w-1/2 w-full lg:m-10 md:m-5 m-0 border">
                <MapComponentWithNoSSR
                    places={mapData.publishedPlaces}
                    onMarkerClick={handleMarkerClick}
                    allowLikes={true}
                    allowDuplicate={true}
                    handlePlaceLikeClick={handlePlaceLikeClick}
                    handlePlaceDuplicate={handlePlaceDuplicate}
                    selectedPlace={selectedPlace}
                    isRoutingMode={isRoutingMode}
                    setIsRoutingMode={setIsRoutingMode}
                />
            </div>

            <div className="relative lg:overflow-auto md:overflow-auto lg:w-1/3 md:w-1/2 w-full lg:mb-10
                            lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5  bg-white shadow rounded">
                <div className="sticky top-0 bg-white shadow-lg z-10 flex items-center py-2 pl-3 space-x-3">
                    <div className="flex items-center justify-center space-x-3 py-2">
                        <button
                            className={`rounded-full  ${showMapContent ? 'bg-gray-200' : 'bg-red-100'} p-3 `}
                            onClick={() => {
                                setShowMapContent(!showMapContent);
                            }}
                        >
                            {showMapContent ? (
                                <>
                                    <div>
                                        <i className="fas fa-eye-slash"></i>
                                    </div>
                                    <div className="hidden lg:inline text-sm">
                                        {t('mapId-essay')}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <i className="fas fa-map-location"></i>
                                    </div>
                                    <div className="hidden lg:inline text-sm">
                                        {" "}
                                        {t('mapId-essay')}{" "}
                                    </div>
                                </>
                            )}
                        </button>

                        <div className="flex">
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
                                        {isRoutingMode ? t('map-route-stop') : t("map-route-machine")}
                                </div>
                            </button>
                        </div>
                        
                        <div className="place-list flex items-center justify-center mb-5 mt-5">
                            <label htmlFor="toggle-place" className="flex items-center cursor-pointer">
                            <div className="relative">
                                {/*  */}
                                <input type="checkbox" id="toggle-place" className="sr-only" onChange={() => {setShowPlacesList(!showPlacesList);setShowLikedPlacesList(false);}} checked={showPlacesList} />
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
                            
                        <div className="place-list flex items-center justify-center mb-5 mt-5">
                            <label htmlFor="toggle-like-place" className="flex items-center cursor-pointer">
                            <div className="relative">
                                {/*  */}
                                <input type="checkbox" id="toggle-like-place" className="sr-only" onChange={() => {setShowLikedPlacesList(!showLikedPlacesList);setShowPlacesList(false);}} checked={showPlacesList} />
                                <div className={`flex items-center w-16 h-9 rounded-full transition-colors ${showLikedPlacesList ? 'bg-green-500' : 'bg-gray-400'}`}>
                                <i className={`${showLikedPlacesList ? 'fa-regular fa-heart ml-2 text-gray-700' : 'fa-solid fa-heart ml-9 text-gray-900'} text-center`} ></i>
                                </div>
                                <div className={`dot absolute left-1 top-1 bg-white h-7 w-7 rounded-full transition transform ${showLikedPlacesList ? 'translate-x-full' : ''}`}>
                                </div>
                            </div>
                            <div className="ml-2 text-gray-700 font-medium text-sm hidden lg:flex">
                                <i className="fas fa-list-ul"></i>
                            </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="container lg:px-6 md:px-4 px-3 py-3">

                {(showPlacesList || showLikedPlacesList) && (
                        <div className="places-list mt-4">
                            <div className="search-and-filter mb-4">
                                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            placeholder={t('map-search-name-tag')}
                                            className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <select title="category-select"
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                                className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 
                                                        focus:border-blue-500">
                                            <option value="">{t('map-search-cat')}</option>
                                            {Object.entries(categoryMapping).map(
                                                ([key, { text }]) => (
                                                    <option key={key} value={key}>
                                                        {getCategoryText(key, i18n.language)}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                </div>
                                {searchTerm || selectedCategory ? (
                                    <>
                                        <h2 className="text-lg font-semibold mb-2">
                                            {showPlacesList
                                                ? t('map-search-list')
                                                : t('map-liked-search-list')}
                                        </h2>
                                        {(showPlacesList &&
                                            filteredPlaces.length === 0) ||
                                            (showLikedPlacesList &&
                                                filteredLikesPlaces.length === 0) ? (
                                            <p className="text-center">
                                                {t('map-search-not-found')}
                                            </p>
                                        ) : (
                                            <>
                                                {(showPlacesList
                                                    ? filteredPlaces
                                                    : filteredLikesPlaces
                                                ).map((place) => (
                                                    <div
                                                        key={place.id}
                                                        className="hover:bg-yellow-50 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer"
                                                        onClick={() =>
                                                            handleMarkerClick(place)
                                                        }
                                                    >
                                                        {place.name}
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {showPlacesList && (
                                            <>
                                                <h2 className="text-lg font-semibold mb-2">
                                                    {t('map-search-list')}
                                                </h2>

                                                {currentPlaces.length === 0 ? (
                                                    <p className="text-center">{t('map-search-not-found')}</p>
                                                ) : (
                                                    currentPlaces.map(
                                                    (place) => (
                                                        <div
                                                            key={place.id}
                                                            className="hover:bg-green-100 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer"
                                                            onClick={() =>
                                                                handleMarkerClick(
                                                                    place
                                                                )
                                                            }
                                                        >
                                                            {place.name}
                                                            <button
                                                                onClick={() =>
                                                                    handlePlaceLikeClick(
                                                                        place.id
                                                                    )
                                                                }
                                                            >
                                                                {place.isLiked ? (
                                                                    <i className="fa-solid fa-heart text-red-500"></i>
                                                                ) : (
                                                                    <i className="fa-regular fa-heart "></i>
                                                                )}
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                                {renderPagination(currentPage, setCurrentPage, filteredPlaces.length)}
                                            </>
                                        )}
                                        {showLikedPlacesList && (
                                            <div className="liked-places-list mt-4 mb-4">
                                                <h2 className="text-lg font-semibold mb-2">
                                                    {t('map-liked-search-list')}
                                                </h2>
                                                {currentLikedPlaces.length === 0 ? (
                                                    <p className="text-center">
                                                        {t('map-liked-no-spots')}
                                                    </p>
                                                ) : (
                                                    <>
                                                        {currentLikedPlaces.map(
                                                            (place) => (
                                                                <div
                                                                    key={place.id}
                                                                    className="hover:bg-yellow-50 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer"
                                                                    onClick={() =>
                                                                        handleMarkerClick(
                                                                            place
                                                                        )
                                                                    }
                                                                >
                                                                    {place.name}
                                                                </div>
                                                            )
                                                        )}
                                                        {renderPagination(likedCurrentPage, setLikedCurrentPage, filteredLikesPlaces.length, true)}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <h1 className="text-2xl font-bold  ">
                        <i className="fas fa-map-location-dot mr-2"></i>
                        {mapData.title}
                    </h1>

                    <div className="flex items-center mb-4">
                        <div className="flex items-center mr-2">
                            <button
                                title="favorite-button-map text-2xl"
                                className="m-2 mr-1.5"
                                onClick={handleLikeClick}
                            >
                                {isMapLiked ? (
                                    <i className="fas fa-heart text-red-500"></i>
                                ) : (
                                    <i className="far fa-heart"></i>
                                )}
                            </button>
                            <span className="">
                                {mapData.likes == 0 ? (
                                    <>
                                        <span className="hidden lg:flex text-sm">
                                            {" "}{t('mapId-no-likes')}{" "}
                                        </span>
                                        <span className="md:hidden lg:hidden flex">
                                            {" "}0{" "}
                                        </span>
                                    </>
                                ) : (
                                    <div>{mapData.likes}</div>
                                )}
                            </span>
                        </div>
                        
                        <div className="border-2 p-1 rounded-3xl">
                            <span className="text-sm ml-2"> {t('mapId-total')} </span>
                            <span className="ml-1 text-sm">
                                {totalDuplicates} {t('mapId-total-copy')}
                                <i className="fas fa-copy ml-1 mr-1 text-black"></i>
                            </span>
                            <span className="ml-1 text-sm">
                                {totalPlacesLikes} {t('mapId-total-likes')}
                                <i className="fas fa-heart ml-1 mr-1 text-black"></i>
                            </span>
                        </div>
                    </div>
                    
                    {showMapContent && (
                        <div className="relative border shadow p-3 rounded-3xl">
                            <div className="flex-column items-center mb-4">
                                <h1 className="text-2xl font-bold mb-3 mt-9">
                                    {mapData.title}
                                </h1>
                                <div className="mr-2 flex">
                                    {mapData.authorAvatar && (
                                        <Link href={`/member/${mapData.userId}/`}>
                                            <LazyLoadImage effect="blur"
                                                src={mapData.authorAvatar}
                                                alt="Author Avatar"
                                                className="rounded-full w-12 h-12 mr-3"
                                                width={50}
                                                height={50}
                                            />
                                        </Link>
                                    )}
                                    <p className="mt-3 text-lg font-semibold">
                                        {mapData.authorName}
                                    </p>
                                </div>
                            </div>
                            <p className="mb-4 text-sm">
                                {new Date(mapData.publishDate).toLocaleString(
                                    "zh-TW",
                                    { hour12: true }
                                )}
                            </p>
                            {mapData.coverImage && (
                                <div className="w-full relative h-[300px] overflow-hidden">
                                <LazyLoadImage effect="blur"
                                        src={mapData.coverImage}
                                        alt="Cover Image"
                                        width={400}
                                        height={250}
                                        className="object-cover"
                                        layout="responsive" 
                                    />
                                </div>
                            )}
                            <div className="bg-white text-black mt-4">
                                <ReactQuill
                                    value={mapData.content}
                                    readOnly={true}
                                    theme="snow"
                                    modules={quillModules}
                                />
                            </div>
                            {mapData.tags && mapData.tags.length > 0 && (
                                <div className="tags flex flex-wrap gap-2 mt-4">
                                    {mapData.tags.map((tag, index) => (
                                    <span key={index} className="text-xs bg-blue-200 px-2 py-1 rounded-full">
                                        {tag}
                                    </span>
                                    ))}
                                </div>
                            )}
                            {mapData.updatedDate && (
                                <p className="text-sm mb-4">
                                    {t('mapId-last-update-time')}{new Date(mapData.updatedDate).toLocaleString("zh-TW", { hour12: true })}
                                </p>
                            )}
                            {isMapCreator && (
                                <Link href={`/edit-map/${user.uid}/${mapId}`}>
                                    <button
                                        title="edit-map-content"
                                        className=" h-12 w-12 absolute bg-sky-100 right-0 top-0 rounded-full mb-5 mt-5 m-2 flex-column justify-center 
                                        items-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-500 hover:bg-green-300" >
                                        <i className="fa fa-edit"></i>
                                    </button>
                                </Link>
                            )}
                        </div>
                    )}
                    {selectedPlace && (
                        <div className={`relative selected-place-detail mt-4 border rounded-3xl shadow p-5 transition-all duration-300 
                                        ${detailsExpanded ? "max-h-full" : "max-h-20"}`} >
                            <p  className="absolute right-0 top-0 cursor-pointer p-5"
                                onClick={handleMarkerClose} >
                                <i className="fas fa-times"></i>
                            </p>
                            <button
                                title="toggle-details"
                                onClick={toggleDetails}
                                className="absolute right-10 top-0 p-5" >
                                <i className={`fas ${detailsExpanded ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                            </button>
                            <h3 className="text-xl font-bold ">
                                {selectedPlace.name}
                            </h3>
                            {detailsExpanded && (
                                <>
                                    <p className="text-gray-700 mt-2">
                                        {selectedPlace.description}
                                    </p>
                                    {/* <div className={`text-sm ${categoryMapping[selectedPlace.category]
                                            ?.color || "bg-gray-200" } p-1 rounded mt-2`} >
                                        {categoryMapping[selectedPlace.category]
                                            ?.text || t('unknown')}
                                    </div> */}

                                     <div className={`${categoryMapping[selectedPlace.category]?.color || 'bg-gray-200'} p-2 rounded mb-4 w-24`}>
                                        {/* {categoryMapping[selectedPlace.category]?.text || t('unknown')} */}
                                        {getCategoryText(selectedPlace.category, i18n.language) || t('unknown')}
                                    </div>
                                    {selectedPlace.tags &&
                                        selectedPlace.tags.filter(
                                            (tag) => tag.trim().length > 0
                                        ).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedPlace.tags.map((tag) => (
                                                    <span key={tag}
                                                        className="text-xs bg-blue-200 px-2 py-1 rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    <div className="mt-4">
                                        {selectedPlace.images.map((url, index) => (
                                            <div key={index}
                                                className="image-preview mb-2 relative w-[200px] h-[200px] overflow-hidden">
                                                <LazyLoadImage effect="blur"
                                                    src={url}
                                                    alt={`${selectedPlace.name} image ${index}`}
                                                    width={200}
                                                    height={200}
                                                    className="object-cover"
                                                    layout="responsive" />
                                            </div>
                                        ))}
                                    </div>
                                    {selectedPlace?.createdTime && (
                                        <p className="text-sm">
                                            {t('mapId-first-publish-time')}:{" "}
                                            {new Date(
                                                selectedPlace.createdTime
                                            ).toLocaleString("zh-TW", {
                                                hour12: true,
                                            })}
                                        </p>
                                    )}
                                    {selectedPlace?.updatedTime && (
                                        <p className="text-sm">
                                            {t('mapId-last-update-time')}{" "}
                                            {new Date(
                                                selectedPlace.updatedTime
                                            ).toLocaleString("zh-TW", {
                                                hour12: true,
                                            })}
                                        </p>
                                    )}
                                    <div className="flex">
                                        <Link href={`https://www.google.com/maps/place/?q=place_name:${selectedPlace.name}`}
                                            target="_blank"
                                            passHref >
                                            <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                                                <i className="fab fa-google mr-1"></i>
                                                <i className="fa-solid fa-magnifying-glass mr-1.5"></i>
                                                <span className="hidden lg:flex">
                                                    {" "}{t('map-spot-title')}
                                                </span>
                                            </button>
                                        </Link>
                                        <Link
                                            href={`https://www.google.com/maps/place/${decimalToDms(
                                                selectedPlace.coordinates.lat,
                                                selectedPlace.coordinates.lng
                                            )}`}
                                            target="_blank"
                                            passHref
                                        >
                                            <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                                                <i className="fab fa-google mr-1"></i>
                                                <i className="fa-solid fa-globe mr-1.5"></i>
                                                <span className="hidden lg:flex">
                                                    {" "}{t("map-spot-coordinates")}
                                                </span>
                                            </button>
                                        </Link>
                                        <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white
                                                            focus:outline-none focus:ring-2 focus:ring-blue-300" 
                                            onClick={() => handleGooglePlacesToggle(selectedPlace)} >
                                    <i className="fa-solid fa-directions mr-1.5"></i>                           
                                    {showGooglePlaces ?
                                        <span className="hidden lg:flex"> 
                                            {t('mapId-hide-spots')}
                                        </span> :
                                        <span className="hidden lg:flex"> 
                                            {t('mapId-show-spots')}
                                        </span> 
                                    }
                                    </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    {showGooglePlaces && (
                        <GooglePlaces
                            latitude={googlePlacesCoords.lat}
                            longitude={googlePlacesCoords.lng}
                            isFetchingAPI={showGooglePlaces}
                            onSelectPlace={()=>{}}
                            placeName={selectedPlace?.name}
                        />
                    )}
                </div>
            </div>
            <AlertModal
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                message={alertMessage}
            />
        </div>
    );
};

export default PublishedMapDetail;