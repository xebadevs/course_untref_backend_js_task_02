const { MongoClient } = require("mongodb");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const client = new MongoClient(process.env.DATABASE_URL);

async function connect() {
  let connection = null;
  console.log("Conectando...");

  try {
    connection = await client.connect();
    console.log("🔌 Conectado");
  } catch (error) {
    console.log(error.message);
  }

  return connection;
}

async function disconnected() {
  try {
    await client.connect();
    console.log("🔌 Desconectado");
  } catch (error) {
    console.log(error.message);
  }
}

async function connectToCollection(collectionName) {
  const connection = await connect();
  const db = connection.db(process.env.DATABASE_NAME);
  const collection = db.collection(collectionName);

  return collection;
}

async function generateId(collection) {
  const documentMaxId = await collection
    .find()
    .sort({ id: -1 })
    .limit(1)
    .toArray();
  const maxId = documentMaxId[0]?.id ?? 0;

  return maxId + 1;
}

module.exports = { connectToCollection, disconnected, generateId };
