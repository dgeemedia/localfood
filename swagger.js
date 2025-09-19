// swagger.js — generates swagger.json with correct deployed URL (uses SWAGGER_HOST env var)
const swaggerAutogen = require('swagger-autogen')();

const host = process.env.SWAGGER_HOST || 'localhost:8083';           
const scheme = process.env.SWAGGER_SCHEME || (host.includes('localhost') ? 'http' : 'https');
const url = `${scheme}://${host}`;

const doc = {
  openapi: '3.0.0',
  info: {
    title: 'mypadifood API',
    version: '1.0.0',
    description: 'CRUD API for Week 03 (clients + vendors)'
  },
  servers: [
    { url }   // e.g. "https://localfood.onrender.com"
  ]
};

const outputFile = './swagger.json';
const endpointsFiles = ['./routes/index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('swagger.json generated with server URL:', url);
});
