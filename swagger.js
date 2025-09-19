// swagger.js — sanitize host (no scheme) and generate Swagger 2.0
const swaggerAutogen = require('swagger-autogen')();

let host = process.env.SWAGGER_HOST || 'localhost:8083';
const scheme = process.env.SWAGGER_SCHEME || (host.includes('localhost') ? 'http' : 'https');

// if someone passed "https://localfood.onrender.com", strip protocol and slashes
host = host.replace(/^https?:\/\//, '').replace(/\/+$/, '');

const doc = {
  swagger: "2.0",
  info: {
    title: 'mypadifood API',
    description: 'CRUD API for Week 03 (clients + vendors)',
    version: '1.0.0'
  },
  host,               // e.g. localfood.onrender.com
  schemes: [scheme],  // e.g. ['https']
  basePath: '/',
  produces: ['application/json'],
  consumes: ['application/json']
};

const outputFile = './swagger.json';
const endpointsFiles = ['./routes/index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('swagger.json (Swagger 2.0) generated with host:', host, 'scheme:', scheme);
});
