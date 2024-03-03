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
        let coordinatesStr = placemark.Point && placemark.Point[0].coordinates[0].trim();
        let coordinates = coordinatesStr ? coordinatesStr.split(',') : null;
        let warningTag = '';
        if (!coordinates || coordinates.length < 2) {
          coordinates = [121.56, 25.03]; 
          warningTag = 'Lack of coordinates';
        }
  
  
        return {
          name: placemark.name[0],
          description: placemark.description ? placemark.description[0] : 'NO descriptions',
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
      }).filter(p => p !== null); 
  
      allPlacemarks = [...allPlacemarks, ...extractedPlacemarks];
    });
  
    return allPlacemarks;
  };

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
        reject(new Error('Invalid JSON File'));
      }
    };
    reader.onerror = (err: Event) => reject(err);
    reader.readAsText(file);
  });
};

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
      warningTag = 'Lack of coordinates';
    }

    if (!coordinates || coordinates.length < 2 || (coordinates[0] === 0 && coordinates[1] === 0)) {
      return null;
    }

    return {
      name: properties.location?.name || 'Unnamed Place',
      description: properties.Comment || 'No description',
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
      throw new Error('The file type is not supported');
  }
};