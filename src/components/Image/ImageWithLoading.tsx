import React, { useState, FC } from 'react';
import Image, { ImageProps } from 'next/image';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const withLoadingIndicator = (WrappedImage: typeof Image) => {
  const ComponentWithLoading: FC<ImageProps> = ({ src, alt, width, height, ...rest }) => {
    const [isLoading, setLoading] = useState(true);

    return (
      <div className="relative" style={{ width, height }}>
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-gray-200">
            加載中...
          </div>
        )}
        <WrappedImage
          src={src}
          alt={alt}
          width={typeof width === 'number' ? width : parseInt(width)}
          height={typeof height === 'number' ? height : parseInt(height)}
          {...rest}
          onLoadingComplete={() => setLoading(false)}
        />
      </div>
    );
  };

  ComponentWithLoading.displayName = 'WithLoadingIndicator';
  return ComponentWithLoading;
};

const ImageWithLoading = withLoadingIndicator(Image);

const MyComponent: FC = () => (
  <div>
    <ImageWithLoading src="/path/to/image.jpg" alt="Example Image" width={300} height={200} />
    {/* 其他圖片... */}
  </div>
);

export default MyComponent;
