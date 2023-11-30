import Link from 'next/link';
import LoginComponent from '../components/EmailLogComponent';
import GoogleLogComponent from '../components/GoogleLogComponent';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
// import { useLocation } from 'react-router-dom'; //Router Context but don't use it in Next.js
import { useRouter } from 'next/router';
import { useMapNotification } from '../context/MapNotificationContext';
import { collection, collectionGroup, query, onSnapshot, getDocs } from "firebase/firestore";
import firebaseServices from '../utils/firebase';
const { db } = firebaseServices;
import { useAuth } from '../context/AuthContext';
import GlobeComponent from '../components/animation/GlobeComponent';

const ITEMS_PER_PAGE = 4; 

export default function Home() {
    const router = useRouter();
    const message = router.query.message || '';

    const { user } = useAuth();

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('錯誤');
    const showAlert = (message) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
      };
  
    const { notifications } = useMapNotification();
  
    const [maps, setMaps] = useState([]);
    // switch option
    const [currentTab, setCurrentTab] = useState('latest'); 
    
    // switch map data
    const [unsubscribeFunction, setUnsubscribeFunction] = useState(null);
    useEffect(() => {
        let unsubscribe;

        if (currentTab === 'latest') {
            const mapsQuery = query(collectionGroup(db, "maps"));
            unsubscribe = onSnapshot(mapsQuery, (querySnapshot) => {
                const maps = querySnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    userId: doc.ref.parent.parent.id // 獲取用戶 ID
                }));
                setMaps(maps);
                console.log("lastest maps");
            });
        } else if (currentTab === 'popular') {
            const fetchMaps = async () => {
                const mapsQuery = query(collectionGroup(db, "maps"));
                const querySnapshot = await getDocs(mapsQuery);
                const fetchedMaps = querySnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    userId: doc.ref.parent.parent.id, // 獲取用戶 ID
                    // 計算熱門度
                    popularity: doc.data().likes + doc.data().placesLikes + doc.data().duplicates
                }));
        
                // 按熱門度排序，取前100個
                const sortedMaps = fetchedMaps.sort((a, b) => b.popularity - a.popularity).slice(0, 100);
                setMaps(sortedMaps);
            };
            fetchMaps();
        }

        // 保存取消訂閱函數
        setUnsubscribeFunction(() => unsubscribe);
      
        // 清理函數
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
    }, [currentTab]);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        setTotalPages(Math.ceil(maps.length / ITEMS_PER_PAGE));
    }, [maps]);
    
    const paginatedMaps = maps.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const goToNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const goToPreviousPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    useEffect(() => {
        if(router.query.message) {
            showAlert('請填寫標題');
        }
    }, [message, alertMessage, isAlertOpen, router.query.message]);

    const [isVisible, setIsVisible] = useState(true);

    const handleClick = () => {
        isVisible ? setIsVisible(false) : setIsVisible(true);
    };
  
    return (
        <div className={`bg-gradient-to-r from-sky-500 to-cyan-300`}>
            <div className={`  overflow-hidden relative mx-auto mb-0 flex justify-center items-center  
                ${!isVisible && 'h-10 opacity-0 transition-opacity duration-1000'}`}
                style= {{ backgroundImage: 'url(/images/night.jpg)', backgroundSize: 'cover'}}
                >
                {/* <div className=" overflow-hidden "> */}
                <div className="hard-light scale-2-hard-light globe-container max-w-lg max-h-lg overflow-hidden">
                    <GlobeComponent size={1500} />
                </div>
                {/* Content Section */}
                <div className="content-section max-w-xl mx-auto items-center justify-center">
                    <div className="flex flex-col items-center bg-gray-300 rounded-full p-10 backdrop-blur-sm bg-opacity-30 hover:bg-opacity-60">
                        <Image src="/images/ballon.png" alt="Scene Image" width="300" height="300" style={{ objectFit: 'cover', mixBlendMode: 'color-burn' }} />
                        <h1 className="text-4xl mb-4 text-gray-800">Hidden Gem Spots</h1>
                        <p className="text-xl mb-6 text-gray-500">找尋你的秘密景點</p>
                                {message && <p className="text-red-500 p-2">{message}</p>}
                        <Link href="/map">
                            <div className="cursor-pointer text-lg  px-8 py-2 hover:bg-sky-700 rounded-3xl shadow transition-btn text-white">
                                前往你的景點地圖
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="mr-5 ml-5">
                <div className="flex justify-center items-center">
                    <div className="mb-5 cursor-pointer text-center border-dotted border border:black rounded-full p-4 pt-9 pb-9" 
                        onClick={()=>handleClick()}> {isVisible? '隱藏地球' : '顯示地球' } 
                    </div>
                </div>
                <div className="flex mb-4">
                    <button 
                        onClick={() => setCurrentTab('latest')} 
                        className={`px-4 py-2 text-lg font-medium rounded-tl-lg rounded-tr-lg ${currentTab === 'latest' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        最新地圖
                    </button>
                    <button 
                        onClick={() => setCurrentTab('popular')} 
                        className={`ml-2 px-4 py-2 text-lg font-medium rounded-tl-lg rounded-tr-lg ${currentTab === 'popular' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        熱門地圖
                    </button>
                </div>
                {currentTab === "popular" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
                    {paginatedMaps.map(map => (
                        <MapCard key={map.id} map={map} userId={user?.uid} />
                    ))}
                </div>
                )}
                {currentTab === "latest" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
                    {paginatedMaps.map(map => (
                        <MapCard key={map.id} map={map} userId={user?.uid} />
                    ))}
                </div>
                )}
                <div className="pagination flex justify-center items-center mt-4">
                    <button 
                        onClick={goToPreviousPage} 
                        disabled={currentPage === 1} 
                        className="px-4 py-2 mr-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300">
                        上一頁
                    </button>
                    <span>第 {currentPage} 頁，共 {totalPages} 頁</span>
                    <button 
                        onClick={goToNextPage} 
                        disabled={currentPage === totalPages} 
                        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300">
                        下一頁
                    </button>
                </div>
            </div>
            <div className='w-full text-center flex-1 md:w-1/2 mx-auto mt-16'>
                <Image src="/images/future-02.png" alt="Scene Image" width="1000" height="1000" 
                    style={{ objectFit: 'cover' }} />
                <Image src="/images/future-03.png" alt="Scene Image" width="1000" height="1000" 
                    style={{ objectFit: 'cover' }} />
                <Image src="/images/future-01.png" alt="Scene Image" width="1000" height="1000" 
                    style={{ objectFit: 'cover' }} />
                <AlertModal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} message={alertMessage} />
            </div>
        </div>
    )
}


const AlertModal = ({ isOpen, onClose, message }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center" >
        <div className="bg-white p-6 rounded-lg shadow-xl z-10">
          <p className="text-black">{message}</p>
          <button onClick={onClose} className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
            確定
          </button>
        </div>
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  const MapCard = ({ map, userId }) => {
    return (
      <div className="border bg-cover bg-center hover:bg-yellow-500 transition-btn rounded-3xl bg-purple-400" 
           style={{ backgroundImage: `url('${map.coverImage}')`, height: '300px', backgroundSize: 'cover', backgroundPosition: 'center' }} >
  
          <div className="relative p-4 w-full h-full bg-gradient-to-t from-transparent to-blue-600 opacity-100 rounded-3xl 
                        hover:bg-yellow-400 hover:bg-opacity-50">
            <Link href={`/publishedMaps/${userId}/maps/${map.id}`}>
              <h2 className="text-2xl font-semibold text-amber-400">{map.title}</h2>
              <p className=" text-amber-200 font-bold">{formatDate(map.publishDate)}</p>
              <div className="h-full w-full"></div>
            </Link>
          </div>
      </div>
    );
  };
  
