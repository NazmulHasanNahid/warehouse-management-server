const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req , res , next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'Unauthorized Access'})
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decoded) => {
    if(err){
      return res.status(403).send({message:'Forbidden Access'})
    }
    console.log('decoded' , decoded);
    req.decoded = decoded ;
    next()
  })
}

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
    const categoriesCollection = client.db("warehouse").collection("categories");

    //auth
    app.post('/login' , async(req,res)=>{
      const user = req.body ;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET , {
        expiresIn:'1d'
      })
      res.send({accessToken})
    })

    //all products api
    app.get("/products", async (req, res) => {
         const q = req.query
         const query = {} 
         const cursor = productCollection.find(q)
         const products = await cursor.toArray()
         res.send(products)
    });
    //dynamic product api
    app.get('/products/:id' , async(req,res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const products = await productCollection.findOne(query)
      res.send(products)

    })
   //user based item api
    app.get('/userAddedItem' , verifyJWT , async (req, res)=>{
        const decodedEmail = req.decoded.email
        const email = req.query.email;
        if(email === decodedEmail){
          const query = {email:email} ;
          const cursor = productCollection.find(query)
          const items = await cursor.toArray()
          res.send(items)
        }
        else{
          res.status(403).send({message:'forbidden access'})
        }
    })
    //catrgories item api
    app.get('/categories' , async(req,res)=>{
      const q = req.query
      const query = {} 
      const cursor = categoriesCollection.find(q)
      const categories = await cursor.toArray()
      res.send(categories)

    })
    //add categories api
    app.post('/categories' , async(req,res)=>{
      const newCategory = req.body;
      const result = await categoriesCollection.insertOne(newCategory)
      res.send(result)
    })
    //add product api
    app.post('/products' , async(req,res)=>{
      const newProducts = req.body ;
      const result = await productCollection.insertOne(newProducts)
      res.send(result)
    })

     //quantity update api
     app.put('/quantity/:id' , async(req,res)=>{
      const id = req.params.id;
      const data = req.body;
      const filter = {_id: ObjectId(id)}
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          quantity : data.quantity 
        }
      };
      const result = await productCollection.updateOne(filter ,updatedDoc , options)
      res.send(result)

      
     })


 //delet api
    app.delete('/product/:id' , async(req,res)=>{
      const id = req.params.id ;
      const query = {_id: ObjectId(id)}
      const result  = await productCollection.deleteOne(query)
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
