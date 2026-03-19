const dns = require('dns');

const hostname = '_mongodb._tcp.cluster0.j8sa6.mongodb.net';

console.log(`Checking SRV records for ${hostname}...`);

dns.resolveSrv(hostname, (err, addresses) => {
  if (err) {
    console.error('❌ DNS SRV resolution failed:', err.message);
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.log('💡 This suggests a DNS issue or that the host doesn\'t exist.');
    }
    return;
  }

  console.log('✅ SRV resolution successful:');
  addresses.forEach((addr, index) => {
    console.log(`  ${index + 1}: ${addr.name}:${addr.port}`);
  });
});

dns.resolveTxt('cluster0.j8sa6.mongodb.net', (err, records) => {
    if (err) {
        console.error('❌ TXT resolution failed (used for Atlas options):', err.message);
    } else {
        console.log('✅ TXT resolution successful:', records);
    }
});
