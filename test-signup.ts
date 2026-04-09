import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890'
      })
    });
    const text = await res.text();
    console.log('Response:', text.substring(0, 100)); // Log first 100 chars
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
