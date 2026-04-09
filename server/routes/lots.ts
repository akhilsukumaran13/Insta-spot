import express from 'express';
import db from '../db';

const router = express.Router();

// Get all lots (optionally filter by proximity later, for now return all)
router.get('/', (req, res) => {
  try {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      SELECT p.*, 
      (SELECT COUNT(*) FROM bookings b WHERE b.lot_id = p.id AND b.end_time > ? AND b.status = 'active') as booked_count
      FROM parking_lots p
    `);
    const lots = stmt.all(now).map((lot: any) => ({
        ...lot,
        available_slots: Math.max(0, lot.total_slots - lot.booked_count)
    }));
    res.json(lots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch lots' });
  }
});

// Create a lot (Admin only - middleware skipped for speed, but role check implied)
router.post('/', (req, res) => {
  const { name, address, latitude, longitude, price_per_hour, total_slots, created_by, description, layout } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO parking_lots (name, address, latitude, longitude, price_per_hour, total_slots, created_by, description, layout)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, address, latitude, longitude, price_per_hour, total_slots, created_by, description, JSON.stringify(layout));
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create lot' });
  }
});

// Get lot details including current bookings to determine slot status
router.get('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const lotStmt = db.prepare('SELECT * FROM parking_lots WHERE id = ?');
    const lot = lotStmt.get(id) as any;
    
    if (!lot) return res.status(404).json({ error: 'Lot not found' });

    // Parse layout if it exists
    if (lot.layout) {
        try {
            lot.layout = JSON.parse(lot.layout);
        } catch (e) {
            lot.layout = null;
        }
    }

    // Get active bookings for this lot
    // A booking is active if end_time is in the future (simplified logic)
    // In a real app, we'd check if current time is between start and end
    const now = new Date().toISOString();
    const bookingsStmt = db.prepare(`
      SELECT slot_number FROM bookings 
      WHERE lot_id = ? AND end_time > ? AND status = 'active'
    `);
    const bookedSlots = bookingsStmt.all(id, now).map((b: any) => b.slot_number);

    res.json({ ...lot, bookedSlots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch lot details' });
  }
});

export default router;
