const express = require('express');
const cors = require('cors');
const shortid = require('shortid');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Atlas Connection URL (replace <db_password> with your password)
const uri = 'mongodb+srv://hritikpawardev:pawar2700@bookkeeper.hv4oh.mongodb.net/?retryWrites=true&w=majority&appName=BookKeeper';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Database and Collection Name
const dbName = 'TrimLink';
const collectionName = 'urls';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

connectToDatabase();

// Shorten URL API
app.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;

    // Generate short URL using your custom domain
    const shortUrl = `https://trimlink.onrender.com/${shortid.generate()}`;

    try {
        const database = client.db(dbName);
        const urlsCollection = database.collection(collectionName);

        // Insert the new shortened URL into the database
        const result = await urlsCollection.insertOne({
            originalUrl,
            shortUrl,
            date: new Date(),
        });

        res.json({ shortUrl });
    } catch (error) {
        console.error('Error inserting into database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Redirect to the original URL
app.get('/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;

    try {
        const database = client.db(dbName);
        const urlsCollection = database.collection(collectionName);

        // Find the original URL corresponding to the short URL
        const urlDoc = await urlsCollection.findOne({ shortUrl: `https://trimlink.onrender.com/${shortUrl}` });

        if (urlDoc) {
            res.redirect(urlDoc.originalUrl);
        } else {
            res.status(404).json('URL not found');
        }
    } catch (error) {
        console.error('Error finding URL in database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Function to clear the URLs collection
async function clearUrlsCollection() {
    try {
        const database = client.db(dbName);
        const urlsCollection = database.collection(collectionName);

        // Clear the collection
        const result = await urlsCollection.deleteMany({});
        console.log(`Cleared ${result.deletedCount} URLs from the collection.`);
    } catch (error) {
        console.error('Error clearing the collection:', error);
    }
}

// Clear the collection every hour
setInterval(clearUrlsCollection, 60 * 60 * 1000); // 1 hour in milliseconds

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
