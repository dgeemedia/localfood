// controllers/vendors.js

const db = require('../db/connect');
const { ObjectId } = require('mongodb');

const collectionName = 'vendors';

const getCollection = () => {
  const database = db.getDb();
  return database.collection(collectionName);
};

// CRUD operations get all vendors
const getAll = async (req, res, next) => {
  try {
    const col = getCollection();
    const vendors = await col.find({}).toArray();
    res.json(vendors);
  } catch (err) { next(err); }
};

// Get vendor by id
const getById = async (req, res, next) => {
  try {
    const col = getCollection();
    const vendor = await col.findOne({ _id: new ObjectId(req.params.id) });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) { next(err); }
};

// Create new vendor
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

// Update vendor by id
const update = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const updates = { ...(req.body || {}) };
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'At least one field is required to update' });
    }

    const col = getCollection();

    // perform update
    const result = await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    // if nothing matched, return 404
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Vendor not found' });

    // fetch and return the updated document
    const updated = await col.findOne({ _id: new ObjectId(id) });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Delete vendor by id
const remove = async (req, res, next) => {
  try {
    const col = getCollection();
    const result = await col.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
