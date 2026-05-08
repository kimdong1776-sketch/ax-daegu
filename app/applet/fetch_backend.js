const fs = require('fs');
const https = require('https');

https.get('https://raw.githubusercontent.com/perjung/AX_DAEGU/backend/src/server.ts', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', (err) => console.log('Error: ', err.message));
