const express = require('express')
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config()
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 4200;
const admin = require('firebase-admin');

var serviceAccount = require("./.configs/productcollection-silvia-firebase-adminsdk-6vu32-010d5358e5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.DB_NAME}.firebaseio.com`
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})
const ObjectID = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mcsxh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const productCollection = client.db('products_collection').collection("products");
  const orderCollection = client.db('products_collection').collection("orders");
  console.log("database connected");
  app.get('/productsdata', (req, res) => {
    productCollection.find({})
      .toArray((err, products) => {
        res.send(products)
      })
  })

  app.get('/product/:id', (req, res) => {
    productCollection.find({ _id: ObjectID(req.params.id) })
      .toArray((err, products) => {
        res.send(products[0])
      })
  })

  app.post('/addProduct', (req, res) => {
    const newProduct = req.body;
    console.log(req.body, "come from client site")
    productCollection.insertOne(newProduct)
      .then(result => {
        console.log('inserted count', result.insertedCount);
        res.send(result.insertedCount > 0)
      })
  })
  app.post('/addOrder', (req, res) => {
    const order = req.body;
    orderCollection.insertOne(order)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })
  app.delete('/deleteProduct/:id',(req,res)=>{
    productCollection.deleteOne({_id: ObjectID(req.params.id) })
    .then(result => {
      console.log(result)
      res.send(result.deletedCount > 0)
    })
  })
  app.get('/orders', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer')) {
      const idToken = bearer.split(' ')[1];//extracting second part
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          let tokenEmail = decodedToken.email;
          let queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            orderCollection.find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              })
          }
          else {
            res.send("unauthorized access");
          }
        })
        .catch((error) => {
        });
    }
  });

});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})