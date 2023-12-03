import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  message: string;
  showConfirmButton?: boolean;
  isALoadingAlert?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose=()=>{}, onConfirm = () => {}, message='', showConfirmButton=false, isALoadingAlert=false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center">
      <div className="bg-white bg-opacity-60 p-6 rounded-lg shadow-xl backdrop-blur-sm">
        <p className="text-black">{message}</p>
        <div className="flex justify-end space-x-4">
          {isALoadingAlert && (
          <div className="progress-bar w-32 h-2 bg-gray-200 relative">
              <div className="progress w-0 h-2 bg-black absolute border rounded"></div>
          </div>
          )}
          {showConfirmButton && (
            <button onClick={onConfirm} className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600">
              確認刪除
            </button>
          )}
          {!isALoadingAlert && (
            <button onClick={onClose} className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
              {showConfirmButton ? '取消' : '確定'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
