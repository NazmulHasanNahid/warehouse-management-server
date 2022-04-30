const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zfiij.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("warehouse").collection("products");
    app.get("/products", async (req, res) => {
         const query = {} 
         const cursor = productCollection.find(query)
         const products = await cursor.toArray()
         res.send(products)
    });
    app.get('/products/:id' , async(req,res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const products = await productCollection.findOne(query)
      res.send(products)

    })
    app.post('/products' , async(req,res)=>{
      const newProducts = req.body ;
      const result = await productCollection.insertOne(newProducts)
      res.send(result)
    })

    app.delete('/products/:id' , async(req,res)=>{
      const id = req.params.id ;
      const query = {_id: ObjectId(id)}
      const result = await productCollection.deleteOne(query)
      res.send(result)
    })
  } finally {
    //await client.close()
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Werehouse server runnig");
});

app.listen(port, () => {
  console.log("listening to the port", port);
});
