import dynamic from 'next/dynamic';
import React from 'react';

// 導入地圖組件並設置 `ssr` 為 false
const MapComponentWithNoSSR = dynamic(
    () => import('../../components/MapComponent'),
  { ssr: false }
);

const MapDemoPage: React.FC = () => {
  return (
    <div className="h-screen">
      <MapComponentWithNoSSR />
    </div>
  );
};

export default MapDemoPage;