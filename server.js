import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to handle JSON request body
app.use(express.json());

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// CORS Middleware for cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  

  // Logging Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
  
  import path from 'path';
import { fileURLToPath } from 'url';

// Serve static files (images for lessons)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/assets', express.static(path.join(__dirname, 'assets')));


import { MongoClient } from 'mongodb';

// MongoDB connection
const uri = 'your-mongo-uri';
const client = new MongoClient(uri);

let lessonsCollection;
let ordersCollection;

// MongoDB Connection & Server Initialization
async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db('skillhub');
    lessonsCollection = database.collection('lessons');
    ordersCollection = database.collection('orders');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

run();


// Root Route
app.get('/', (req, res) => {
    res.send(`
      <h1>Welcome to the Backend Server</h1>
      <ul>
        <li><a href="collection/orders">Go to Orders</a></li>
        <li><a href="collection/lessons">Go to Lessons</a></li>
      </ul>
    `);
  });
  