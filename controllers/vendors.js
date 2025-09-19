// controllers/vendors.js

const db = require('../db/connect');
const { ObjectId } = require('mongodb');

const collectionName = 'vendors';

const getCollection = () => {
  const database = db.getDb();
  return database.collection(collectionName);
};

const getAll = async (req, res, next) => {
  try {
    const col = getCollection();
    const vendors = await col.find({}).toArray();
    res.json(vendors);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const col = getCollection();
    const vendor = await col.findOne({ _id: new ObjectId(req.params.id) });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const col = getCollection();
    const payload = { ...req.body, createdAt: new Date() };
    const result = await col.insertOne(payload);
    res.status(201).json({ _id: result.insertedId, ...payload });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Vendor email already exists' });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const col = getCollection();
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    if (!result.value) return res.status(404).json({ error: 'Vendor not found' });
    res.json(result.value);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const col = getCollection();
    const result = await col.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
