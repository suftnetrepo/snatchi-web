const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function getDecryptedServiceAccount() {
  const filePath = path.join(process.cwd(), 'app/api/data/serviceAccount.json.enc');
  const encrypted = fs.readFileSync(filePath, 'utf8');

  console.log('Encrypted data length:', process.env.GOOGLE_SERVICE_ACCOUNT_IV);
  console.log('Using KEY and IV from environment variables', process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  const key = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64');
  const iv = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_IV, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  const serviceAccount = JSON.parse(decrypted);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  return serviceAccount;
}

module.exports = { getDecryptedServiceAccount };
