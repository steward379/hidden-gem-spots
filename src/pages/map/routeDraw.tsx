import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
// import MapComponent from '../../components/MapComponent';

const MapComponentWithNoSSR = dynamic(
  () => import('../../components/MapComponent'),
  { ssr: false }
);

const MapDemoPage: React.FC = () => {
  const [markers, setMarkers] = useState([]);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(null);

  const [lines, setLines] = useState([]);
  const [overallDescription, setOverallDescription] = useState('');
  const [image, setImage] = useState(null);

  const handleMarkerPlaced = (latlng, newPolyline) => {

    if (markers.length >= 3) return;

    // const newMarker = { position: latlng, name: '', description: '' };
        // setMarkers([...markers, newMarker]);
    const newMarkers = [...markers, { latlng, name: '', description: '' }];
    setMarkers(newMarkers);
    // setSelectedMarkerIndex(markers.length); // 選擇新加的標記

    if (newMarkers.length > 1) {
      const lastLatLngs = newMarkers.map(m => m.latlng);
      newPolyline.setLatLngs(lastLatLngs);
      setLines([...lines, newPolyline]);
    }
  };

  const handleInfoChange = (index, field, value) => {
    const newMarkers = markers.map((marker, idx) => {
      if (idx === index) {
        return { ...marker, [field]: value };
      }
      return marker;
    });
    setMarkers(newMarkers);
  };

  const handleImageChange = (event) => {
    setImage(event.target.files[0]);
  };

  const confirmMarkerInfo = (index) => {
    // 這裡可以處理確認景點資訊後的邏輯，例如保存到狀態或發送到後端
    console.log('景點資訊已確認:', markers[index]);
  };

  const completeJourney = () => {
    console.log('完成旅程，資料:', { markers, overallDescription, image });
    // 清空所有狀態或導航到其他頁面
  };

  // const confirmMarkerInfo = (index) => {
  //   setSelectedMarkerIndex(null);
  // }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="md:w-2/3 flex justify-center items-center">
        <MapComponentWithNoSSR onMarkerPlaced={handleMarkerPlaced} />
      </div>
      <div className="md:w-1/3 flex flex-col p-4 space-y-4 overflow-auto">
        {markers.map((marker, index) => (
          <div key={index} className="p-4 text-black bg-white shadow-md rounded">
            <h3 className="text-lg font-semibold text-white">景點 {index + 1}</h3>
            <input
              type="text"
              placeholder="景點名稱"
              value={marker.name}
              onChange={(e) => handleInfoChange(index, 'name', e.target.value)}
              className="w-full p-2 mb-2 border rounded text-black"
            />
            <textarea
              placeholder="敘述"
              value={marker.description}
              onChange={(e) => handleInfoChange(index, 'description', e.target.value)}
              className="w-full p-2 mb-2 border rounded text-black"
            />
            {selectedMarkerIndex === index && (
              <button
                onClick={() => confirmMarkerInfo(index)}
                className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-700"
              >
                確定
              </button>
            )}
          </div>
        ))}
        {markers.length === 3 && (
          <div className="space-y-4">
            <input
              title="選擇圖片" 
              type="file" 
              onChange={handleImageChange} 
              className="w-full p-2 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
            <textarea
              placeholder="整體敘述"
              value={overallDescription}
              onChange={(e) => setOverallDescription(e.target.value)}
              className="w-full p-2 border rounded text-black"
            />
            <button 
              onClick={completeJourney} 
              className="w-full p-2 text-white bg-green-500 rounded hover:bg-green-700"
            >
              完成旅程
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapDemoPage;
