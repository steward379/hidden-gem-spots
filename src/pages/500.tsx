// pages/500.tsx
import Link from 'next/link';
import React from 'react';

const Custom500: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-200">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800">500</h1>
                <p className="text-xl text-gray-600 mt-4">伺服器錯誤</p>
                <p className="text-gray-500 mt-2">抱歉，伺服器發生錯誤。</p>
                <Link href="/">
                    <a className="mt-6 inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                        返回首頁
                    </a>
                </Link>
            </div>
        </div>
    );
}

export default Custom500;
