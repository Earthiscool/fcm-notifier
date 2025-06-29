const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: ['http://127.0.0.1:5500', 'https://your-deployed-site.com'] }));

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.post('/notify', async (req, res) => {
  console.log('Received request to /notify:', req.method, req.body);
  const { title, url } = req.body;
  if (!title || !url) {
    console.error('Missing title or url');
    return res.status(400).send('Missing title or url');
  }

  try {
    const db = admin.firestore();
    const snapshot = await db.collection('fcmTokens').get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    if (!tokens.length) {
      console.error('No tokens found in Firestore');
      return res.status(400).send('No tokens available.');
    }

    const message = {
      notification: {
        title: `📝 New Blog: ${title}`,
        body: 'Click to read it now!',
      },
      webpush: {
        fcmOptions: {
          link: url,
        },
      },
      tokens, // Send to individual tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Successfully sent message:', response);
    res.status(200).send('Notification sent: ' + response);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Error sending notification: ' + error.message);
  }
});

app.get('/', (req, res) => res.send('Notification API is running.'));

app.get('/notify', (req, res) => {
  console.log('Invalid GET request to /notify');
  res.status(405).send('Method Not Allowed: Use POST for /notify');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));