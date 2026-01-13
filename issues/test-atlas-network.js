const net = require('net');
const tls = require('tls');

// Test basic network connectivity to MongoDB Atlas
const host = 'cluster0.rrp7vpi.mongodb.net';
const port = 27017;

console.log(`Testing network connectivity to ${host}:${port}...`);

// Test 1: Basic TCP connection
console.log('\n1. Testing TCP connection...');
const socket = net.createConnection({ host, port, timeout: 5000 });

socket.on('connect', () => {
  console.log('✓ TCP connection successful');
  socket.end();

  // Test 2: TLS connection without client cert
  console.log('\n2. Testing TLS handshake (without client cert)...');
  const tlsSocket = tls.connect({ host, port, timeout: 5000, rejectUnauthorized: false });

  tlsSocket.on('secureConnect', () => {
    console.log('✓ TLS handshake successful (server accepts connection)');
    console.log('Server certificate CN:', tlsSocket.getPeerCertificate().subject.CN);
    tlsSocket.end();

    // Test 3: TLS with client certificate
    const fs = require('fs');
    console.log('\n3. Testing TLS with X.509 client certificate...');
    const certPath = './Certs/X509-cert-5964230336800025568.pem';

    const tlsWithCert = tls.connect({
      host,
      port,
      key: fs.readFileSync(certPath),
      cert: fs.readFileSync(certPath),
      rejectUnauthorized: false,
      timeout: 5000
    });

    tlsWithCert.on('secureConnect', () => {
      console.log('✓ TLS handshake with client cert successful!');
      tlsWithCert.end();
      process.exit(0);
    });

    tlsWithCert.on('error', (err) => {
      console.error('✗ TLS with client cert failed:', err.message);
      process.exit(1);
    });
  });

  tlsSocket.on('error', (err) => {
    console.error('✗ TLS handshake failed:', err.message);
    process.exit(1);
  });
});

socket.on('timeout', () => {
  console.error('✗ Connection timeout - possible firewall/IP access list issue');
  process.exit(1);
});

socket.on('error', (err) => {
  console.error('✗ TCP connection failed:', err.message);
  console.error('\nPossible causes:');
  console.error('- IP address not whitelisted in MongoDB Atlas Network Access');
  console.error('- Network/firewall blocking outbound connections');
  console.error('- MongoDB Atlas cluster is down');
  process.exit(1);
});
