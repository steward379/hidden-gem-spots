import Link from 'next/link';
import LoginComponent from '../components/EmailLogComponent';
import GoogleLogComponent from '../components/GoogleLogComponent';
import Image from 'next/image';

import React from 'react';
// import { useLocation } from 'react-router-dom'; //Router Context but don't use it in Next.js
import { useRouter } from 'next/router';

export default function Home() {
    const router = useRouter();
    const message = router.query.message;

    return (
        <>
            <div className="container max-w-xl mx-auto border p-10 mt-10 items-center justify-center">
                <div className="flex flex-col items-center bg-gray-300 p-10 rounded-lg">
                <Image src="/images/ballon.png" alt="Scene Image" width="300" height="300" 
                objectFit='cover' />
                    <h1 className="text-4xl mb-4 text-gray-800">Hidden Gem Spots</h1>
                    <p className="text-xl mb-6 text-gray-500">找尋你的秘密景點</p>
                    {message && <p className="text-red-500 p-2">{message}</p>}
                    <Link href="/map">
                        <div className="cursor-pointer text-lg bg-gray-800 px-8 py-2 hover:bg-gray-700 rounded shadow text-white">
                            前往你的景點地圖
                        </div>
                    </Link>
                </div>
            </div>
            <div className='w-full text-center flex-1 md:w-1/2 mx-auto mt-16'>
                <Image src="/images/future-02.png" alt="Scene Image" width="1000" height="1000" 
                    objectFit='cover' />
                <Image src="/images/future-03.png" alt="Scene Image" width="1000" height="1000" 
                    objectFit='cover' />
                <Image src="/images/future-01.png" alt="Scene Image" width="1000" height="1000" 
                    objectFit='cover' />
            </div>
        </>
    )
}
