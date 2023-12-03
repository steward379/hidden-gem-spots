const LoadingIndicator = () => {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <span className="block text-black mb-2">載入中...</span>
          <div className="progress-bar w-32 h-2 bg-gray-200 relative">
            <div className="progress w-0 h-2 bg-black absolute border rounded"></div>
          </div>
        </div>
      </div>
    );
  };
  
  export default LoadingIndicator;