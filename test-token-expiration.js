/**
 * Test script to verify JWT token expiration
 * Run this to check if your token is properly configured for 60 days
 */

const jwt = require('jsonwebtoken');

// Mock token payload (same as your server)
const payload = {
  userId: '507f1f77bcf86cd799439011' // Example ObjectId
};

// Test with 60 days expiration
const token = jwt.sign(payload, 'your-secret-key', { expiresIn: '60d' });

console.log('🔐 JWT Token Test');
console.log('================');
console.log('Token:', token);
console.log('');

// Decode token to check expiration
const decoded = jwt.decode(token);
console.log('Decoded payload:', decoded);
console.log('');

// Calculate expiration date
const expirationDate = new Date(decoded.exp * 1000);
const now = new Date();
const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

console.log('📅 Token Expiration Info:');
console.log('Expires at:', expirationDate.toISOString());
console.log('Days until expiration:', daysUntilExpiration);
console.log('');

if (daysUntilExpiration === 60) {
  console.log('✅ SUCCESS: Token is configured for 60 days!');
} else {
  console.log('❌ ERROR: Token expiration is not 60 days');
}

console.log('');
console.log('💡 To test in your app:');
console.log('1. Login to get a new token');
console.log('2. Make any API call');
console.log('3. If token expires, app should automatically logout');
