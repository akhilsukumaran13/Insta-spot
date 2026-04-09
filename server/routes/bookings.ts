import express from 'express';
import db from '../db';

const router = express.Router();

// Create booking
router.post('/', (req, res) => {
  const { user_id, lot_id, slot_number, duration_hours, payment_id, vehicle_number } = req.body;
  
  try {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration_hours * 60 * 60 * 1000);
    
    // Calculate price (fetch from lot)
    const lotStmt = db.prepare('SELECT price_per_hour FROM parking_lots WHERE id = ?');
    const lot = lotStmt.get(lot_id) as any;
    
    if (!lot) return res.status(404).json({ error: 'Lot not found' });
    
    const totalPrice = lot.price_per_hour * duration_hours;

    const stmt = db.prepare(`
      INSERT INTO bookings (user_id, lot_id, slot_number, start_time, end_time, status, total_price, payment_id, vehicle_number)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `);
    
    const info = stmt.run(user_id, lot_id, slot_number, startTime.toISOString(), endTime.toISOString(), totalPrice, payment_id, vehicle_number);
    
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Get all bookings (Admin)
router.get('/all', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT b.*, p.name as lot_name, u.name as user_name, u.email as user_email
      FROM bookings b
      JOIN parking_lots p ON b.lot_id = p.id
      JOIN users u ON b.user_id = u.id
      ORDER BY b.start_time DESC
    `);
    const bookings = stmt.all();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all bookings' });
  }
});

// Get user bookings
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  try {
    const stmt = db.prepare(`
      SELECT b.*, p.name as lot_name, p.address 
      FROM bookings b
      JOIN parking_lots p ON b.lot_id = p.id
      WHERE b.user_id = ?
      ORDER BY b.start_time DESC
    `);
    const bookings = stmt.all(userId);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Cancel booking
router.patch('/:id/cancel', (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?");
        const info = stmt.run(id);
        if (info.changes > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

export default router;
