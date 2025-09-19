// db/connect.js
// Simple MongoDB connection helper that loads environment variables,
// initializes a single MongoClient instance, and exposes init/get helpers.

const { MongoClient } = require('mongodb');
require('dotenv').config();

let _client = null; // MongoClient
let _db = null;     // Database object (db())

const initDb = async (callback) => {
  if (_db) {
    console.log('Database already initialized');
    return callback(null, _db);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) return callback(new Error('MONGODB_URI not set in environment'));

  try {
    const client = new MongoClient(uri);
    await client.connect();
    // Use database specified in URI or fallback to 'mypadifood'
    const defaultDb = client.db(); 
    _client = client;
    _db = defaultDb;
    console.log('Connected to MongoDB:', _db.databaseName);
    return callback(null, _db);
  } catch (err) {
    return callback(err);
  }
};

const getDb = () => {
  if (!_db) throw new Error('Database not initialized. Call initDb first.');
  return _db;
};

module.exports = { initDb, getDb };
