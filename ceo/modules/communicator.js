const https = require('https');

class Communicator {
  constructor() {
    this.key = process.env.OPENROUTER_API_KEY;
  }
  async checkAPI() {
    if (!this.key) return false;
    return new Promise(r => {
      const req = https.request({
        hostname: 'openrouter.ai',
        path: '/api/v1/auth/key',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + this.key },
        timeout: 5000
      }, res => r(res.statusCode === 200));
      req.on('error', () => r(false));
      req.on('timeout', () => { req.destroy(); r(false); });
      req.end();
    });
  }
}

module.exports = Communicator;