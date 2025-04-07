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
  

  // Get all lessons
app.get('/collection/lessons', async (req, res) => {
    try {
      const lessons = await lessonsCollection.find({}).toArray();
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      res.status(500).json({ error: 'Failed to fetch lessons' });
    }
  });
  

  // Get all orders
app.get('/collection/orders', async (req, res) => {
    try {
      const orders = await ordersCollection.find({}).toArray();  // Fetch all orders from the database
      res.json(orders);  // Send the orders back as JSON
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });  // Handle errors
    }
  });
  

  // Search lessons
app.get('/search/lessons', async (req, res) => {
    const query = req.query.q || '';
    try {
      const regex = new RegExp(query, 'i'); // case-insensitive search
  
      const results = await lessonsCollection
        .find({
          $or: [
            { title: regex },
            { location: regex },
            { price: { $regex: regex } },
            { availableSeats: { $regex: regex } },
            { description: regex },
          ],
        })
        .toArray();
  
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed.' });
    }
  });
  

  // Post an order
app.post('/collection/orders', async (req, res) => {
    try {
      const order = req.body;
  
      // Validate required fields
      if (!order.fullName || !order.phoneNumber || !order.lessons || order.lessons.length === 0) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
  
      // Check for available seats in the lessons
      for (const item of order.lessons) {
        const lesson = await lessonsCollection.findOne({
          _id: new ObjectId(item._id),
        });
        if (!lesson || lesson.availableSeats < item.quantity) {
          return res.status(400).json({
            error: `Not enough seats available in ${lesson?.title || 'lesson'}.`,
          });
        }
  
        // Decrease available seats
        await lessonsCollection.updateOne(
          { _id: new ObjectId(item._id) },
          { $inc: { availableSeats: -item.quantity } }
        );
      }
  
      const result = await ordersCollection.insertOne(order);
      res.status(201).json({ message: 'Order created successfully', orderId: result.insertedId });
    } catch (error) {
      console.error('Order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

  // Update lesson (for example, after an order is placed, update available seats)
app.put('/collection/lessons/:id', async (req, res) => {
    try {
      const lessonId = req.params.id;
      const updateData = req.body;
  
      const result = await lessonsCollection.updateOne(
        { _id: new ObjectId(lessonId) },
        { $set: updateData }
      );
  
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
  
      res.json({ message: 'Lesson updated successfully' });
    } catch (error) {
      console.error('Error updating lesson:', error);
      res.status(500).json({ error: 'Failed to update lesson' });
    }
  });
  

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  