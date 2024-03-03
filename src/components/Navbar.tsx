import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useRouter } from 'next/router';

import EmailLogComponent from './EmailLogComponent';
import GoogleLogComponent from './GoogleLogComponent';  

import { useTranslation } from 'next-i18next';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { t, i18n } = useTranslation('common');
  const router = useRouter();

  const switchLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      router.push(router.pathname, router.asPath, { locale: language });
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

   useEffect(() => {
    const handleRouteChange = () => {
      i18n.changeLanguage(router.locale);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [i18n, router.locale, router.events]);

  useEffect(() => {
    i18n.loadNamespaces(['common']);
  }, [i18n, i18n.language]);

  const menuRef = useRef(null);
  const [menuHeight, setMenuHeight] = useState(0);

  useEffect(() => {
    if (menuRef.current) {
      setMenuHeight(menuRef.current.scrollHeight);
    }
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const languageSwitcher = (
    <button
      onClick={() => switchLanguage(router.locale === 'en-US' ? 'zh-TW' : 'en-US')}
      className="border font-medium text-sm px-3 py-2 mr-5 hover:bg-gray-200 rounded transition-colors duration-150"
    >
      {router.locale === 'en-US' ? '繁中' : 'English'}
    </button>
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-stone-300 bg-opacity-30 bg-black-200/80 text-black p-4 z-50 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
            <LazyLoadImage effect="blur" src="/images/ballon.png" alt="logo" width="50" height="50" />
              <span className="lg:text-2xl font-bold ml-2 text-md sm:block">Hidden Gem</span>
            </div>
          </Link>
          <div className="flex items-center justify-end">
              {languageSwitcher}
            <button title="toggle-menu" onClick={toggleMenu} className="sm:hidden">
              <i className="fas fa-bars text-xl"></i>
            </button>
          {/* {isMenuOpen && ( */}
            <div className={`absolute top-full left-0 right-0 p-4 sm:relative bg-opacity-70 
            lg:bg-opacity-0 md:bg-opacity-0 sm:top-auto sm:p-0 transition-all duration-300 ease-in-out 
            ${isMenuOpen ? 'block' : 'hidden'} sm:flex`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-stretch">
                {user ? (
                  <>
                    <Link href={`/member/${user.uid}`}>
                      <div className="flex items-center cursor-pointer">
                          <div className="image-hover-effect bg-yellow-500 relative w-12 h-12 rounded-full overflow-hidden">
                          <LazyLoadImage effect="blur"  
                              src={user.avatar || '/images/marker-icon.png'} 
                              alt="User avatar" 
                              width="50"
                              height="50"
                              className="object-cover"
                            />
                          </div>
                          <div className="ml-3 ext-sm sm:block">{t('nav-hello', { name: user.name || t('nav-member') })}</div>
                      </div>
                    </Link>

                    <div className={`flex-grow items-center mt-4 sm:mt-0 ${isMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row`}>
                      <Link href="/home">
                        <div className="sm:ml-4 lg:ml-10 md:ml-7">
                          <i className="fas fa-compass"></i>
                          <span className="ml-2">{t('nav-explore')}</span>
                        </div>
                      </Link>
                      <Link href={`/user-maps/${user.uid}`}>
                        <div className="mt-4 sm:mt-0 sm:ml-4 lg:ml-5 md:ml-3">
                          {t('nav-map-list')}
                        </div>
                      </Link>
                      <Link href="/map">
                        <div className="mt-4 sm:mt-0 sm:ml-4 lg:ml-5 md:ml-3">
                          {t('nav-big-map')}
                        </div>
                      </Link>
                      <button title="logout" onClick={logout} className="mt-4 sm:mt-0 sm:ml-4">
                        <i className="fas fa-arrow-right-from-bracket"></i>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={`mt-4 sm:mt-0 ${isMenuOpen ? 'flex' : 'hidden'} sm:flex flex flex-col justify-center items-center sm:flex-row lg:mr-10`}>
                    <EmailLogComponent />
                    <GoogleLogComponent />
                    {/* <SignInWithMetamaskButton /> */}
                    {/* <div className="flex items-center mt-3 lg:mt-0 lg:ml-3">
                    <SignInButton />
                    </div>
                    <div className="flex items-center mt-3 lg:mt-0 lg:ml-3">
                    <SignOutButton />
                    </div> */}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* )} */}
        </div>
      </nav>
      {isMenuOpen && <div className={` fixed transition-all inset-0 mt-20 ${ user ? "h-60" :"h-2"}  bg-white bg-opacity-50 backdrop-blur-md sm:hidden`} 
                    onClick={() => setIsMenuOpen(false)}></div>}
    </>
  );
};

export default Navbar;