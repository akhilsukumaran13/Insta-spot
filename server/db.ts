import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve('instaspot.db');
console.log(`Opening database at ${dbPath}`);
let db: any;
try {
  db = new Database(dbPath);
  console.log('Database opened successfully');
} catch (err) {
  console.error('Failed to open database:', err);
  process.exit(1);
}

export function initializeDatabase() {
  console.log('Running database initialization...');
  try {
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'customer' -- 'admin' or 'customer'
      )
    `);

    // Parking Lots table
    db.exec(`
      CREATE TABLE IF NOT EXISTS parking_lots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        price_per_hour REAL NOT NULL,
        total_slots INTEGER NOT NULL,
        created_by INTEGER,
        description TEXT,
        layout TEXT, -- JSON string for layout
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Migration for existing lots
    try {
      db.prepare('SELECT layout FROM parking_lots LIMIT 1').get();
    } catch (error) {
      try {
          db.exec('ALTER TABLE parking_lots ADD COLUMN layout TEXT');
      } catch(e) { /* ignore */ }
    }

    // Bookings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        lot_id INTEGER NOT NULL,
        slot_number INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        total_price REAL,
        payment_id TEXT,
        vehicle_number TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (lot_id) REFERENCES parking_lots(id)
      )
    `);

    // Check if vehicle_number exists in bookings (migration for existing db)
    try {
      db.prepare('SELECT vehicle_number FROM bookings LIMIT 1').get();
    } catch (error) {
      try {
          db.exec('ALTER TABLE bookings ADD COLUMN vehicle_number TEXT');
      } catch(e) { /* ignore */ }
    }

    // Seed Admin User
    const adminEmail = 'adinathrajesh6@gmail.com';
    const adminPass = '1234567809';
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
    if (!user) {
      const hashedPassword = bcrypt.hashSync(adminPass, 10);
      db.prepare(`
        INSERT INTO users (name, email, password, phone, role)
        VALUES (?, ?, ?, ?, ?)
      `).run('Admin', adminEmail, hashedPassword, '0000000000', 'admin');
      console.log('Admin user seeded');
    }
    
    console.log('Database initialized');
  } catch (error: any) {
    console.error('Database initialization failed:', error);
    if (error.code === 'SQLITE_CORRUPT') {
      console.error('CRITICAL: Database file is corrupted.');
      try {
        db.close();
        
        // Delete the corrupted database file
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.error(`Deleted corrupted database: ${dbPath}`);
        }

        // Also delete WAL and SHM files if they exist
        const walPath = `${dbPath}-wal`;
        const shmPath = `${dbPath}-shm`;
        
        if (fs.existsSync(walPath)) {
            fs.unlinkSync(walPath);
            console.error(`Deleted WAL file: ${walPath}`);
        }
        
        if (fs.existsSync(shmPath)) {
            fs.unlinkSync(shmPath);
            console.error(`Deleted SHM file: ${shmPath}`);
        }

        console.error('Please restart the server to create a fresh database.');
        process.exit(1);
      } catch (e) {
        console.error('Failed to cleanup corrupted database:', e);
      }
    }
    throw error;
  }
}

export default db;
