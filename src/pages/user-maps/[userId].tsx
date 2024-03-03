import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, query, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import firebaseServices from '../../utils/firebase';
const { db } = firebaseServices;
import { useAuth } from '../../context/AuthContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Link from 'next/link';
import AlertModal from '@/src/components/AlertModal';
import { useTranslation } from 'next-i18next';

const UserMapsPage = () => {
  const { t } = useTranslation('common'); 

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState(null);

  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  }

  const [maps, setMaps] = useState([]);
  const [likedMaps, setLikedMaps] = useState([]); 
  const [mapMaker, setMapMaker] = useState(null);

  const [totalLikes, setTotalLikes] = useState(0);
  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [totalPlaceLikes, setTotalPlaceLikes] = useState(0);

  const router = useRouter();

  const { user } = useAuth();

  const { userId } = router.query;

  const fetchLikedMapsDetails = async (likedMapsIds) => {
    const mapDetailsPromises = likedMapsIds.map(mapId => 
      Promise.all([
        getDoc(doc(db, `publishedMaps/${mapId.authorId}/maps`, mapId.id)),
        getDoc(doc(db, `users/${mapId.authorId}`))
      ])
    );
  
    const results = await Promise.all(mapDetailsPromises);
  
    const likedMapsDetails = results.map(([mapSnap, authorSnap], index) => {
      if (mapSnap.exists() && authorSnap.exists()) {
        return { 
          id: likedMapsIds[index].id, 
          ...mapSnap.data(), 
          authorId: likedMapsIds[index].authorId, 
          authorName: authorSnap.data().name
        };
      }
      return null;
    }).filter(map => map !== null);
  
    setLikedMaps(likedMapsDetails);
  };

  useEffect(() => {
    const fetchMaps = async () => {
      if (userId ) {
        const q = query(collection(db, `publishedMaps/${userId}/maps`));
        const querySnapshot = await getDocs(q);
        const mapsData = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setMaps(mapsData);

        const likesCount = mapsData.reduce((sum, map: any) => {
          return sum + (map.likes ? map.likes : 0);
        }, 0);

        const duplicatesCount = mapsData.reduce((sum, map: any) => {
          return sum + (map.duplicates ? map.duplicates : 0);
        }, 0);

        const placesLikesCount = mapsData.reduce((sum, map: any) => {
          return sum + (map.placesLikes ? map.placesLikes : 0);
        }, 0);

        setTotalLikes(likesCount); 
        setTotalDuplicates(duplicatesCount);
        setTotalPlaceLikes(placesLikesCount);

        const mapHost = doc(db, `users/${userId}`);
        const mapHostSnapshot = await getDoc(mapHost);
        if (mapHostSnapshot.exists()) {
          setMapMaker(mapHostSnapshot.data());
        }
  
        const likedMapsQuery = query(collection(db, `users/${userId}/likedMaps`));
        const likedMapsSnapshot = await getDocs(likedMapsQuery);
        // setLikedMaps(likedMapsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const likedMapsIds = likedMapsSnapshot.docs.map(doc => ({ id: doc.id, authorId: doc.data().authorId }));
        fetchLikedMapsDetails(likedMapsIds);
      }
    };
    
    fetchMaps();

  }, [userId, user?.uid]);

  const deleteMapAndPlaces = async (mapId) => {

    const placesRef = collection(db, `publishedMaps/${userId}/maps/${mapId}/places`);
    const placesSnapshot = await getDocs(placesRef);
  
    const deletePlacesPromises = placesSnapshot.docs.map((doc) => {
      return deleteDoc(doc.ref);
    });
  
    await Promise.all(deletePlacesPromises);
    await deleteDoc(doc(db, `publishedMaps/${userId}/maps`, mapId));
  };

  const handleDeleteMap = async (event, mapId) => {
    event.stopPropagation(); 
    setSelectedMapId(mapId); 
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedMapId) { 
      event.stopPropagation(); 

      try {
        await deleteMapAndPlaces(selectedMapId);
        showAlert(t('userId-delete-map-success'));
        
        const updatedMaps = maps.filter(map => map.id !== selectedMapId);
        setMaps(updatedMaps);
        const updatedLikedMaps = likedMaps.filter(map => map.id !== selectedMapId);
        setLikedMaps(updatedLikedMaps);

        const likesCount = updatedMaps.reduce((sum, map) => sum + (map.likes || 0), 0);
        const duplicatesCount = updatedMaps.reduce((sum, map) => sum + (map.duplicates || 0), 0);
        const placesLikesCount = updatedMaps.reduce((sum, map) => sum + (map.placesLikes || 0), 0);
  
        setTotalLikes(likesCount); 
        setTotalDuplicates(duplicatesCount);
        setTotalPlaceLikes(placesLikesCount);

        setShowDeleteConfirm(false); 
        setSelectedMapId(null); 

      } catch (error) {
        console.error("Delete failed: ", error);
        showAlert(t('userId-mapId-delete-failed-alert'));
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };
  // users now
  const isCurrentUser = user && user.uid === userId; 

  const renderUserInfo = () => {
    return (
      <div className="user-info mb-5 lg:flex flex-column w-full">
        <div className="w-full lg:flex flex-column  hover:bg-rose-600 bg-blue-600 rounded-3xl mb-7 lg:mb-0 lg:rounded-full cursor-pointer transition-btn mr-5 p-10 lg:p-0">
          <div className=" flex p-0 w-30 hover:bg-amber-500 bg-red-400 rounded-full cursor-pointer transition-btn mr-3 mb-7 lg:mb-0" >
            <Link href={`/member/${userId}`} className="flex items-center m-2">
                <div className="p-4 ml-4">
                  <h2 className="text-2xl font-normal lg:mb-0 text-stone-200 pt-3">
                    {isCurrentUser ? t('userId-title-owner') : `${mapMaker?.name} ${t('userId-title-others')} `}</h2>
                </div>
            { mapMaker?.avatar &&
              <LazyLoadImage effect="blur"
                src={mapMaker?.avatar} 
                alt={mapMaker?.name} 
                className="w-24 h-24 rounded-full cursor-pointer image-hover-effect" 
                width="1000" 
                height="1000" 
              />
            }
            </Link>
          </div>
          <div className="p-4 ml-4 ">
            <h3 className="text-lg font-semibold text-rose-100">{t('userId-map-total-likes')}</h3>
            <p className="text-3xl font-bold text-rose-100">{totalLikes}</p> 
          </div>
          <div className="p-4 ml-4">
            <h3 className="text-lg font-semibold text-rose-100">{t('userId-spots-total-likes')}</h3>
            <p className="text-3xl font-bold text-rose-100">{totalPlaceLikes}</p> 
          </div>
          <div className="p-4 ml-4">
            <h3 className="text-lg font-semibold text-green-100">{t('userId-spots-total-duplicates')}</h3>
            <p className="text-3xl font-bold text-green-100">{totalDuplicates}</p> 
          </div>
          
        </div>
        <div className="bg-blue-500 text-white py-2 px-4 mb-5 lg:mb-0 rounded-full flex justify-center items-center">
          <Link href={`/map`}>
            <button  className="text-center lg:w-20 w-full text-xl rounded-full hover:bg-sky-500 mb-2 lg:mb-0">
              {t('userId-manage-maps')}
            </button>
          </Link>
        </div>
      </div>
    );
  };  

  return (
    <div className=" container mx-auto rounded-3xl p-5 lg:p-20">
       {renderUserInfo()}
       <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-4 mt-14 ">
        {maps.map(map => (
          <div 
              key={map.id} 
              className="skew-card border bg-cover bg-center hover:bg-yellow-500 transition duration-300 ease-in-out rounded-3xl bg-purple-400 h-72" 
              style={{ backgroundImage: `url('${map.coverImage}')` }} 
          >

            <div className="relative p-4 w-full h-full bg-gradient-to-t from-transparent to-blue-600 opacity-100 rounded-3xl  hover:bg-yellow-400 hover:bg-opacity-50">
              {isCurrentUser && (
              <button title="delete-map" className="absolute right-0 top-0 delete-button w-20 h-20 rounded-full backdrop-blur-sm" 
                      onClick={(e) => handleDeleteMap(e, map.id)}>
                <i className="scale-2 fas fa-times text-xl text-white"></i> 
              </button>
              )}
              <Link href={`/publishedMaps/${userId}/maps/${map.id}`}>
                <h2 className="text-2xl font-semibold text-amber-400">{map.title}</h2>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                        {(map.tags || []).map((tag, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                                {tag}
                            </span>
                        ))}
                </div>
                <p className=" text-amber-200 font-bold">{formatDate(map.publishDate)}</p>
                <div className="h-full w-full"></div>
              </Link>
            </div>

        </div>
        ))}
      </div>
      
      {/* {isCurrentUser && (  */}
      <div className="mt-6">
        <div className="mt-6">
          <h3 className="text-2xl font-bold mb-5 text-rose-500"> {t('userId-likes-maps')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 ">
            {likedMaps.map(map => (
              <div key={map.id}
                  className="skew-card border bg-cover bg-center hover:bg-red-400 transition-btn rounded-3xl bg-orange-800 h-72" 
                  style={{ backgroundImage: `url('${map.coverImage}')` }}
              >
                <Link href={`/publishedMaps/${map.authorId}/maps/${map.id}`}>
                  <div className="p-4 w-full h-full bg-gradient-to-t from-transparent to-red-500 opacity-100 rounded-3xl  hover:bg-yellow-300 hover:bg-opacity-50">
                    <h2 className="text-2xl font-semibold text-sky-100">{`${map.title}`}</h2>
                    <h4 className="text-lg text-sky-100">{`${map.authorName}`}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {(map.tags || []).map((tag, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <p className="text-sky-200 font-bold">{formatDate(map.publishDate)}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <AlertModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        message={t('userId-delete-map-confirm')}
        showConfirmButton={true}
      />
      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        message={alertMessage}
      />
  </div>
  );
};

export default UserMapsPage;