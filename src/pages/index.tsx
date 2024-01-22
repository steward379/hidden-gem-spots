// pages/landing.tsx
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Footer from '../components/Footer'; 

import { useRouter } from 'next/router';
// import { Inter } from "next/font/google";
// const inter = Inter({ subsets: ["latin"] });

// import Header from "./components/Header";
// import Footer from "./components/Footer";
// import Main from "./components/Main";

const LandingPage = () => {
  // const router = useRouter();
  // const message = router.query.message;

  return (
    <div className="flex flex-col font-sans">
      <div className="relative font-sans mt-[-65px] h-screen-without-navbar-half">
          <div className="bg-fixed bg-cover bg-no-repeat bg-center absolute top-0 left-0 right-0 bottom-0 z-[-1]" 
              style={{ backgroundImage: "url('/images/pexels-tyler-lastovic.jpg')" }}>
          </div>

          <div className="overlay-dot-pattern absolute mt-[64px] top-0 left-0 right-0 bottom-0 z-2"></div>

          <div className="absolute top-10 left-0 right-0 bottom-0 flex items-center justify-center z-3">
              <div className="text-center text-white z-10">
                <div className='flex-column items-center justify-center lg:mt-0'>
                  <LazyLoadImage src="/images/ballon.png" alt="Scene Image" width="100" height="100" 
                      className="object-cover mix-blend-color-burn h-40 lg:h-60 lg:w-60 object-top" effect="blur" />
                  <LazyLoadImage src="/images/logo.png" alt="Scene Image" width="500" height="300" 
                      className="object-cover mix-blend-color-burn hidden lg:flex" effect="blur" />
                </div>
                  <p className="mt-4 text-2xl mb-8"> Hidden Gem 旅圓，讓你記錄每一趟生活冒險。</p>
                  <div className="flex justify-center items-center mb-8">
                    {/* {message && <p className=" bg-red-500 px-5 py-3 w-40 opacity-90 p-5 rounded-lg">{message}</p>} */}
                  </div>
                  <Link href="/home">
                      <button className="bg-yellow-400 text-gray-600 text-xl font-semibold py-3
                      px-5 rounded hover:bg-red-500 transition duration-300
                      cursor-pointer z-10" >
                          開始探索
                      </button>
                  </Link>
              </div>
          </div>
      </div>
      <div>
        {/* Block 1 */}
        <div className="md:flex gap-10 items-center justify-end bg-teal-50 p-4 md:p-16">
          <div className="flex md:flex-1 md:w-1/2 justify-center md:justify-end">
            <div className="flex justify-center md:justify-end w-80 h-80">
              <LazyLoadImage src="/images/new_show.gif" alt="Scene Image" 
                            className="rounded-2xl  shadow-2xl" 
                            effect="blur" />
            </div>
          </div>
          {/* 景點圖釘 fontawesome */}   
          <div className="w-full md:w-1/2 text-center md:text-left p-4">
            <h2 className="text-xl md:text-2xl font-medium mb-3">  <i className="fas fa-location-dot"></i> 創造、查看你的景點</h2>
            <p className="mb-5 text-baseline md:text-lg">專屬於你的景點地圖，無論是戶外首選、約會聖地，還是神之餐廳，清楚呈現。</p>
            <Link href="/home">
              <button className="md:text-xl max-w-xs py-2 md:py-3 px-4 md:px-5 bg-amber-400 text-amber-700
                font-medium  hover:bg-red-400 transition duration-300 rounded-full text-baseline"> 🔥 立刻新增</button>
            </Link>
          </div>
        </div>

        {/* Block 2 */}
        <div className="flex flex-col-reverse md:flex-row gap-4 items-center justify-center bg-white p-4 md:p-10">
          <div className="w-full md:w-1/3 text-center md:text-end p-4  sm:mr-0 lg:mr-6">
            <h2 className="text-xl md:text-2xl font-medium mb-3"><i className="fas fa-route"></i> 簡單規劃路徑 </h2>
            <p className="mb-5 text-baseline md:text-lg">規劃 500 公尺內的路徑，查看景點之間的行進方式</p>
            <Link href="/home">
              <button className="md:text-xl max-w-xs py-2 md:py-3 px-4 md:px-5 bg-green-400 text-white font-medium 
              rounded-full hover:bg-blue-700 transition duration-300 text-baseline"> 🗺️ 瀏覽地圖</button>
            </Link>
          </div>
          <div className="flex justify-center md:justify-end items-center" >
                  <div className="flex justify-center md:justify-end w-80 h-80">
            <LazyLoadImage src="/images/route_show.gif" alt="Scene Image" 
                          className="rounded-2xl shadow-2xl"
                          effect="blur" />
                </div>
          </div>
        </div>

        {/* Block 3 */}
        <div className="md:flex gap-10 items-center justify-end bg-red-50 p-4 md:p-16">
          <div className="flex md:flex-1 md:w-1/2 justify-center md:justify-end">
            <div className="flex justify-center md:justify-end w-80 h-80">
              <LazyLoadImage src="/images/google_show.gif" alt="Scene Image" 
                            className="rounded-2xl shadow-2xl" 
                            effect="blur" />
            </div>
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left p-4">
            <h2 className="text-xl md:text-2xl font-medium mb-3">查看附近的 <i className="fab fa-google"></i> 景點</h2>
            <p className="mb-5 text-baseline md:text-lg">點選附近景點，附近景點可點選呈現在地圖中心</p>
            <Link href="/home">
              <button className="md:text-xl max-w-xs py-2 md:py-3 px-4 md:px-5 bg-red-500 text-teal-100
                font-medium  hover:bg-white hover:text-red-600 transition duration-300 rounded-full text-baseline">📌 快來試試</button>
            </Link>
          </div>
        </div>
        
          {/* Block 4 */}
        <div className="flex flex-col-reverse md:flex-row gap-4 items-center justify-center bg-white p-4 md:p-10">
          <div className="w-full md:w-1/3 text-center md:text-end p-4  sm:mr-0 lg:mr-6">
            <h2 className="text-xl md:text-2xl font-medium mb-3"><i className="fas fa-route"></i> 使用 KML 上傳檔案 </h2>
            <p className="mb-5 text-baseline md:text-lg">規劃 500 公尺內的路徑，查看景點之間的行進方式</p>
            <Link href="/home">
              <button className="md:text-xl max-w-xs py-2 md:py-3 px-4 md:px-5 bg-teal-700 text-white font-medium rounded-full hover:bg-blue-700 
              transition duration-300 text-baseline">📃 即刻匯入</button>
            </Link>
          </div>
          <div className="flex justify-center md:justify-end items-center" >
                  <div className="flex justify-center md:justify-end w-80 h-90">
            <LazyLoadImage src="/images/kml_show.gif" alt="Scene Image" 
                          className="rounded-2xl shadow-2xl"
                          effect="blur" />
                </div>
          </div>
        </div>
      </div>
      <Footer /> 
  </div>
  );
};

export default LandingPage;

