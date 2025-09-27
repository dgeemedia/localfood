// swagger.js
const swaggerAutogen = require('swagger-autogen')();
const fs = require('fs/promises');
const path = require('path');

const localHost = process.env.SWAGGER_LOCAL || 'http://localhost:8083';
const prodHost = process.env.SWAGGER_PROD || 'https://localfood.onrender.com';
const sanitize = (u) => u.replace(/\/+$/, '');

const serverBase = sanitize(localHost);

const doc = {
  openapi: '3.0.0',
  info: {
    title: 'mypadifood API',
    version: '1.0.0',
    description: 'CRUD API with GitHub OAuth (server-side flow), cookie sessions and JWT'
  },
  servers: [
    { url: sanitize(localHost), description: 'Local development' },
    { url: sanitize(prodHost), description: 'Production' }
  ],
  security: [
    { bearerAuth: [] },
    { cookieAuth: [] }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: process.env.SESSION_COOKIE_NAME || 'mypadifood.sid',
        description: 'Session cookie set after successful login'
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Use the JWT returned from /auth/github/callback (via Swagger redirect).'
      },
      githubOAuth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            // Swagger will call your server start endpoint which creates state & session then redirects to GitHub
            authorizationUrl: `${serverBase}/auth/start-oauth`,
            tokenUrl: 'https://github.com/login/oauth/access_token',
            scopes: {
              'read:user': 'Read basic user profile',
              'user:email': 'Read user email addresses'
            }
          }
        }
      }
    }
  },
  paths: {}
};

const outputFile = path.resolve(__dirname, './swagger.json');
const endpointsFiles = ['./routes/index.js'];

(async () => {
  try {
    await swaggerAutogen(outputFile, endpointsFiles, doc);
    console.log('swagger-autogen finished');

    // Read & remove swagger 2 leftover if any
    const raw = await fs.readFile(outputFile, 'utf8');
    const json = JSON.parse(raw);
    if (json.openapi && json.swagger) {
      delete json.swagger;
      await fs.writeFile(outputFile, JSON.stringify(json, null, 2), 'utf8');
      console.log('swagger.json cleaned (removed swagger field)');
    }
  } catch (err) {
    console.error('Error generating swagger.json:', err);
    process.exit(1);
  }
})();
