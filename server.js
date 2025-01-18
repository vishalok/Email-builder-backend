// server.js - Backend for Email Builder
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const cors = require('cors');
app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Storage configuration for Multer (Image Uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Serve the layout HTML
app.get('/getEmailLayout', (req, res) => {
  const layoutPath = path.join(__dirname, 'layout.html');
  fs.readFile(layoutPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading layout file:', err);
      return res.status(500).send('Error reading layout file');
    }
    res.send(data);
  });
});

// Handle image uploads
app.post('/uploadImage', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Handle email configuration upload
app.post('/uploadEmailConfig', (req, res) => {
  const emailConfig = req.body;
  const configPath = path.join(__dirname, 'emailConfig.json');

  fs.writeFile(configPath, JSON.stringify(emailConfig, null, 2), (err) => {
    if (err) {
      console.error('Error saving configuration:', err);
      return res.status(500).send('Error saving configuration');
    }
    res.send('Configuration saved successfully');
  });
});

// Render and download the final email template
app.post('/renderAndDownloadTemplate', (req, res) => {
  const emailConfig = req.body;
  const layoutPath = path.join(__dirname, 'layout.html');

  fs.readFile(layoutPath, 'utf8', (err, layoutHtml) => {
    if (err) {
      console.error('Error reading layout file:', err);
      return res.status(500).send('Error reading layout file');
    }

    // Replace placeholders with actual values
    let renderedHtml = layoutHtml;
    renderedHtml = renderedHtml.replace('{{title}}', emailConfig.title || '');
    renderedHtml = renderedHtml.replace('{{content}}', emailConfig.content || '');
    renderedHtml = renderedHtml.replace('{{imageUrl}}', emailConfig.imageUrl || '');

    // Send rendered HTML as download
    res.setHeader('Content-Disposition', 'attachment; filename="renderedTemplate.html"');
    res.send(renderedHtml);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
