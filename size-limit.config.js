// 📦 **SIZE LIMIT CONFIGURATION**
// Bundle Size Monitoring for Souk El-Sayarat

module.exports = [
  {
    name: 'Main Bundle',
    path: 'dist/assets/*.js',
    limit: '500 KB',
    gzip: true,
    running: false
  },
  {
    name: 'CSS Bundle',
    path: 'dist/assets/*.css',
    limit: '100 KB',
    gzip: true,
    running: false
  },
  {
    name: 'Vendor Bundle',
    path: 'dist/assets/vendor*.js',
    limit: '800 KB',
    gzip: true,
    running: false
  },
  {
    name: 'Total Bundle Size',
    path: 'dist/assets/*',
    limit: '1.5 MB',
    gzip: true,
    running: false
  }
];
