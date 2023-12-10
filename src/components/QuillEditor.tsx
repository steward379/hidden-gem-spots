import React, { useState } from 'react';
// import ReactQuill from 'react-quill';

import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});


const QuillEditor = ({ content, onContentChange, onFocus, onBlur }) => {
    const [showSourceCode, setShowSourceCode] = useState(false);
  
    const handleContentChange = (content) => {
      onContentChange(content); // 調用從父組件傳遞的函數
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
          <div>{showSourceCode ? "隱藏原始碼" : "顯示原始碼"}</div>
        </button>
        {showSourceCode && (
          <textarea
            title="地圖內容原始碼"
            value={content}
            onFocus={onFocus}
            onBlur={onBlur}
            
            readOnly // 如果不希望用戶在這裡編輯，可以設為只讀
            className="mb-2 p-2 w-full border text-gray-500 rounded-xl"
          />
        )}
      </>
    );
  };
  
  export default QuillEditor;