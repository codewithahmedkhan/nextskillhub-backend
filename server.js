import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';




const app = express();
const port = process.env.PORT || 3000;

// Middleware to handle JSON request body
app.use(express.json());

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

// Serve static files (images for lessons)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// MongoDB connection
const uri = 'mongodb+srv://ahmedkhavn2005:ahmedkhan@cluster0.l2sc2cj.mongodb.net/?retryWrites=true&w=majority';
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

    // Get all lessons with sorting and searching
    app.get('/collection/lessons', async (req, res) => {
      const { sortBy = 'title', order = 'asc' } = req.query;
      const sortOrder = order === 'asc' ? 1 : -1; // Determine ascending/descending order

      try {
        const lessons = await lessonsCollection
          .find({})
          .sort({ [sortBy]: sortOrder }) // Sort by the selected attribute
          .toArray();
        res.json(lessons);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Failed to fetch lessons' });
      }
    });

    // Search lessons with sorting
    app.get('/search/lessons', async (req, res) => {
      const { q = '', sortBy = 'title', order = 'asc' } = req.query;
      const regex = new RegExp(q, 'i'); // case-insensitive search
      const sortOrder = order === 'asc' ? 1 : -1; // Determine ascending/descending order

      try {
        const lessons = await lessonsCollection
          .find({
            $or: [
              { title: regex },
              { location: regex },
              { price: { $regex: regex } },
              { availableSeats: { $regex: regex } },
              { description: regex },
            ],
          })
          .sort({ [sortBy]: sortOrder }) // Sort by the selected attribute
          .toArray();
        res.json(lessons);
      } catch (error) {
        console.error('Error searching lessons:', error);
        res.status(500).json({ error: 'Failed to search lessons' });
      }
    });

    // Get all orders
    app.get('/collection/orders', async (req, res) => {
      try {
        const orders = await ordersCollection.find({}).toArray();
        res.json(orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
      }
    });

    // Post an order
    app.post('/collection/orders', async (req, res) => {
      try {
        const order = req.body;

        // Validate required fields
        if (
          !order.fullName ||
          !order.phoneNumber ||
          !order.lessons ||
          order.lessons.length === 0
        ) {
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

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

run().catch(console.dir);
