// swagger.js — generate a Swagger 2.0 (OpenAPI 2.0) definition
const swaggerAutogen = require('swagger-autogen')();

const host = process.env.SWAGGER_HOST || 'localhost:8083';         // set to localfood.onrender.com on Render
const scheme = process.env.SWAGGER_SCHEME || (host.includes('localhost') ? 'http' : 'https');

const doc = {
  swagger: "2.0",
  info: {
    title: 'mypadifood API',
    description: 'CRUD API for Week 03 (clients + vendors)',
    version: '1.0.0'
  },
  host,               // example: localfood.onrender.com
  schemes: [scheme],  // example: ['https']
  basePath: '/',      // root path
  produces: ['application/json'],
  consumes: ['application/json']
};

const outputFile = './swagger.json';
const endpointsFiles = ['./routes/index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('swagger.json (Swagger 2.0) generated with host:', host);
});
