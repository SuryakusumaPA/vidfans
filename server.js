const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// In-memory "database" (for demo only)
const users = [];
const videos = [
  { id: 1, title: "Video 1", price: 10, filename: null },
  { id: 2, title: "Video 2", price: 15, filename: null },
  { id: 3, title: "Video 3", price: 20, filename: null },
];

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
}));
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// === Multer Config (for video upload) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Routes

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ id: users.length + 1, username, password: hashedPassword });
  res.json({ message: 'User registered' });
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ message: 'Logged in' });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// Get current user info
app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.json(null);
  }
  res.json({ id: req.session.userId, username: req.session.username });
});

// Get videos
app.get('/api/videos', (req, res) => {
  res.json(videos);
});

// Add a video (with file upload)
app.post('/api/videos', requireLogin, upload.single('videoFile'), (req, res) => {
  const { title, price } = req.body;
  if (!title || !price || !req.file) {
    return res.status(400).json({ error: 'Title, price, and video file required' });
  }

  const newVideo = {
    id: videos.length + 1,
    title,
    price: Number(price),
    filename: req.file.filename
  };

  videos.push(newVideo);
  res.json(newVideo);
});

// Delete a video
app.delete('/api/videos/:id', requireLogin, (req, res) => {
  const videoId = Number(req.params.id);
  const index = videos.findIndex(v => v.id === videoId);
  if (index === -1) return res.status(404).json({ error: 'Video not found' });

  // hapus file dari uploads/
  if (videos[index].filename) {
    const filePath = path.join(__dirname, 'uploads', videos[index].filename);
    fs.unlink(filePath, err => {
      if (err) console.error("Failed to delete file:", err.message);
    });
  }

  videos.splice(index, 1);
  res.json({ message: 'Video deleted' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
