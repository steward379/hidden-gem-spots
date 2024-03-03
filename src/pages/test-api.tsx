import React, { useState } from 'react';
import LazyLoadImage from 'react-lazy-load-image-component';
import { useTranslation } from 'next-i18next';

const TestAPI = () => {
  const { t } = useTranslation('common');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

//   const calculateDistance = (lat1, lon1, lat2, lon2) => {
//     const R = 6371e3; 
//     const rad = Math.PI / 180;
//     const dLat = (lat2 - lat1) * rad;
//     const dLon = (lon2 - lon1) * rad;

//     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//               Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
//               Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c; 
//   };

  const fetchPlaces = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Invalid latitude or longitude values');
      return;
    }

    try {
      const response = await fetch(`/api/googlePlaces?latitude=${lat}&longitude=${lng}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'An error occurred while fetching the data.');
      }
      setData(data);
    //   const resultsWithDistance = data.results.map(place => ({
    //     ...place,
    //     distance: calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
    //   }));

    //   resultsWithDistance.sort((a, b) => a.distance - b.distance);

    //   setData({ ...data, results: resultsWithDistance });
      setError('');
    } catch (error) {
      setError('Fetching Error: ' + error.message);
    }
  }

  return (

    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4"> {t('test-api-title')}</h1>
      <div className="flex space-x-2 mb-4">
        <input
          className="p-2 border border-gray-300 rounded"
          type="text"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="Latitude"
        />
        <input
          className="p-2 border border-gray-300 rounded"
          type="text"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="Longitude"
        />
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => fetchPlaces()}>
          {t('fetch-places')}
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>} 

      <div className="space-y-4">
        {data && data.status === 'ZERO_RESULTS' && <p>{t('fetch-no-results')}</p>}
        {data && data.results.map((place, index) => (
          <div key={index} className="p-4 border border-gray-300 rounded shadow">
            <p><strong>Latitude:</strong> {place.geometry.location.lat}</p>
            <p><strong>Longitude:</strong> {place.geometry.location.lng}</p>
            <p><strong>Distance:</strong> {Math.round(place.distance)} m</p>
            {/* <LazyLoadImage effect="blur" width="200" height="200" src={place.icon} alt={place.name} /> */}
            <p><strong>Name:</strong> {place.name}</p>
            <p><strong>Vicinity:</strong> {place.vicinity}</p>
            <a 
                // href={`https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}`} 
                href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                // href={`https://www.google.com/maps/place/?q=place_name:${place.name}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-2">
              View on Google Maps
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestAPI;


      {/* // {data && <pre>{JSON.stringify(data, null, 2)}</pre>} */}
// {
//     "html_attributions": [],
//     "results": [],
//     "status": "ZERO_RESULTS"
//   }

