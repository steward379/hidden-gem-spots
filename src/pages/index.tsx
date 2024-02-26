// SSG
import Link from 'next/link';
import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Footer from '../components/Footer'; 
import { GetStaticProps } from 'next';

import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// import { Inter } from "next/font/google";
// const inter = Inter({ subsets: ["latin"] });

// import Header from "./components/Header";
// import Footer from "./components/Footer";
// import Main from "./components/Main";

const LandingPage = () => {
  const { t } = useTranslation('common');

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
                  <p className="mt-4 text-2xl mb-8"> {t('caption')} </p>
                  <Link href="/home">
                      <button className="bg-yellow-400 text-gray-600 text-xl font-semibold py-3
                      px-5 rounded hover:bg-red-500 transition duration-300
                      cursor-pointer z-10" >
                          {t('explore')}
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
            <h2 className="text-xl md:text-2xl font-medium mb-3">  <i className="fas fa-location-dot"></i> {t('feature_1')}</h2>
            <p className="mb-5 text-baseline md:text-lg">{t('description_1')}</p>
            <Link href="/home">
              <button className="md:text-xl max-w-xs py-2 md:py-3 px-4 md:px-5 bg-amber-400 text-amber-700
                font-medium  hover:bg-red-400 transition duration-300 rounded-full text-baseline">{t('button_1')}</button>
            </Link>
          </div>
        </div>

        {/* Block 2 */}
        <div className="flex flex-col-reverse md:flex-row gap-4 items-center justify-center bg-white p-4 md:p-10">
          <div className="w-full md:w-1/3 text-center md:text-end p-4  sm:mr-0 lg:mr-6">
            <h2 className="text-xl md:text-2xl font-medium mb-3"><i className="fas fa-route"></i>  {t('feature_2')}</h2>
            <p className="mb-5 text-baseline md:text-lg">{t('description_2')}</p>
            <Link href="/home">
              <button className="md:text-xl max-w-xs py-2 md:py-3 px-4 md:px-5 bg-green-400 text-white font-medium 
              rounded-full hover:bg-blue-700 transition duration-300 text-baseline">{t('button_2')}</button>
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
            <h2 className="text-xl md:text-2xl font-medium mb-3">{t('feature_3_former')} <i className="fab fa-google"></i>{t('feature_3_latter')}</h2>
            <p className="mb-5 text-baseline md:text-lg">{t('description_3')}</p>
            <Link href="/home">
              <button className="md:text-xl max-w-xs py-2 md:py-3 px-4 md:px-5 bg-red-500 text-teal-100
                font-medium  hover:bg-white hover:text-red-600 transition duration-300 rounded-full text-baseline">{t('button_3')}</button>
            </Link>
          </div>
        </div>
        
          {/* Block 4 */}
        <div className="flex flex-col-reverse md:flex-row gap-4 items-center justify-center bg-white p-4 md:p-10">
          <div className="w-full md:w-1/3 text-center md:text-end p-4  sm:mr-0 lg:mr-6">
            <h2 className="text-xl md:text-2xl font-medium mb-3"><i className="fas fa-upload"></i> {t('feature_4')}</h2>
            <p className="mb-5 text-baseline md:text-lg">{t('description_4')}</p>
            <Link href="/home">
              <button className="md:text-xl max-w-xs py-2 md:py-3 px-4 md:px-5 bg-teal-700 text-white font-medium rounded-full hover:bg-blue-700 
              transition duration-300 text-baseline">{t('button_4')}</button>
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

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    }, 
  }; 
};

export default LandingPage;