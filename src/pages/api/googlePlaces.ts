// pages/api/googlePlaces.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {

    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    try {
      const response = await client.placesNearby({
        params: {
          location: `${latitude},${longitude}`,
          radius: 2000, // 搜索半径为2000米
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 1000,
      });

      // 只保留前 50 個結果
      const topResults = response.data.results.slice(0, 50);

      res.status(200).json({ ...response.data, results: topResults });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

//  if buttonClick

// GetData

// async function fetchPlaces(latitude, longitude) {
//     const response = await fetch(`/api/places?latitude=${latitude}&longitude=${longitude}`);
//     const data = await response.json();
//     // 處理資料
//   }

// 新版的搜尋附近地點功能，使用 'findplacefromtext' 方法
// const placeSearchResponse = await client.findPlaceFromText({
//     params: {
//       input: 'restaurant', // 或者您想要搜尋的景點類型
//       inputtype: 'textquery', // 指定輸入類型
//       fields: ['name', 'geometry'], // 指定您想返回的欄位
//       locationbias: `circle:1000@${latitude},${longitude}`, // 以用戶位置為中心的搜尋半徑
//       key: process.env.GOOGLE_MAPS_API_KEY,
//     },
//   });
  

// const photoResponse = await client.placePhoto({
//     params: {
//       photoreference: 'YOUR_PHOTO_REFERENCE', // 從景點資料中獲得的相片參考
//       maxwidth: 400, // 或者您需要的任何尺寸
//       key: process.env.GOOGLE_MAPS_API_KEY,
//     },
//   });