import { useDropzone } from 'react-dropzone';

const DropzoneImage = ({ onFileUploaded }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    onDrop: acceptedFiles => {
      onFileUploaded(acceptedFiles[0]);
    }
  });

  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      <p>Drag 'n' drop some files here, or click to select files</p>
    </div>
  );
};

export default DropzoneImage;