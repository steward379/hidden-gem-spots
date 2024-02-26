// next-i18next.config.js
const path = require('path');

module.exports = {
    i18n: {
      locales: ['en-US', 'zh-TW'],
      defaultLocale: 'en-US',
      localeDetection: false,
      localePath: path.resolve('./public/locales')
    },
};