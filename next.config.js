const path = require('path');

const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com', 'maps.gstatic.com'],
  },
  i18n: {
    locales: ['en-US', 'zh-TW'],
    defaultLocale: 'en-US',
    localeDetection: false,
    localePath: path.resolve('./public/locales')
  },
  webpack: (config, options) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
}

module.exports = nextConfig;