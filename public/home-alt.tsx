import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

import { useMapNotification } from '../src/context/MapNotificationContext';
import { collectionGroup, query, onSnapshot, getDocs, orderBy } from "firebase/firestore";

import firebaseServices from '../src/utils/firebase';
const { db } = firebaseServices;

import { useAuth } from '../src/context/AuthContext';

import GlobeComponent from '../src/components/animation/GlobeComponent';
import AlertModal from '../src/components/AlertModal';
import MapCard from '../src/components/MapCard';
import RainbowButtonModule from '@/src/styles/rainbowButton.module.css'

// import { formatDate } from '../helpers/formDate';

const ITEMS_PER_PAGE = 8; 

export default function Home() {
    const router = useRouter();
    const routerMessage = router.query.message || '';

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
            const mapsQuery = query(collectionGroup(db, "maps")); //orderBy 只能排 timestamp
            unsubscribe = onSnapshot(mapsQuery, (querySnapshot) => {
                const maps = querySnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    userId: doc.ref.parent.parent.id // 獲取用戶 ID
                }));
                setMaps(maps);
                // console.log("latest maps");

                // 將 ISO 字串格式的 publishDate 轉換為 Date 物件，然後根據日期進行排序
                // @ts-ignore
                maps.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

                setMaps(maps);
                // console.log("latest maps");
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

        setUnsubscribeFunction(() => unsubscribe);
      
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
        setCurrentPage(1);
    }, [currentTab]);

    useEffect(() => {
        if(routerMessage !== '') {
            showAlert('請先登入');
            router.push('/home');
        }
    }, [alertMessage, isAlertOpen, routerMessage, router]);

    const [isVisible, setIsVisible] = useState(true);

    const handleClick = () => {
        isVisible ? setIsVisible(false) : setIsVisible(true);
    };

    // transition-container
    // ${!isVisible && 'h-0 opacity-0 transition-opacity duration-1000'}
    return (
        <div className={`bg-gradient-to-r from-sky-500 to-cyan-300`}>
            <div className={`custom-transition-container overflow-hidden relative mx-auto mb-0 flex justify-center items-center  
                ${!isVisible && 'custom-hidden '}  bg-night-image`}
                // style= {{ backgroundImage: 'url(/images/night.jpg)', backgroundSize: 'cover'}}
                >
                {/* <div className=" overflow-hidden "> */}
                <div className="hard-light globe-container max-w-lg max-h-lg overflow-hidden">
                    <GlobeComponent />
                </div>
                {/* Content Section */}
                <div className="content-section max-w-xl mx-auto items-center justify-center">
                    <div className="flex flex-col justify-center items-center bg-gray-300 rounded-full p-10 backdrop-blur-sm bg-opacity-30 hover:bg-opacity-60">
                        <LazyLoadImage effects="blur" src="/images/ballon.png" alt="Scene Image" width="200" height="200" 
                             className="object-cover mix-blend-color-burn" 
                        />
                        {/* <h1 className="text-4xl mb-4 text-gray-800">Hidden Gem Spots</h1> */}
                        <LazyLoadImage effects="blur" src="/images/hidden_gem.png" alt="logo Image" width="300" height="300" 
                            className="object-cover mix-blend-color-burn"
                            />
                        <p className="mt-5 px-10 py-3 rounded-3xl text-sm lg:text-lg mb-6 text-teal-300 bg-gray-600 opacity-90">定義你的私房景點<br></br>分享你的探險故事</p>
                        <Link href="/map">
                            <div className="cursor-pointer lg:text-lg text-xs px-8 py-2 bg-teal-100 hover:bg-rose-700 hover:text-white rounded-3xl shadow transition-btn text-blue-600 mb-4">
                                前往你的景點地圖
                            </div>
                        </Link>
                        <button className={`${RainbowButtonModule.rainbowButton} bg-red-500  text-white font-bold py-2 px-4 rounded hover:bg-blue-600 my-2`}
                                    style={{
                                        // @ts-ignore
                                        '--button-width': '200px',
                                        '--button-height': '50px',
                                        '--button-border-radius': '100px'
                                        }}> 
                            <Link href="/mintNFT"
                                className="bg-red-500 rounded-full text-white font-bold py-2 px-10 text-sm hover:bg-blue-600 my-2">
                                首發紀念 NFT
                            </Link>
                        </button>
                    </div>
                </div>
            </div>
            <div className="mr-5 ml-5 mt-10">
                <div className="flex justify-center items-center">
                    <div className="mb-5 cursor-pointer text-center border-dotted border border:black rounded-full p-4 pt-9 pb-9" 
                        onClick={handleClick}> {isVisible? '隱藏地球' : '顯示地球' } 
                    </div>
                        <div className="mb-10 flex justify-center ">
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
                        <MapCard key={map.id} map={map} userId={map.userId} />
                    ))}
                </div>
                )}
                {currentTab === "latest" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
                    {paginatedMaps.map(map => (
                        <MapCard key={map.id} map={map} userId={map.userId} />
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
            <div className='w-full text-center flex-1 md:w-1/2 mx-auto mt-16 bg-blue-500'>
                {/* <LazyLoadImage effect="blur" src="/images/future-02.png" alt="Scene Image" width="1000" height="1000" 
                                            className="object-cover"/>
                <LazyLoadImage effect="blur" src="/images/future-03.png" alt="Scene Image" width="1000" height="1000" 
                                            className="object-cover" />
                <LazyLoadImage effect="blur" src="/images/future-01.png" alt="Scene Image" width="1000" height="1000" 
                                            className="object-cover" /> */}
                <AlertModal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} message={alertMessage} />
            </div>
        </div>
    )
}