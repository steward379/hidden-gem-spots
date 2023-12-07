// pages/uploadKMZ.js
import React, { useState } from 'react';
import JSZip from 'jszip';
import xml2js, { parseString } from 'xml2js';

const UploadKMZ = () => {
  const [file, setFile] = useState(null);
  const [kmlData, setKmlData] = useState(null);
  const [places, setPlaces] = useState([]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (file) {
      // 檢查檔案是否為 KMZ 格式
      if (file.name.endsWith('.kmz')) {
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(file); // 讀取 KMZ 
        const kmlFile = zipContents.file(/\.kml$/i)[0]; // 尋找 KML 

        if (kmlFile) {
          const kmlText = await kmlFile.async('text');
          parseKml(kmlText);
        }
      } else if (file.name.endsWith('.kml')) {
        // 直接讀取 KML 檔案
        const reader = new FileReader();
        reader.onload = (event) => {
          parseKml(event.target.result);
        };
        reader.readAsText(file);
      }
    }
  };

  const parseKml = (kmlText) => {
    xml2js.parseString(kmlText, (err, result) => {
      if (err) {
        console.error('解析 KML/KMZ 檔案錯誤:', err);
        return;
      }

      setKmlData(result);

      const extractedPlaces = extractPlaces(result);
      setPlaces(extractedPlaces);
    });
  };

  // const extractPlaces = (kmlData) => {
  //   const placemarks = kmlData?.kml?.Document[0]?.Folder[0]?.Placemark || [];
  //   return placemarks.map(placemark => ({
  //     name: placemark.name[0],
  //     description: placemark.description[0],
  //     coordinates: placemark.Point[0].coordinates[0].trim()
  //   }));
  // };
  const extractPlaces = (kmlData) => {
    const folders = kmlData?.kml?.Document[0]?.Folder || [];
    let allPlacemarks = [];
  
    folders.forEach(folder => {
      const placemarks = folder?.Placemark || [];
      const extractedPlacemarks = placemarks.map(placemark => {
        // 切割坐標字串
        const coordinatesStr = placemark.Point && placemark.Point[0].coordinates[0].trim();
        console.log('coordinatesStr', coordinatesStr);
        const coordinates = coordinatesStr ? coordinatesStr.split(',') : [25.03, 121.56];
        if (coordinates.length < 2) {
          return null; // 或者設置一個預設值
        }

        let warningTag ='';
        if (coordinates[0] === 25.03 && coordinates[1] === 121.56) {
          warningTag = '缺乏經緯度';
        }

        if (coordinates.length < 2) {
          return null; // 或者設置一個預設值
        }
  
        return {
          name: placemark.name[0],
          description: placemark.description ? placemark.description[0] : '無描述',
          tags: warningTag || [], 
          category: 'others', 
          coordinates: {
            lat: parseFloat(coordinates[1]),
            lng: parseFloat(coordinates[0]) 
          }
        };
      }).filter(p => p !== null); // 過濾掉無效的結果
  
      allPlacemarks = [...allPlacemarks, ...extractedPlacemarks];
    });
  
    return allPlacemarks;
  };
  

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="p-6 bg-white shadow-md rounded-md">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">上傳 KMZ/KML 檔案</h2>
        <input 
          title="kmz-upload"
          type="file"
          id="kmz-upload"
          accept=".kmz,.kml"
          onChange={handleFileChange}
          
          className="mb-3 block w-full text-sm text-gray-600 
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
        />
        <button 
          onClick={handleFileUpload}
          disabled={!file} // 如果沒有選擇檔案，則按鈕不可用
          className={`px-4 py-2 rounded text-white font-bold mt-2 
                      ${file ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}`} // 根據檔案是否選擇改變樣式
        >
          上傳
        </button>
        <ul className="mt-4">
          {places.map((place, index) => (
            <li key={index} className="mt-2 border-b border-gray-200 pb-2">
              <h3 className="font-semibold text-gray-800">{place.name}</h3>
              <p className="text-gray-600">{place.description}</p>
                <p className="text-sm text-gray-500">標籤：{place?.tags}</p>
              <p className="text-sm text-gray-500">坐標：{place.coordinates.lat}, {place.coordinates.lng}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UploadKMZ;