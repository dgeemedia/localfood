// swagger.js
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'mypadifood API',
    description: 'CRUD API for Week 03 (clients + vendors)'
  },
  host: process.env.SWAGGER_HOST || 'localhost:8083',
  schemes: ['http']
};

const outputFile = './swagger.json';
const endpointsFiles = ['./routes/index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('swagger.json generated');
});
