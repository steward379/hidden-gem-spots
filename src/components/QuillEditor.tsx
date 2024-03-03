import React, { useState } from 'react';
// import ReactQuill from 'react-quill';

import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});


const QuillEditor = ({ content, onContentChange, onFocus, onBlur }) => {
    const [showSourceCode, setShowSourceCode] = useState(false);
    const { t } = useTranslation('common');
  
    const handleContentChange = (content) => {
      onContentChange(content); 
    };
  
    return (
      <>
        <div className="bg-white text-black  rounded-xl border-2">
          <ReactQuill 
            theme="snow" 
            value={content} 
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={handleContentChange} 
          />
        </div>
        <button
          className={`mb-5 mt-5 p-3 flex justify-center items-center rounded-lg 
          cursor-pointer ${showSourceCode ? 'hover:bg-red-100 bg-gray-200' : 'hover:bg-green-200 bg-green-100'}
          focus:outline-none focus:ring-2 focus:ring-blue-300`}
          onClick={() => setShowSourceCode(!showSourceCode)}
        >
          <i className={`fas ${showSourceCode ? 'fa-eye-slash' : 'fa-eye'} mr-2`}></i>
          <div>{showSourceCode ? t('hide-source-code') : t('show-source-code') }</div>
        </button>
        {showSourceCode && (
          <textarea
            title="map-source-code"
            value={content}
            onFocus={onFocus}
            onBlur={onBlur}
            
            readOnly
            className="mb-2 p-2 w-full border text-gray-500 rounded-xl"
          />
        )}
      </>
    );
  };
  
  export default QuillEditor;