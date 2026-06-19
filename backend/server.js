const express = require('express');
const app = express();

app.get('/', (req, res) => res.json({ ok: true, time: Date.now() }));
app.get('/health', (req, res) => res.json({ status: 'up' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server on port', PORT));