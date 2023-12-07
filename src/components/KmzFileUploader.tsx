import React, { useState } from 'react';

export const KmzFileUploader = ({ onFileSelected, onUploadClick, isProcessing  }) => {

  const [fileSelected, setFileSelected] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileSelected(!!file);
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div>
      <input
        title="kmz-upload"
        type="file"
        id="kmz-upload"
        accept=".kmz,.kml,.json"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-600 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-full 
        file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <button className={`border-2 p-3 ml-4 rounded-full  text-sm font-bold ${!fileSelected ?'bg-gray-200 hover:bg-gray-300' :'hover:bg-yellow-300'} `} 
              onClick={onUploadClick} 
              disabled={!fileSelected || isProcessing}>
      {isProcessing ? ('處理中...' ) : (<div className={`text-blue-600 ${!fileSelected ? 'text-gray-500' :''}`}><i className="fas fa-file-import" ></i> 匯入 KMZ/GeoJson </div>)}
    </button>
  </div>
  );
};