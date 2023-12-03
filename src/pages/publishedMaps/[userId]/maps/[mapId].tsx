// pages/publishedMaps/[userId]/maps/[mapId].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
// firebase
import { doc, getDoc, updateDoc, setDoc, deleteDoc, arrayUnion, arrayRemove, runTransaction, collection, addDoc, getDocs } from 'firebase/firestore';
import firebaseServices from '../../../../utils/firebase';
const { db } = firebaseServices;
// context
import { useAuth } from '../../../../context/AuthContext';
// function
import { decimalToDms }  from '../../../../utils/decimalCoordinates';
// components
import AlertModal from '../../../../components/AlertModal';
import LoadingIndicator from '@/src/components/LoadingIndicator';
// Redux
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../store/store';
import { setMapDataRedux } from '../../../../store/slices/mapSlice';
// css&json
import 'react-quill/dist/quill.snow.css'; 
import { categoryMapping } from '@/src/constants';



const MapComponentWithNoSSR = dynamic(
    () => import('../../../../components/MapComponent'),
    { ssr: false }
);
const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});
const PublishedMapDetail = () => {
    // redux
    const dispatch = useDispatch();
    const mapDataRedux = useSelector(
        (state: RootState) => state.map.mapDataRedux
    );

    // alert&Confirm
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const showAlert = (message) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
    };

    const router = useRouter();
    // auth
    const { user } = useAuth();
    const { userId, mapId } = router.query;

    // routing mode
    const [isRoutingMode, setIsRoutingMode] = useState(false);

    const quillModules = {
        toolbar: false,
    };

    //show
    const [showMapContent, setShowMapContent] = useState(true);

    const [mapData, setMapData] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);

    const [showPlacesList, setShowPlacesList] = useState(false);
    // accordion
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    const toggleDetails = () => {
        setDetailsExpanded(!detailsExpanded);
    };

    // search and filter
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    // likes
    const [likedPlaces, setLikedPlaces] = useState([]);
    const [showLikedPlacesList, setShowLikedPlacesList] = useState(false);
    const [alreadyMapLiked, setAlreadyMapLiked] = useState(false);
    const [isMapLiked, setIsMapLiked] = useState(false);

    // total
    const [totalDuplicates, setTotalDuplicates] = useState(0);
    const [totalPlacesLikes, setTotalPlacesLikes] = useState(0);

    // like heart changed
    useEffect(() => {
        if (mapData && user) {
            setIsMapLiked(mapData.likedBy.includes(user.uid));
        }
    }, [mapData, user]);

    // get Map
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

                    // 取得地圖中的景點
                    const placesRef = collection(
                        db,
                        `publishedMaps/${userId}/maps/${mapId}/places`
                    );
                    const placesSnap = await getDocs(placesRef);
                    mapDetails.publishedPlaces = placesSnap.docs.map((doc) => ({
                        ...doc.data(),
                        id: doc.id, // 添加新的 placeId
                    }));

                    mapDetails.publishedPlaces.forEach((place) => {
                        place.isLiked =
                            user && place.likedBy.includes(user.uid);
                    });

                    // 使用包含作者名字的數據
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

                    // redux
                    const transformedMapDetails = {
                        title: mapDetails.title || "", // 這裡提供默認值以防數據缺失
                        content: mapDetails.content || "",
                        coverImage: mapDetails.coverImage || "",
                        authorName: authorSnap.data().name || "",
                        publishedPlaces: placesSnap.docs.map((doc) => {
                            const placeData = doc.data();
                            return {
                                id: doc.id,
                                // 確保包括 Place 類型所需的所有屬性
                                name: placeData.name || "",
                                description: placeData.description || "",
                                tags: placeData.tags || [],
                                category: placeData.category || "",
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
                    };

                    dispatch(setMapDataRedux(transformedMapDetails));
                } else {
                    console.log("找不到地圖資料");
                    showAlert("找不到地圖資料");
                    router.push(`/user-maps/${user.uid}`);
                }
            }
            // dispatch(setMapDataRedux(fetchedMapData));
        };

        fetchMapData();
    }, [mapId, userId, router, dispatch, user, user?.uid]);

    const handleLikeClick = async () => {
        if (!mapData || typeof mapId !== "string") return;

        if (user && typeof user.uid === "string") {
            const mapRef = doc(
                db,
                `publishedMaps/${mapData.userId}/maps`,
                mapId
            );
            const userLikedMapsRef = doc(
                db,
                `users/${user.uid}/likedMaps`,
                mapId
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
                    // 增加喜愛次數
                    transaction.set(userLikedMapsRef, {
                        mapId: mapId,
                        title: mapData.title,
                        authorId: mapData.userId,
                    });
                } else {
                    // 減少喜愛次數
                    transaction.delete(userLikedMapsRef);
                }
            });

            // 更新本地狀態
            setMapData((prevData) => ({
                ...prevData,
                likes: alreadyLiked ? prevData.likes - 1 : prevData.likes + 1,
                likedBy: alreadyLiked
                    ? prevData.likedBy.filter((uid) => uid !== user.uid)
                    : [...prevData.likedBy, user.uid],
            }));

            setIsMapLiked(!isMapLiked);
        } else {
            // 未登入用戶的處理
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
            // 未登入用戶的處理
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

    const handlePlaceDuplicate = async (placeId) => {
        if (!user) {
            // 如果使用者未登入，無法使用複製功能
            showAlert("請先登入才能複製景點");
            return;
        }

        if (!placeId || !mapData || typeof mapId !== "string") return;

        if (user && typeof user.uid === "string") {
            const mapRef = doc(
                db,
                `publishedMaps/${mapData.userId}/maps/${mapId}`
            );
            const placeRef = doc(
                db,
                `publishedMaps/${mapData.userId}/maps/${mapId}/places/${placeId}`
            );
            const userPlacesRef = collection(db, `users/${user.uid}/places`);

            await runTransaction(db, async (transaction) => {
                const placeDoc = await transaction.get(placeRef);
                const mapDoc = await transaction.get(mapRef);
                if (!placeDoc.exists()) {
                    throw "Place Document does not exist!";
                }

                const placeData = placeDoc.data();

                // 檢查用戶的私人地圖中是否已經有相同的景點
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

                // 如果找到相同的景點，阻止複製並給出提示
                if (existingPlace) {
                    showAlert("此景點已存在於您的地圖中，無法重複複製");
                    return;
                }

                const updatedDuplicates = (placeData.duplicates || 0) + 1;
                const updatedDuplicatedBy = placeData.duplicatedBy.includes(
                    user.uid
                )
                    ? placeData.duplicatedBy
                    : arrayUnion(user.uid);
                // arrayUnion(user.uid) 會將 user.uid 加入到陣列中，但如果 user.uid 已經存在於陣列中，則不會有任何變化

                transaction.update(placeRef, {
                    duplicatedBy: updatedDuplicatedBy,
                    duplicates: updatedDuplicates,
                });

                // 複製景點到使用者的地圖中
                // const placeDataToDuplicate = { ...placeData, likes: 0, likedBy: [], duplicates: 0, duplicatedBy: [] };

                const placeDataForUserMap = {
                    name: placeData.name,
                    description: placeData.description,
                    tags: placeData.tags,
                    category: placeData.category,
                    coordinates: placeData.coordinates,
                    images: placeData.images,
                };
                // delete placeDataToDuplicate.id; // 移除原有的 id
                await transaction.set(doc(userPlacesRef), placeDataForUserMap);

                // 更新地圖的 duplicates 和 duplicatedBy
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
                // 更新本地狀態
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

                showAlert("景點已複製到您的地圖");
            });
        }
    };

    // 比較兩個陣列是否相同
    const arraysEqual = (a, b) => {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    };

    const handleMarkerClick = (place) => {
        setSelectedPlace(place);
    };
    const handleMarkerClose = () => {
        setSelectedPlace(null);
    };

    // 篩選喜愛的景點
    useEffect(() => {
        if (!user || !mapData) return;

        // 假設每個景點都有likedBy陣列，包含喜愛該景點的用戶ID
        const likedPlacesArray = mapData.publishedPlaces.filter(
            (place) => place.likedBy && place.likedBy.includes(user.uid)
        );

        setLikedPlaces(likedPlacesArray);
    }, [mapData, user]);

    // 根據搜尋關鍵詞和類別篩選景點
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

    // 根據喜愛搜尋關鍵詞和類別篩選景點
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

    if (!mapData) {
        return <LoadingIndicator />;
    }

    // 登入者是否為地圖作者
    const isMapCreator = user && mapData && user.uid === mapData.userId;

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

            <div
                className="relative lg:overflow-auto md:overflow-auto lg:w-1/3 md:w-1/2 w-full lg:mb-10
      lg:mt-10 md:mt-5 mt-7 lg:mr-10 md:mr-5 lg:p-8 md:p-4 p-10 bg-white shadow rounded"
            >
                <div className="">
                    <div className="absolute top-0 right-5 flex items-center justify-center mb-5 mt-5">
                        <label htmlFor="toggle-like"  className="flex items-center cursor-pointer">
                            <div className="relative">  
                                <input
                                    title="all"
                                    type="checkbox"
                                    id="toggle-like"
                                    className="sr-only"
                                    onChange={() => {
                                        setShowPlacesList(!showPlacesList);
                                        setShowLikedPlacesList(false);
                                    }}
                                    checked={showPlacesList}
                                />
                                <div className={`flex items-center w-16 h-9 rounded-full transition-colors ${
                                    showPlacesList
                                        ? "bg-sky-500"
                                        : "bg-gray-400"
                                }`}
                            >
                                <i
                                    className={`fas ${
                                        showPlacesList
                                            ? "fa-eye-slash ml-2 text-white "
                                            : "fa-eye ml-9 text-gray-900"
                                    } text-center`}
                                ></i>
                            </div>
                            <div
                                className={`dot absolute left-1 top-1 bg-white h-7 w-7 rounded-full transition transform ${
                                    showPlacesList ? "translate-x-full" : ""
                                }`}
                            ></div>
                        </div>
                        <div className="ml-1.5 text-gray-700 font-medium  hidden lg:inline">
                            <i className="fas fa-list ml-1 mr-1"></i>
                            {showPlacesList ? "" : ""}
                        </div>
                        </label>
                    </div>
                    <div className="absolute top-0 right-30 flex items-center justify-center mb-5 mt-5">
                      <label htmlFor="toggle" className="flex items-center cursor-pointer">
                            <div className="relative">
                                  <input title="show-like" type="checkbox" 
                                        id="toggle" 
                                        className="sr-only"
                                        onChange={() => {
                                              setShowLikedPlacesList(
                                                  !showLikedPlacesList
                                              );
                                              setShowPlacesList(false);
                                          }}
                                          checked={showLikedPlacesList}
                                  />
                                  <div className={`flex items-center w-16 h-9 rounded-full transition-colors 
                                              ${showLikedPlacesList ? "bg-red-400" : "bg-gray-400"}`}>
                                      <i className={`fas ${showLikedPlacesList
                                                  ? "fa-heart-broken ml-2.5 text-white "
                                                  : "fa-heart ml-9 text-white"} 
                                                  text-center`}
                                      ></i>
                                  </div>
                                  <div className={`dot absolute left-1 top-1 bg-white h-7 w-7 rounded-full transition transform
                                      ${showLikedPlacesList ? "translate-x-full" : ""}`}
                                  ></div>
                                </div>
                                <div className="ml-1.5 text-gray-700 font-medium hidden lg:inline">
                                    <i className="fas fa-list ml-1 mr-1"></i>
                                    {showLikedPlacesList ? "" : ""}
                                </div>
                          </label>
                    </div>
                </div>

                <div className="flex items-center justify-center mb-2 mt-6 md:mt-12">
                    <h1 className="text-2xl font-bold  ">
                        <i className="fas fa-map-location-dot mr-2 mt-5"></i>
                        {mapData.title}
                    </h1>
                    <button
                        className="rounded-2xl bg-sky-100 p-3 ml-3 lg:h-20"
                        onClick={() => {
                            setShowMapContent(!showMapContent);
                        }}
                    >
                        {showMapContent ? (
                            <>
                                <div>
                                    <i className="fas fa-eye-slash mr-2"></i>
                                </div>
                                <div className="hidden lg:inline text-sm">
                                    {" "}
                                    隱藏文章{" "}
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <i className="fas fa-map-location mr-2"></i>
                                </div>
                                <div className="hidden lg:inline text-sm">
                                    {" "}
                                    地圖文章{" "}
                                </div>
                            </>
                        )}
                    </button>
                    <button
                        className="flex-column rounded-2xl bg-green-200 p-3 lg:h-20 ml-3 text-sm
                             font-medium hover:bg-green-500 hover:text-white "
                        onClick={() => setIsRoutingMode(!isRoutingMode)}
                    >
                        <div>
                            <i className="fas fa-route"></i>
                        </div>
                        <div className="hidden lg:inline">
                            {isRoutingMode ? "離開路徑模式" : "規劃路徑"}
                        </div>
                    </button>
                </div>

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
                                        {" "}
                                        還沒人喜歡，當第一個吧！{" "}
                                    </span>
                                    <span className="md:hidden lg:hidden flex">
                                        {" "}
                                        0{" "}
                                    </span>
                                </>
                            ) : (
                                <div>{mapData.likes}</div>
                            )}
                        </span>
                    </div>

                    <div className="border-2 p-1 rounded-3xl">
                        <span className="text-sm ml-2"> 景點共 </span>
                        <span className="ml-1 text-sm">
                            {totalDuplicates} 次
                            <i className="fas fa-copy ml-1 mr-1 text-black"></i>
                        </span>
                        <span className="ml-1 text-sm">
                            {totalPlacesLikes} 次
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
                                        <Image
                                            src={mapData.authorAvatar}
                                            alt="Author Avatar"
                                            className="rounded-full w-12 h-12 mr-3"
                                            width="50"
                                            height="50"
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
                            <div className="w-full h-60 relative">
                                <Image
                                    src={mapData.coverImage}
                                    alt="Cover Image"
                                    fill
                                    className="object-cover"
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
                        {isMapCreator && (
                            <Link href={`/edit-map/${user.uid}/${mapId}`}>
                                <button
                                    title="edit-map-content"
                                    className=" h-12 w-12 absolute bg-sky-100 right-0 top-0 rounded-full mb-5 mt-5 m-2 flex-column justify-center items-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-500 hover:bg-green-300"
                                >
                                    <i className="fa fa-edit"></i>
                                </button>
                            </Link>
                        )}
                    </div>
                )}
                {selectedPlace && (
                    <div
                        className={`relative selected-place-detail mt-4 border rounded-3xl shadow p-5
                          transition-all duration-300 
                          ${detailsExpanded ? "max-h-full" : "max-h-12"}`}
                    >
                        <p
                            className="absolute right-0 top-0 cursor-pointer p-5"
                            onClick={handleMarkerClose}
                        >
                            <i className="fas fa-times"></i>
                        </p>
                        <button
                            title="toggle-details"
                            onClick={toggleDetails}
                            className="absolute right-1/2 top-0 p-5"
                        >
                            <i
                                className={`fas ${
                                    detailsExpanded
                                        ? "fa-chevron-up"
                                        : "fa-chevron-down"
                                }`}
                            ></i>
                        </button>
                        <h3 className="text-xl font-bold ">
                            {selectedPlace.name}
                        </h3>
                        {detailsExpanded && (
                        <>
                        <p className="text-gray-700 mt-2">
                            {selectedPlace.description}
                        </p>
                        <div
                            className={`text-sm ${
                                categoryMapping[selectedPlace.category]
                                    ?.color || "bg-gray-200"
                            } p-1 rounded mt-2`}
                        >
                            {categoryMapping[selectedPlace.category]?.text ||
                                "不明"}
                        </div>
                        {selectedPlace.tags &&
                            selectedPlace.tags.filter(
                                (tag) => tag.trim().length > 0
                            ).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedPlace.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs bg-blue-200 px-2 py-1 rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        <div className="mt-4">
                            {selectedPlace.images.map((url, index) => (
                                <div
                                    key={index}
                                    className="image-preview mb-2 relative"
                                    style={{ width: 300, height: 300 }}
                                >
                                    <Image
                                        src={url}
                                        alt={`${selectedPlace.name} image ${index}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex">
                            <Link
                                href={`https://www.google.com/maps/place/?q=place_name:${selectedPlace.name}`}
                                target="_blank"
                                passHref
                            >
                                <button className="flex items-center mr-3 bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                                    <i className="fab fa-google mr-1"></i>
                                    <i className="fa-solid fa-magnifying-glass mr-1.5"></i>
                                    <span className="hidden lg:flex">
                                        {" "}
                                        名稱
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
                                        {" "}
                                        經緯
                                    </span>
                                </button>
                            </Link>
                        </div>
                    </>
                        )}
                    </div>
                )}
                {(showPlacesList || showLikedPlacesList) && (
                    <div className="places-list mt-4">
                        <div className="search-and-filter">
                            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        placeholder="搜尋景點名稱或標籤"
                                        className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <select
                                        title="category-select"
                                        value={selectedCategory}
                                        onChange={(e) =>
                                            setSelectedCategory(e.target.value)
                                        }
                                        className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">搜尋類別</option>
                                        {Object.entries(categoryMapping).map(
                                            ([key, { text }]) => (
                                                <option key={key} value={key}>
                                                    {text}
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
                                            ? "搜尋後景點列表"
                                            : "搜尋後喜愛景點列表"}
                                    </h2>
                                    {(showPlacesList &&
                                        filteredPlaces.length === 0) ||
                                    (showLikedPlacesList &&
                                        filteredLikesPlaces.length === 0) ? (
                                        <p className="text-center">
                                            找不到符合條件的景點
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
                                                景點列表
                                            </h2>
                                            {mapData.publishedPlaces.map(
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
                                                                <i className="fas fa-heart text-red-500"></i>
                                                            ) : (
                                                                <i className="far fa-heart"></i>
                                                            )}
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </>
                                    )}
                                    {showLikedPlacesList && (
                                        <div className="liked-places-list mt-4">
                                            <h2 className="text-lg font-semibold mb-2">
                                                喜愛景點列表
                                            </h2>
                                            {likedPlaces.length === 0 ? (
                                                <p className="text-center">
                                                    您還沒有喜愛任何景點
                                                </p>
                                            ) : (
                                                <>
                                                    {likedPlaces.map(
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
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
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