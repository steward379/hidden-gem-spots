// /components/Footer.tsx
import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-200 text-center p-12 ">
      <LazyLoadImage effect="blur" src="/images/ballon.png" alt="logo" width="200" height="200" />
      <p className="mb-6"><i className="fa fa-traveling"></i> 2023 💎 Hidden Gem </p>
      <h3 className="text-xs mb-4">關於地球動畫 / 彩虹按鈕，為 React Component 改自</h3>
      <p className="text-xs text-gray-500"> 

      <Link href="https://codepen.io/ollypittaway/pen/dyZdMeg"><span> Copyright (c) 2023 by Gucci Pizza https://codepen.io/ollypittaway/pen/dyZdMeg </span></Link>
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.      
      </p>
      <p className="text-xs text-gray-500 mt-4"> <Link href="https://codepen.io/lemmin/pen/WObwRX"><span>Rainbow Animated Button changed to variables from : https://codepen.io/lemmin/pen/WObwRX</span> </Link> </p>
    </footer>
  );
};

export default Footer;