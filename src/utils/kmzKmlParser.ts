// utils/kmzKmlParser.js
import JSZip from 'jszip';
import xml2js from 'xml2js';

export const parseKMZFile = async (file) => {
  const zip = new JSZip();
  const zipContents = await zip.loadAsync(file);
  const kmlFile = zipContents.file(/\.kml$/i)[0];
  if (kmlFile) {
    const kmlText = await kmlFile.async('text');
    return parseKml(kmlText);
  }
  return null;
};

export const parseKml = (kmlText) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(kmlText, (err, result) => {
      if (err) {
        reject(err);
      } else {
        const places = extractPlaces(result);
        resolve(places);
      }
    });
  });
};

const extractPlaces = (kmlData) => {
    const folders = kmlData?.kml?.Document[0]?.Folder || [];
    let allPlacemarks = [];
  
    folders.forEach(folder => {
      const placemarks = folder?.Placemark || [];
      const extractedPlacemarks = placemarks.map(placemark => {
        // 切割坐標字串
        let coordinatesStr = placemark.Point && placemark.Point[0].coordinates[0].trim();
        let coordinates = coordinatesStr ? coordinatesStr.split(',') : null;
        let warningTag = '';
  
        // 檢查並處理 [0, 0] 坐標
        if (!coordinates || coordinates.length < 2) {
          coordinates = [121.56, 25.03]; // 替換為預設值
          warningTag = '缺乏經緯度';
        }
  
  
        return {
          name: placemark.name[0],
          description: placemark.description ? placemark.description[0] : '無描述',
          tags:warningTag ? [warningTag] : [],
          category: 'others', 
          coordinates: {
            lat: parseFloat(coordinates[1]),
            lng: parseFloat(coordinates[0]) 
          },
          createdTime: new Date().toISOString(),
          images: [],
          updatedTime: '',
        };
      }).filter(p => p !== null); // 過濾掉無效的結果
  
      allPlacemarks = [...allPlacemarks, ...extractedPlacemarks];
    });
  
    return allPlacemarks;
  };

  // 解析 JSON 檔案
export const parseJSONFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const resultLast = e.target?.result;
      if (typeof resultLast === 'string') {
        try {
          const data = JSON.parse(resultLast);
          const places = extractPlacesFromJSON(data);
          resolve(places);
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error('無效的 JSON 檔案'));
      }
    };
    reader.onerror = (err: Event) => reject(err);
    reader.readAsText(file);
  });
};

// 從 GeoJSON 數據中提取地點
const extractPlacesFromJSON = (jsonData) => {
  const features = jsonData?.features || [];
  return features.map(feature => {
    const coordinates = feature.geometry.coordinates;
    const properties = feature.properties;
    if (!coordinates || coordinates.length < 2) {
      return null;
    }

    let warningTag = '';
    if (coordinates[0] === 0 && coordinates[1] === 0) {
      warningTag = '缺乏經緯度';
    }

    if (!coordinates || coordinates.length < 2 || (coordinates[0] === 0 && coordinates[1] === 0)) {
      return null;  // 當經緯度為 0,0 時不返回該項目
    }

    return {
      name: properties.location?.name || '未命名地點',
      description: properties.Comment || '無描述',
      tags: warningTag ? [warningTag] : [],
      category: 'others',
      coordinates: {
        lat: parseFloat(coordinates[1]),
        lng: parseFloat(coordinates[0])
      },
      createdTime: properties.date || new Date().toISOString(),
      googleMapsUrl: properties.google_maps_url,
      images: [],
      updatedTime: '',
    };
  }).filter(p => p !== null);
};

export const parseFile = async (file) => {
  const fileType = file.name.split('.').pop().toLowerCase();
  switch (fileType) {
    case 'kmz':
      return parseKMZFile(file);
    case 'json':
      return parseJSONFile(file);
    default:
      throw new Error('不支持的文件類型');
  }
};