// SSR 
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import { collectionGroup, doc, getDoc, query, getDocs, orderBy, startAfter, limit, where } from "firebase/firestore";
import firebaseServices from '../utils/firebase';
const { db } = firebaseServices;

import GlobeComponent from '../components/animation/GlobeComponent';
// import { useGlobe } from '../context/GlobeContext';

import AlertModal from '../components/AlertModal';
import MapCard from '../components/MapCard';
import RainbowButtonModule from '@/src/styles/rainbowButton.module.css'

import { useAuth } from '@/src/context/AuthContext';

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

const ITEMS_PER_PAGE = 8;
const INITIAL_PAGES_TO_LOAD = 3; // Load 3 pages initially、

export async function getServerSideProps(context) {

    const { locale } = context;

    const db = firebaseServices.db;
    const tab = 'latest'; 
  
    let queryRef = query(collectionGroup(db, "maps"), orderBy("publishDate", "desc"), limit(INITIAL_PAGES_TO_LOAD * ITEMS_PER_PAGE));
  
    const querySnapshot = await getDocs(queryRef);
    const fetchedMaps = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
      const mapData = docSnapshot.data(); 
      const userRef = doc(db, "users", mapData.userId);
      const userSnapshot = await getDoc(userRef);
      const userData = userSnapshot.data();
      const userName = userSnapshot.exists() ? userData.name : "Unknown user 未知用戶";
  
      return {
        ...mapData,
        id: docSnapshot.id,
        authorName: userName
      };
    }));
  
    return {
      props: {
        initialMaps: fetchedMaps,
        ...(await serverSideTranslations(locale, ['common'])),
      },
    };
  }

export default function Home({ initialMaps = [] }) {
    const { t } = useTranslation('common');

    // const router = useRouter();
    const { user, showLoginAlert, setShowLoginAlert } = useAuth();
    const [maps, setMaps] = useState(initialMaps); //[]
 
    const [currentTab, setCurrentTab] = useState('latest'); 
    const [lastVisible, setLastVisible] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("error 錯誤");
    

    const handleClick = () => {
        isVisible ? setIsVisible(false) : setIsVisible(true);
    };

    useEffect(() => {
        if (showLoginAlert) {
            setIsAlertOpen(true);
            setAlertMessage(t('please-login'));
        }
    }, [showLoginAlert, t]);    

    const handleClose = () => {
        setIsAlertOpen(false);
        setAlertMessage('');
        setShowLoginAlert(false); 
        // router.replace('/home', undefined, { shallow: true });
    };

    const fetchMaps = async (tab: string, startAfterDoc?: any) => {
        let queryRef;
        if (tab === 'latest') {
            queryRef = query(collectionGroup(db, "maps"), orderBy("publishDate", "desc"), limit(INITIAL_PAGES_TO_LOAD * ITEMS_PER_PAGE));
        } else if (tab === 'popular') {
            queryRef = query(collectionGroup(db, "maps"), orderBy("popularity", "desc"), limit(INITIAL_PAGES_TO_LOAD * ITEMS_PER_PAGE));
        }

        if (startAfterDoc) {
            queryRef = query(queryRef, startAfter(startAfterDoc));
        }

        const querySnapshot = await getDocs(queryRef);


        const fetchedMaps = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
            const mapData = docSnapshot.data() as any; 
            const userRef = doc(db, "users", mapData.userId);
            const userSnapshot = await getDoc(userRef);
            const userData = userSnapshot.data() as any; 
            const userName = userSnapshot.exists() ? userData.name : t('unknown-user');
    
            return {
                ...mapData,
                id: docSnapshot.id,
                authorName: userName 
            };
        }));

        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        return fetchedMaps;
    };

    const updateData = useCallback(() => {
        fetchMaps(currentTab).then(fetchedMaps => {
          setMaps(fetchedMaps);
          setTotalPages(Math.ceil(fetchedMaps.length / ITEMS_PER_PAGE));
        });
      }, [currentTab]);

    useEffect(() => {
        // fetchMaps(currentTab).then(fetchedMaps => {
        //     setMaps(fetchedMaps);
        //     setTotalPages(Math.ceil(fetchedMaps.length / ITEMS_PER_PAGE));
        // });
        updateData();
    }, [updateData]);

    const loadMoreMaps = async () => {
        const newMaps = await fetchMaps(currentTab, lastVisible);
        setMaps(prevMaps => [...prevMaps, ...newMaps]);
        setCurrentPage(prevPage => prevPage + 1);
        setTotalPages(prevTotalPages => prevTotalPages + Math.ceil(newMaps.length / ITEMS_PER_PAGE));
    };

    const handleSearch = async () => {
        setIsSearching(true);
        const searchQueryRef = query(collectionGroup(db, "maps"), where("title", "==", searchTerm));
        const querySnapshot = await getDocs(searchQueryRef);

        const searchResults = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            userId: doc.ref.parent.parent.id
        }));

        setMaps(searchResults);
        setTotalPages(Math.ceil(searchResults.length / ITEMS_PER_PAGE));
        setCurrentPage(1);
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
        if (page > totalPages / INITIAL_PAGES_TO_LOAD) {
            loadMoreMaps();
        }
    };

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
    
 
    return (
        <div className={`bg-gradient-to-r from-sky-500 to-cyan-300`}>
            <div className={`custom-transition-container overflow-hidden relative mx-auto mb-0 flex justify-center items-center  
                ${!isVisible && 'custom-hidden '}  bg-night-image`}>
                <div className="hard-light globe-container max-w-lg max-h-lg overflow-hidden">
                    <GlobeComponent />
                </div>
                
                <div className="content-section max-w-xl mx-auto items-center justify-center">
                    <div className="flex flex-col justify-center items-center bg-gray-300 rounded-full p-10 backdrop-blur-sm bg-opacity-30 hover:bg-opacity-60">
                        <LazyLoadImage effects="blur" src="/images/ballon.png" alt="Scene Image" width="200" height="200" 
                             className="object-cover mix-blend-color-burn" />
                        <LazyLoadImage effects="blur" src="/images/hidden_gem.png" alt="logo Image" width="300" height="300" 
                            className="object-cover mix-blend-color-burn" />
                        {user ? (
                            <Link href="/map">
                            <div className="mt-5 text-teal-800 opacity-90 p-3 border-rose-600 border-2 rounded-3xl flex flex-col items-center justify-center">
                                <div className="bg-teal-100 bg-opacity-60 rounded-xl flex flex-col items-center justify-center px-10 py-3 text-sm lg:text-lg mb-6  ">
                                    <p>{t('home-slogan-former')}<br></br>
                                    {t('home-slogan-latter')} </p>
                                </div>
                                <div className="cursor-pointer lg:text-lg text-normal px-8 py-2 bg-rose-500 hover:bg-rose-700 hover:text-white rounded-3xl shadow transition-btn text-white mb-4">
                                {t('home-cta')}
                                </div>
                            </div>
                            </Link>
                        ) : (
                            <div className="mt-5 text-teal-800 opacity-90 p-3 border-rose-600 border-2 rounded-3xl flex flex-col items-center justify-center">
                                <div className="bg-teal-100 bg-opacity-60 rounded-xl flex flex-col items-center justify-center px-10 py-3 text-sm lg:text-lg mb-6  ">
                                     <p>{t('home-slogan-former')}<br></br>
                                    {t('home-slogan-latter')} </p>
                                </div>
                                <div className="cursor-pointer lg:text-lg text-normal px-8 py-2 bg-rose-500 hover:bg-rose-700 hover:text-white rounded-3xl shadow transition-btn text-white mb-4 pointer-events-none opacity-50">
                                    {t('home-login-alert')}
                                </div>
                            </div>
                        )}
                        <button title="memory-nft" className={`${RainbowButtonModule.rainbowButton} mt-6 bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 my-2`}
                                style={{ // @ts-ignore 
                                    '--button-width': '200px', '--button-height': '50px', '--button-border-radius': '100px' }}>
                            <Link href="/mintNFT">
                                <button className="bg-red-500 rounded-full text-white font-bold py-2 px-10 text-sm hover:bg-blue-600 my-2">
                                    {t('home-nft')}
                                </button>
                            </Link>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mr-5 ml-5 mt-10">
                <div className="flex justify-center items-center">
                    <div className="mb-5 cursor-pointer text-center border-dotted border border:black rounded-full p-4 pt-9 pb-9 hover:bg-gray-400 hover:text-white" 
                        onClick={handleClick}>
                        {isVisible ?  t('home-hideHeader') : t('home-showHeader')}
                    </div>
                </div>
                <div className="text-xl text-center md:text-left mb-5 cursor-pointer hover:text-white" onClick={updateData}> 
                    <i className="fas fa-sync-alt"></i> {t('home-update-mapData')}
                </div>
                <div className="flex mb-4">
                    <button onClick={() => setCurrentTab('latest')} 
                            className={`px-4 py-2 text-lg font-medium rounded-tl-lg rounded-tr-lg hover:bg-yellow-500 ${currentTab === 'latest' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {t('home-latest-map-sort')}
                    </button>
                    <button onClick={() => setCurrentTab('popular')} 
                            className={`ml-2 px-4 py-2 text-lg font-medium rounded-tl-lg rounded-tr-lg hover:bg-yellow-500 ${currentTab === 'popular' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {t('home-popular-map-sort')}
                    </button>
                </div>

                <div className="flex items-center justify-center">
                    <div className="flex items-center justify-center mt-4 mb-8 w-[500px] h-10 overflow-hidden">
                        <input 
                            type="text" 
                            placeholder={t('home-searchMaps')}
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                        <button 
                            title="search"
                            onClick={handleSearch} 
                            className="bg-blue-500 text-white px-6 py-2 rounded-r-lg hover:bg-blue-600 transition-colors duration-300">
                                <i className="fas fa-search"></i>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10  lg:mr-5 overflow-hidden">
                    {paginatedMaps.map(map => (
                        <MapCard key={map.id} map={map} userId={map.userId} />
                    ))}
                </div>

                <div className="flex justify-center items-center space-x-4 pb-10">
                    <button 
                    onClick={() => goToPreviousPage()} 
                    disabled={currentPage === 1} 
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-600 transition-colors duration-300">
                        {t('home-last-page')}
                    </button>
                    <span>{t('home-page-count-1')} {currentPage} {t('home-page-count-2')} {totalPages} {t('home-page-count-3')} </span>
                    <button 
                        onClick={() => goToNextPage()} 
                        disabled={currentPage === totalPages} 
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-600 transition-colors duration-300">
                        {t('home-next-page')}
                    </button>
                </div>
         
                <div className='w-full text-center flex-1 md:w-1/2 mx-auto mt-16 bg-blue-500'>
                    <AlertModal isOpen={isAlertOpen}  message={alertMessage} onClose ={handleClose}  />
                </div>
            </div>
        </div>
    );
}