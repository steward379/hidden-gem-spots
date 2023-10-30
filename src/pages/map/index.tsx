// src/pages/map/index.tsx

import dynamic from 'next/dynamic';
import React, { useState } from 'react';

const MapComponentWithNoSSR = dynamic(
  () => import('../../components/MapComponent'),
  { ssr: false }
);

const MapDemoPage: React.FC = () => {
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = () => {
    setIsDrawing(true);
    // ...之後的邏輯會在這裡實現
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="md:w-2/3 flex justify-center items-center">
        <MapComponentWithNoSSR />
      </div>
      <div className="md:w-1/3 flex flex-col">
        {!isDrawing && (
          <button
            className="m-4 p-2 bg-blue-500 text-white rounded"
            onClick={startDrawing}
          >
            繪製路線
          </button>
        )}
        {/* 之後的輸入框和按鈕將會在這裡實現 */}
      </div>
    </div>
  );
};

export default MapDemoPage;

