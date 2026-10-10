const app = require('./app');
const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`THALSA Knowledge & AI Assistant Server running on http://localhost:${PORT}`);
});
