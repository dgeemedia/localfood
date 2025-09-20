# mypadifood API

A minimal CRUD API for **mypadifood** (Week 03) using the **native MongoDB driver**.  
Provides `clients` and `vendors` collections, Joi validation, error handling, and Swagger docs.

## Project purpose
Build and publish a CRUD API to practice:
- GET / POST / PUT / DELETE routes
- Validation and error handling
- Native MongoDB driver usage (no Mongoose)
- Swagger documentation (basic)
- Prepare for OAuth integration in Week 04

---

## Requirements
- Node.js v18+ (Node v22 tested)
- A MongoDB connection string (Atlas recommended)
- `npm` 

---

## Quick start (local)

1. Clone repo and install:
```bash
git clone <your-repo-url>
cd mypadifood
npm install


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
