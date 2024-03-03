// components/DropImagePreview.tsx
import { useDropzone } from 'react-dropzone';
import { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const DropImagePreview = ({ onFileUploaded, circle=false }) => {
  const [preview, setPreview] = useState(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {'image/jpeg': [], 'image/png': [], 'image/svg+xml': [], 'image/gif': []},
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      setPreview(URL.createObjectURL(file));
      onFileUploaded(file);
    }
  });

  return (
    <div {...getRootProps()} className={`relatvie mb-5 mt-5 flex justify-center items-center border-2 border-dashed border-gray-300 
                                        ${circle ? 'rounded-full overflow-hidden bg-white' : 'rounded-lg'} h-32 w-32 cursor-pointer hover:border-gray-500`}>
      <input {...getInputProps()} />
      {preview &&<div className="relative">
              <LazyLoadImage effect="blur" src={preview} alt="Preview" 
                  className={`h-32 w-32 object-cover`} width="300" height="300"/>
                  <svg className="absolute bottom-2 right-12 z-20 w-6 h-6 text-black-400 bg-white rounded-full p-1 bg-opacity-25" 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg> 
                  </div>}
      {!preview && 
      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
      </svg>
      }
    </div>
  );
};

export default DropImagePreview;
