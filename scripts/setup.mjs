// Run with: npm run setup
// Creates server/.env from the example and fills in fresh random JWT secrets.
import fs from 'fs';
import crypto from 'crypto';

const example = new URL('../server/.env.example', import.meta.url);
const target = new URL('../server/.env', import.meta.url);

if (fs.existsSync(target)) {
  console.log('server/.env already exists - leaving it untouched.');
} else {
  const rand = () => crypto.randomBytes(48).toString('hex');
  const text = fs.readFileSync(example, 'utf8')
    .replace('JWT_SECRET=change_me_access_secret', `JWT_SECRET=${rand()}`)
    .replace('JWT_REFRESH_SECRET=change_me_refresh_secret', `JWT_REFRESH_SECRET=${rand()}`);
  fs.writeFileSync(target, text);
  console.log('Created server/.env with generated JWT secrets.');
}
console.log('Next: make sure MONGODB_URI in server/.env points at your MongoDB, then run:  npm run seed  &&  npm run dev');
