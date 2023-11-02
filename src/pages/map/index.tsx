import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { onAuthStateChanged } from "firebase/auth";
import firebaseServices from '../../utils/firebase'; 
import { collection, query, onSnapshot, getDocs, addDoc, where } from 'firebase/firestore';
const { db, auth } = firebaseServices; 

// import L from 'leaflet';
// import MapComponent from '../../components/MapComponent';

const MapComponentWithNoSSR = dynamic(
  () => import('../../components/MapComponent'),
  { ssr: false }
);

const MapDemoPage: React.FC = () => {
  const [places, setPlaces] = useState([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setUserId(user.uid); // 如果用戶已登入，保存用戶 ID
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'your_collection'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const places = [];
      querySnapshot.forEach((doc) => {
        places.push(doc.data());
      });
      setPlaces(places); // 假設您有一個 setPlaces 函數來更新狀態
    });  

    return () => unsubscribe();
  }, []);

  const [isAddingMarker, setIsAddingMarker] = useState(false); 
  const [newMarker, setNewMarker] = useState(null); 

  const [markers, setMarkers] = useState([]);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(null);

  // const [lines, setLines] = useState([]);
  // const [overallDescription, setOverallDescription] = useState('');
  const [image, setImage] = useState(null);

  const handleMarkerPlaced = (latlng, newPolyline) => {
    setNewMarker({ latlng, name: '', description: '', tags: '', category: '', images: [] });
  };

  const handleInputChange = (field, value) => {
    setNewMarker(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event) => {
    const files = event.target.files;
    setNewMarker(prev => ({ ...prev, images: files }));
  };

  const handleSubmit = () => {
    console.log('提交景點信息：', newMarker);
    setMarkers(prev => [...prev, newMarker]);
    setNewMarker(null);
    setIsAddingMarker(false);
  };

  // cancel adding sites
  const handleCancel = () => {
    setIsAddingMarker(false);
    setNewMarker(null);
  };

  const savePlace = async () => {
    try {
      const placesCol = collection(db, 'places'); 
  
      await addDoc(placesCol, {
        userId, 
        name: newMarker.name,
        description: newMarker.description,
        tags: newMarker.tags.split(','), 
        category: newMarker.category,
        coordinates: newMarker.latlng,
        // images: newMarker.images, // 上傳問題
      });
  
      setNewMarker(null);
      setIsAddingMarker(false);
    } catch (e) {
      console.error("Error adding document: ", e);
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

  const cancelAdding = () => {
    if (newMarker) {
      newMarker.remove(); 
      setNewMarker(null); 
    }
    setIsAddingMarker(false);
    // 如果您在 MapComponent 中保存了 marker 的狀態，您也應該在這裡重置它
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="md:w-2/3 flex justify-center items-center">
        <MapComponentWithNoSSR 
          onMarkerPlaced={handleMarkerPlaced}
          isAddingMarker={isAddingMarker} 
          places={places} 
          onCancel={handleCancel}
        />
      </div>
      <div className="md:w-1/3 flex flex-col p-4 space-y-4 overflow-auto">
        <button 
          onClick={() => setIsAddingMarker(!isAddingMarker)} // 切換 isAddingMarker 的值
          className="p-2 bg-blue-500 text-white rounded"
        >
          {isAddingMarker ? '取消新增景點' : '新增景點'}
        </button>
        {newMarker && (
          <div className="p-4 bg-white rounded shadow-md">
            <h3 className="text-lg font-semibold mb-2">新增景點</h3>
            <input 
              type="text" 
              placeholder="名稱" 
              value={newMarker.name} 
              onChange={(e) => handleInputChange('name', e.target.value)} 
              className="p-2 w-full mb-2 border rounded"
            />
            <textarea 
              placeholder="描述" 
              value={newMarker.description} 
              onChange={(e) => handleInputChange('description', e.target.value)} 
              className="p-2 w-full mb-2 border rounded"
            ></textarea>
            <input 
              type="text" 
              placeholder="標籤 (用逗號分隔)" 
              value={newMarker.tags} 
              onChange={(e) => handleInputChange('tags', e.target.value)} 
              className="p-2 w-full mb-2 border rounded"
            />
            <select 
              value={newMarker.category} 
              onChange={(e) => handleInputChange('category', e.target.value)} 
              className="p-2 w-full mb-2 border rounded text-black"
            >
              <option value="">選擇類別</option>
              <option value="eat">吃的</option>
              <option value="play">玩的</option>
            </select>
            <input 
              type="file" 
              multiple 
              onChange={handleImageChange} 
              className="p-2 w-full mb-2 border rounded"
            />
            <button 
              onClick={handleSubmit} 
              className="p-2 w-full text-white bg-green-500 rounded hover:bg-green-600"
            >
              提交
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapDemoPage;
