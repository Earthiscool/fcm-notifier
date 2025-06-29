const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post('/notify', async (req, res) => {
  const { title, url } = req.body;
  if (!title || !url) return res.status(400).send('Missing title or url');

  try {
    const response = await admin.messaging().send({
      notification: {
        title: `📝 New Blog: ${title}`,
        body: 'Click to read it now!',
      },
      webpush: {
        fcmOptions: {
          link: url,
        },
      },
      topic: 'allUsers',
    });

    res.send('Notification sent: ' + response);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending notification: ' + error.message);
  }
});

app.get("/", (req, res) => res.send("Notification API is running."));

app.listen(3000, () => console.log("Server is running on port 3000"));
