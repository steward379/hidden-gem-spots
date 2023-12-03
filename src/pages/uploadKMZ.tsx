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
        return {
          name: placemark.name[0],
          description: placemark.description ? placemark.description[0] : '無描述',
          coordinates: placemark.Point && placemark.Point[0].coordinates[0].trim()
        };
      });
      allPlacemarks = [...allPlacemarks, ...extractedPlacemarks];
    });
  
    return allPlacemarks;
  };
  

  return (
    <div>
      <input title="kmz-upload" type="file" id="kmz-upload" accept=".kmz" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>上傳 KMZ 檔案</button>
      {/* <pre>{JSON.stringify(kmlData, null, 2)}</pre> */}
      <ul>
        {places.map((place, index) => (
          <li key={index}>
            <h3>{place.name}</h3>
            <p>{place.description}</p>
            <p>坐標：{place.coordinates}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UploadKMZ;
