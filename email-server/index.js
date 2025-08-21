// index.js
const express = require('express');
const cors = require('cors');
const mailgun = require('mailgun-js');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const mg = mailgun({
  apiKey: 'key-08c79601-e57ae218', // Your Mailgun Private API Key
  domain: 'sandboxe144ac4477f34201be81230e59c6281c.mailgun.org' // Your Mailgun Domain
});

app.post('/send-email', (req, res) => {
  const { to, subject, text } = req.body;

  const data = {
    from: 'Inventory Alert <alert@sandboxe144ac4477f34201be81230e59c6281c.mailgun.org>',
    to,
    subject,
    text
  };

  mg.messages().send(data, (error, body) => {
    if (error) {
      console.error("Mailgun Error:", error);
      return res.status(500).send("Email failed to send.");
    }
    res.send("Email sent successfully!");
  });
});

app.listen(PORT, () => {
  console.log(`Email server listening at http://localhost:${PORT}`);
});
