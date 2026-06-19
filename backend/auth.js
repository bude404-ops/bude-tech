const crypto = require('crypto');
const users = new Map();

function hash(p) { return crypto.createHash('sha256').update(p).digest('hex'); }

module.exports = {
  login: (u, p) => { const user = users.get(u); return user && user.pw === hash(p); },
  register: (u, p) => { if (users.has(u)) return false; users.set(u, { pw: hash(p), created: Date.now() }); return true; }
};