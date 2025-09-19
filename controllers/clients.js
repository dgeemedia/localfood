// controllers/clients.js 

const db = require('../db/connect');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

const collectionName = 'clients';

const getCollection = () => {
  const database = db.getDb();
  return database.collection(collectionName);
};

// Exclude passwordHash from results
const getAll = async (req, res, next) => {
  try {
    const col = getCollection();
    const clients = await col.find({}).project({ passwordHash: 0 }).toArray();
    res.json(clients);
  } catch (err) { next(err); }
};

// Exclude passwordHash from result
const getById = async (req, res, next) => {
  try {
    const col = getCollection();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const client = await col.findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) { next(err); }
};

// On create, hash the password before storing
const create = async (req, res, next) => {
  try {
    // defensive: ensure req.body is an object
    const body = req.body || {};
    // basic required-field check
    const { password } = body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    // other required fields (example: firstName, lastName, email) — validate here too
    const { firstName, lastName, email } = body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName and email are required' });
    }

    const col = getCollection();
    const { password: _pwd, ...rest } = body; // we've already captured password
    const passwordHash = await bcrypt.hash(password, 10);
    const payload = { ...rest, passwordHash, createdAt: new Date() };

    const result = await col.insertOne(payload);
    res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    next(err);
  }
};

// On update, do not allow password or passwordHash updates here
const update = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const updates = { ...(req.body || {}) };
    delete updates.passwordHash;
    delete updates.password; // do not allow password raw updates here

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'At least one field is required to update' });
    }

    const col = getCollection();
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result.value) return res.status(404).json({ error: 'Client not found' });
    const { passwordHash, ...payload } = result.value;
    res.json(payload);
  } catch (err) { next(err); }
};

// Delete client by id
const remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const col = getCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
