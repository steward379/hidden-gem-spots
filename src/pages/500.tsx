import Link from 'next/link';
import React from 'react';
import { useTranslation } from 'next-i18next';

const Custom500: React.FC = () => {
    const { t } = useTranslation('common');
    
    return (
        <div className="flex items-center justify-center h-screen bg-gray-200">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800">500</h1>
                <p className="text-xl text-gray-600 mt-4">{t('server-error')}</p>
                <p className="text-gray-500 mt-2">{t('server-error-sorry')}</p>
                <Link href="/">
                    <div className="mt-6 inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                        {t('back-to-index')}
                    </div>
                </Link>
            </div>
        </div>
    );
}

export default Custom500;
