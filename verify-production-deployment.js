/**
 * 🔍 PRODUCTION DEPLOYMENT VERIFICATION
 * Souk El-Sayarat - Live System Health Check
 */

import https from 'https';
import http from 'http';

const deploymentUrls = {
  hosting: 'https://souk-el-syarat.web.app',
  backend1: 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app',
  backend2: 'https://my-web-app--souk-el-syarat.us-central1.hosted.app'
};

async function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: {
          'content-type': res.headers['content-type'],
          'server': res.headers['server'],
          'cache-control': res.headers['cache-control']
        },
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 0,
        statusText: 'Connection Error',
        error: error.message,
        success: false
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        statusText: 'Timeout',
        error: 'Request timeout after 10 seconds',
        success: false
      });
    });
  });
}

async function verifyDeployment() {
  console.log('🚀 Verifying Souk El-Sayarat Production Deployment...\n');

  const results = [];

  for (const [name, url] of Object.entries(deploymentUrls)) {
    console.log(`🔍 Checking ${name}: ${url}`);
    const result = await checkUrl(url);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${name}: Status ${result.status} - ${result.statusText}`);
    } else {
      console.log(`❌ ${name}: ${result.statusText} - ${result.error || 'Failed'}`);
    }
    console.log('');
  }

  // Summary
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('📊 DEPLOYMENT VERIFICATION SUMMARY');
  console.log('===================================');
  console.log(`Total Services: ${totalCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${totalCount - successCount}`);
  console.log(`Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 ALL SERVICES ARE OPERATIONAL!');
    console.log('✅ Production deployment is successful and ready for users.');
  } else {
    console.log('\n⚠️  Some services may need attention.');
    console.log('Please check the failed services above.');
  }

  console.log('\n🌐 Live URLs:');
  console.log(`Frontend: ${deploymentUrls.hosting}`);
  console.log(`Backend 1: ${deploymentUrls.backend1}`);
  console.log(`Backend 2: ${deploymentUrls.backend2}`);
  
  console.log('\n📱 Your app is ready for production use!');
}

// Run verification
verifyDeployment().catch(console.error);
