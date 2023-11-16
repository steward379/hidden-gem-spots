// pages/published-maps/[mapId].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import firebaseServices from '../../utils/firebase';
const { db, auth, storage } = firebaseServices;
import { useAuth } from '../../context/authContext';

const MapComponentWithNoSSR = dynamic(
    () => import('../../components/MapComponent'),
    { ssr: false }
);

const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});

const PublishedMapDetail = () => {
  const router = useRouter();
  const { mapId } = router.query;
  const [mapData, setMapData] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    const fetchMapData = async () => {
      if (mapId && typeof mapId === 'string') {
        const mapRef = doc(db, `publishedMaps/${user.uid}/maps`, mapId);
        const docSnap = await getDoc(mapRef);
        if (docSnap.exists()) {
          setMapData(docSnap.data());
        } else {
          console.log('找不到地圖資料');
        }
      }
    };

    fetchMapData();
  }, [mapId, user.uid]);

  if (!mapData) return <div>載入中...</div>;

  return (
    <div className="flex flex-col md:flex-row h-screen">
        <div className="md:w-2/3 w-full">
            <MapComponentWithNoSSR 
                places={mapData.publishedPlaces}
             />
        </div>
        <div className="md:w-1/3 w-full p-4 overflow-auto">
            <h1 className="text-xl font-bold">{mapData.title}</h1>
            <p className="mb-4">
                <strong>作者：</strong>{user.name}<br/>
                <strong>發佈時間：</strong>{new Date(mapData.publishDate).toLocaleDateString()}
            </p>
            {mapData.coverImage && (
                <Image src={mapData.coverImage} alt="Cover Image" width="300" height="300" />
            )}
            <div className="bg-white text-black">
                {/* ReactQuill component used to render markdown content */}
                <ReactQuill value={mapData.content} readOnly={true} theme="bubble" />
            </div>
        </div>
    </div>
  );
};

export default PublishedMapDetail;