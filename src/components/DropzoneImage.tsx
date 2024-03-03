import { useDropzone } from 'react-dropzone';
import ts from 'typescript';

const DropzoneImage = ({ onFileUploaded }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {'image/jpeg':[], 'image/png':[], 'image/svg+xml':[], 'image/gif':[]},
    onDrop: acceptedFiles => {
      onFileUploaded(acceptedFiles[0]);
    }
  });
  return (
    <div {...getRootProps()} className="mb-5 mt-5 flex justify-center items-center border-2 border-dashed
                            border-gray-300 rounded-lg h-32 w-32 cursor-pointer hover:border-gray-500">
      <input {...getInputProps()} />
      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
      </svg>
    </div>
  );
};

export default DropzoneImage;