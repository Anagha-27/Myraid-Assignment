const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic request logging (helpful for the "collect application logs" requirement)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory data for the demo API
const quotes = [
  "Simplicity is the soul of efficiency.",
  "First, solve the problem. Then, write the code.",
  "Code is like humor. When you have to explain it, it's bad.",
  "Deployed is better than perfect.",
  "Automate everything you do more than once."
];

// Health check endpoint — useful for CloudWatch / load balancer checks
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Demo API endpoint the frontend calls
app.get('/api/quote', (req, res) => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  res.json({ quote, servedAt: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
