import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const backupPath = process.argv[2];

if (!backupPath) {
  console.error('❌ Please provide backup path: npm run restore <backup-path>');
  process.exit(1);
}

const command = `mongorestore --uri="${MONGODB_URI}" "${backupPath}" --drop`;

console.log('🔄 Starting database restore...');

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Restore failed:', error);
    return;
  }
  console.log('✅ Restore completed successfully');
});