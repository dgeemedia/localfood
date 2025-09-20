// swagger.js — generate OpenAPI 3.0 with both local and deployed servers
const swaggerAutogen = require('swagger-autogen')();

const localHost = process.env.SWAGGER_LOCAL || 'http://localhost:8083';
const prodHost = process.env.SWAGGER_PROD || 'https://localfood.onrender.com';

// sanitize values (strip trailing slashes)
const sanitize = (u) => u.replace(/\/+$/, '');

const doc = {
  openapi: '3.0.0',
  info: {
    title: 'mypadifood API',
    version: '1.0.0',
    description: 'CRUD API for Week 03 (clients + vendors)'
  },
  servers: [
    { url: sanitize(localHost), description: 'Local development' },
    { url: sanitize(prodHost), description: 'Render production' }
  ],
  paths: {}
};

const outputFile = './swagger.json';
const endpointsFiles = ['./routes/index.js'];

// generate swagger.json
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('swagger.json generated with servers:', sanitize(localHost), sanitize(prodHost));
});
