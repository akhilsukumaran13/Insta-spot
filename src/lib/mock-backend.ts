import { v4 as uuidv4 } from 'uuid';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'admin' | 'customer';
}

interface Lot {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_hour: number;
  total_slots: number;
  created_by: number;
  description?: string;
  layout?: any[];
  available_slots?: number;
  bookedSlots?: number[];
}

interface Booking {
  id: number;
  user_id: number;
  lot_id: number;
  slot_number: number;
  start_time: string;
  end_time: string;
  status: 'active' | 'cancelled' | 'completed';
  total_price: number;
  payment_id?: string;
  vehicle_number?: string;
  lot_name?: string;
  address?: string;
  user_name?: string;
}

// Initial Data
const INITIAL_LOTS: Lot[] = [
  {
    id: 1,
    name: "Connaught Place Parking",
    address: "Connaught Place, New Delhi",
    latitude: 28.6304,
    longitude: 77.2177,
    price_per_hour: 50,
    total_slots: 20,
    created_by: 1,
    description: "Central parking location",
    // Simple grid layout for demo
    layout: Array.from({ length: 20 }).map((_, i) => ({
        id: `slot-${i+1}`,
        type: 'slot',
        x: (i % 5) * 60 + 50,
        y: Math.floor(i / 5) * 100 + 50,
        width: 50,
        height: 80,
        rotation: 0,
        label: (i + 1).toString()
    })),
    available_slots: 15,
    bookedSlots: [1, 2, 3, 4, 5]
  },
  {
    id: 2,
    name: "Mall of India Parking",
    address: "Sector 18, Noida",
    latitude: 28.5677,
    longitude: 77.3259,
    price_per_hour: 40,
    total_slots: 50,
    created_by: 1,
    description: "Shopping mall parking",
    // Simple grid layout for demo
    layout: Array.from({ length: 50 }).map((_, i) => ({
        id: `slot-${i+1}`,
        type: 'slot',
        x: (i % 8) * 60 + 50,
        y: Math.floor(i / 8) * 100 + 50,
        width: 50,
        height: 80,
        rotation: 0,
        label: (i + 1).toString()
    })),
    available_slots: 45,
    bookedSlots: [10, 11, 12, 13, 14]
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// LocalStorage Keys
const KEYS = {
  USERS: 'instaspot_users',
  LOTS: 'instaspot_lots',
  BOOKINGS: 'instaspot_bookings',
  CURRENT_USER: 'instaspot_current_user'
};

// Mock Backend Implementation
class MockBackend {
  private getUsers(): User[] {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  }

  private getLots(): Lot[] {
    const lots = JSON.parse(localStorage.getItem(KEYS.LOTS) || 'null');
    if (!lots) {
      localStorage.setItem(KEYS.LOTS, JSON.stringify(INITIAL_LOTS));
      return INITIAL_LOTS;
    }
    return lots;
  }

  private getBookings(): Booking[] {
    return JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]');
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }

  private saveLots(lots: Lot[]) {
    localStorage.setItem(KEYS.LOTS, JSON.stringify(lots));
  }

  private saveBookings(bookings: Booking[]) {
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
  }

  // API Handlers
  async handleRequest(method: string, endpoint: string, body?: any): Promise<any> {
    await delay(500); // Simulate network latency

    console.log(`[Mock API] ${method} ${endpoint}`, body);

    // --- AUTH ---
    if (endpoint === '/api/auth/login' && method === 'POST') {
      const users = this.getUsers();
      const user = users.find(u => u.email === body.email && u.password === body.password);
      
      // Admin backdoor for demo
      if (body.email === 'adinathrajesh6@gmail.com' && body.password === '1234567809') {
        const admin = { id: 999, name: 'Admin User', email: 'adinathrajesh6@gmail.com', role: 'admin' as const };
        return { token: 'mock-jwt-token', user: admin };
      }

      if (!user) throw new Error('Invalid credentials');
      const { password, ...userWithoutPass } = user;
      return { token: 'mock-jwt-token', user: userWithoutPass };
    }

    if (endpoint === '/api/auth/signup' && method === 'POST') {
      const users = this.getUsers();
      if (users.find(u => u.email === body.email)) throw new Error('Email already exists');
      
      const newUser = { ...body, id: Date.now() };
      users.push(newUser);
      this.saveUsers(users);
      
      const { password, ...userWithoutPass } = newUser;
      return { token: 'mock-jwt-token', user: userWithoutPass };
    }

    // --- LOTS ---
    if (endpoint === '/api/lots' && method === 'GET') {
      const lots = this.getLots();
      const bookings = this.getBookings();
      
      // Calculate available slots dynamically
      return lots.map(lot => {
        const activeBookings = bookings.filter(b => b.lot_id === lot.id && b.status === 'active');
        return {
          ...lot,
          available_slots: lot.total_slots - activeBookings.length
        };
      });
    }

    if (endpoint === '/api/lots' && method === 'POST') {
      const lots = this.getLots();
      const newLot = { ...body, id: Date.now() };
      lots.push(newLot);
      this.saveLots(lots);
      return newLot;
    }

    // Delete Lot
    if (endpoint.startsWith('/api/lots/') && method === 'DELETE') {
        // Extract ID from the end of the URL
        const parts = endpoint.split('/');
        const lotId = parseInt(parts[parts.length - 1]);
        
        if (isNaN(lotId)) throw new Error('Invalid Lot ID');

        let lots = this.getLots();
        const initialLength = lots.length;
        lots = lots.filter(l => l.id !== lotId);
        
        if (lots.length === initialLength) throw new Error('Lot not found');
        
        this.saveLots(lots);
        return { success: true };
    }

    // Match /api/lots/:id
    const lotMatch = endpoint.match(/\/api\/lots\/(\d+)/);
    if (lotMatch && method === 'GET') {
      const id = parseInt(lotMatch[1]);
      const lots = this.getLots();
      const lot = lots.find(l => l.id === id);
      if (!lot) throw new Error('Lot not found');

      const bookings = this.getBookings();
      const activeBookings = bookings.filter(b => b.lot_id === id && b.status === 'active');
      const bookedSlots = activeBookings.map(b => b.slot_number);

      return { ...lot, bookedSlots };
    }

    // --- BOOKINGS ---
    if (endpoint === '/api/bookings' && method === 'POST') {
      const bookings = this.getBookings();
      const lots = this.getLots();
      const lot = lots.find(l => l.id === body.lot_id);
      
      // Check if slot is taken
      const isTaken = bookings.some(b => 
        b.lot_id === body.lot_id && 
        b.slot_number === body.slot_number && 
        b.status === 'active'
      );

      if (isTaken) throw new Error('Slot already booked');

      const newBooking: Booking = {
        id: Date.now(),
        ...body,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + body.duration_hours * 60 * 60 * 1000).toISOString(),
        status: 'active',
        total_price: (lot?.price_per_hour || 0) * body.duration_hours,
        lot_name: lot?.name,
        address: lot?.address
      };

      bookings.push(newBooking);
      this.saveBookings(bookings);
      return newBooking;
    }

    if (endpoint.startsWith('/api/bookings/user/') && method === 'GET') {
      const userId = parseInt(endpoint.split('/').pop()!);
      const bookings = this.getBookings();
      return bookings.filter(b => b.user_id === userId).sort((a, b) => b.id - a.id);
    }

    if (endpoint === '/api/bookings/all' && method === 'GET') {
      const bookings = this.getBookings();
      const users = this.getUsers();
      return bookings.map(b => ({
        ...b,
        user_name: users.find(u => u.id === b.user_id)?.name || 'Unknown User'
      })).sort((a, b) => b.id - a.id);
    }

    // Cancel Booking
    if (endpoint.includes('/cancel') && method === 'PATCH') {
      // Extract ID more robustly
      const parts = endpoint.split('/');
      // Find the part before 'cancel'
      const cancelIndex = parts.indexOf('cancel');
      if (cancelIndex === -1 || cancelIndex === 0) throw new Error('Invalid endpoint format');
      
      const bookingId = parseInt(parts[cancelIndex - 1]);
      if (isNaN(bookingId)) throw new Error('Invalid Booking ID');

      const bookings = this.getBookings();
      const bookingIndex = bookings.findIndex(b => b.id === bookingId);
      
      if (bookingIndex !== -1) {
        bookings[bookingIndex].status = 'cancelled';
        this.saveBookings(bookings);
        return bookings[bookingIndex];
      }
      throw new Error('Booking not found');
    }

    // --- AI ---
    if (endpoint.includes('/api/ai/')) {
      return {
        analysis: "This location has high traffic potential due to nearby commercial centers. Estimated occupancy rate: 85%.",
        price: 60,
        reasoning: "High demand area with limited parking options nearby."
      };
    }

    throw new Error(`Endpoint not mocked: ${endpoint}`);
  }
}

export const mockBackend = new MockBackend();
