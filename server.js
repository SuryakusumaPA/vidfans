const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;

// In-memory "database" (for demo only)
const users = [];
const videos = [
  { id: 1, title: "Video 1", price: 10 },
  { id: 2, title: "Video 2", price: 15 },
  { id: 3, title: "Video 3", price: 20 },
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

// Routes

// Register (for demo, simple form)
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'User  already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ id: users.length + 1, username, password: hashedPassword });
  res.json({ message: 'User  registered' });
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

// Add a video (selling)
app.post('/api/videos', requireLogin, (req, res) => {
  const { title, price } = req.body;
  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price required' });
  }
  const newVideo = {
    id: videos.length + 1,
    title,
    price: Number(price),
  };
  videos.push(newVideo);
  res.json(newVideo);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
