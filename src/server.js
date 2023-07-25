const express = require("express");
const path = require("path");
const {
  connectToCollection,
  disconnected,
  generateId,
} = require("../connection_db.js");

const server = express();

// Middlewares
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use("/public", express.static(path.join(__dirname, "public")));

server.get("/api/v1/muebleria", async (req, res) => {
  const { marca, precio, precio_mayor_que } = req.query;
  let coches = [];

  try {
    const collection = await connectToCollection("muebleria");
    if (marca) coches = await collection.find({ marca }).toArray();
    else if (precio === "min")
      coches = await collection.find().sort({ precio: 1 }).limit(1).toArray();
    else if (precio === "max")
      coches = await collection.find().sort({ precio: -1 }).limit(1).toArray();
    else if (precio_mayor_que)
      coches = await collection
        .find({ precio: { $gt: Number(precio_mayor_que) } })
        .toArray();
    else coches = await collection.find().toArray();

    res.status(200).send(JSON.stringify(coches, null, "\t"));
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Hubo un error en el servidor");
  } finally {
    await disconnected();
  }
});

server.get("/api/v1/coches/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const collection = await connectToCollection("coches");
    const coche = await collection.findOne({ id: { $eq: Number(id) } });

    if (!coche)
      return res
        .status(400)
        .send("Error. El Id no corresponde a un coche existente.");

    res.status(200).send(JSON.stringify(coche, null, "\t"));
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Hubo un error en el servidor");
  } finally {
    await disconnected();
  }
});

server.post("/api/v1/coches", async (req, res) => {
  const { marca, modelo, anio, precio, descuento, es_0km, velocidad_crucero } =
    req.body;

  if (!marca || !modelo || !anio || !precio) {
    return res.status(400).send("Error. Faltan datos de relevancia.");
  }

  try {
    const collection = await connectToCollection("coches");
    const coche = {
      id: await generateId(collection),
      marca,
      modelo,
      anio,
      precio,
    };

    if (descuento) coche.descuento = descuento;
    if (es_0km) coche.es_0km = es_0km;
    if (velocidad_crucero) coche.velocidad_crucero = velocidad_crucero;

    await collection.insertOne(coche);

    res.status(200).send(JSON.stringify(coche, null, "\t"));
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Hubo un error en el servidor");
  } finally {
    await disconnected();
  }
});

server.put("/api/v1/coches/:id", async (req, res) => {
  const { id } = req.params;
  const { marca, modelo, anio, precio, descuento, es_0km, velocidad_crucero } =
    req.body;
  const coche = { marca, modelo, anio, precio };

  if (!id || !marca || !modelo || !anio || !precio) {
    return res.status(400).send("Error. Faltan datos de relevancia.");
  }

  if (descuento) coche.descuento = descuento;
  if (es_0km) coche.es_0km = es_0km;
  if (velocidad_crucero) coche.velocidad_crucero = velocidad_crucero;

  try {
    const collection = await connectToCollection("coches");
    await collection.updateOne({ id: Number(id) }, { $set: coche });

    res.status(200).send(JSON.stringify(coche, null, "\t"));
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Hubo un error en el servidor");
  } finally {
    await disconnected();
  }
});

server.delete("/api/v1/coches/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const collection = await connectToCollection("coches");
    await collection.deleteOne({ id: { $eq: Number(id) } });

    res.status(200).send("Eliminado");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Hubo un error en el servidor");
  } finally {
    await disconnected();
  }
});

// Control de rutas inexistentes
server.use("*", (req, res) => {
  res
    .status(404)
    .send(
      `<h1>Error 404</h1><h3>La URL indicada no existe en este servidor</h3>`
    );
});

// Método oyente de solicitudes
server.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, () => {
  console.log(
    `Ejecutandose en http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/v1/muebleria`
  );
});
