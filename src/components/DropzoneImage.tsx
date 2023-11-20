import { useDropzone } from 'react-dropzone';

const DropzoneImage = ({ onFileUploaded }) => {
  const { getRootProps, getInputProps } = useDropzone({
    //@ts-ignore
    accept: ['image/*'],
    onDrop: acceptedFiles => {
      onFileUploaded(acceptedFiles[0]);
    }
  });

  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      <p>請拖曳檔案到此，或直接點擊</p>
    </div>
  );
};

export default DropzoneImage;