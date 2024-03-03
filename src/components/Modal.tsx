// components/Modal.tsx
import React, { FC, ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

const Modal: FC<ModalProps> = ({ children, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white p-6 rounded-lg shadow-lg z-50">
        {children}
      </div>
    </div>,
    
    document.getElementById('modal-root') as HTMLElement
  );
};

export default Modal;
