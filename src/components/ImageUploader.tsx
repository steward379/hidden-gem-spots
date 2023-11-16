// ImageUploader.tsx
import React, { useState } from 'react';

const ImageUploader = ({ onImageUpload }) => {
  const [images, setImages] = useState<File[]>([]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      setImages(selectedFiles);
      onImageUpload(selectedFiles); // 呼叫父組件的回調函數
    }
  };

  return (
    <div>
      {images.map((image, index) => (
        <div key={index}>
          {/* 顯示圖片預覽 */}
        </div>
      ))}
      <input 
        title="files"
        type="file" 
        accept="image/*" 
        multiple 
        onChange={handleImageChange}
      />
    </div>
  );
};

export default ImageUploader;
