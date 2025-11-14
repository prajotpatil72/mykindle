import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_DIR = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

const command = `mongodump --uri="${MONGODB_URI}" --out="${BACKUP_DIR}/backup-${timestamp}"`;

console.log('🔄 Starting database backup...');

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Backup failed:', error);
    return;
  }
  console.log('✅ Backup completed successfully');
  console.log(`📁 Location: ${BACKUP_DIR}/backup-${timestamp}`);
});