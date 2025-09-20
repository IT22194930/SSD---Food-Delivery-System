const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { register, login, googleAuth } = require('../controllers/authController');

// Mock dependencies
jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());

// Create test routes
app.post('/test-register', register);
app.post('/test-login', login);
app.post('/test-google-auth', googleAuth);

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registration Security', () => {
    test('should reject weak passwords', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '12345', // Weak password
        role: 'customer'
      };

      const response = await request(app)
        .post('/test-register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Password must be at least 6 characters');
    });

    test('should prevent duplicate email registration', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' });

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'validpassword123',
        role: 'customer'
      };

      const response = await request(app)
        .post('/test-register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email already registered');
    });

    test('should hash passwords with high salt rounds', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer'
      });
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedpassword');
      jwt.sign.mockReturnValue('token123');

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'validpassword123',
        role: 'customer'
      };

      await request(app)
        .post('/test-register')
        .send(userData);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
    });
  });

  describe('Login Security', () => {
    test('should reject invalid credentials', async () => {
      User.findOne.mockResolvedValue(null);

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/test-login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should reject wrong password', async () => {
      User.findOne.mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword'
      });
      bcrypt.compare.mockResolvedValue(false);

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/test-login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('OAuth/Google Auth Security', () => {
    test('should validate required Google OAuth fields', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // Missing name
      };

      const response = await request(app)
        .post('/test-google-auth')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Name and email are required');
    });

    test('should handle existing Google users securely', async () => {
      User.findOne.mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
        save: jest.fn()
      });
      jwt.sign.mockReturnValue('token123');

      const googleData = {
        name: 'Test User',
        email: 'test@example.com',
        photoUrl: 'https://example.com/photo.jpg'
      };

      const response = await request(app)
        .post('/test-google-auth')
        .send(googleData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Google login successful');
      expect(response.body.token).toBe('token123');
    });
  });

  describe('JWT Token Security', () => {
    test('should generate valid JWT tokens', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer'
      });
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedpassword');
      jwt.sign.mockReturnValue('valid.jwt.token');

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'validpassword123',
        role: 'customer'
      };

      const response = await request(app)
        .post('/test-register')
        .send(userData);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', role: 'customer' },
        process.env.JWT_SECRET
      );
      expect(response.body.token).toBe('valid.jwt.token');
    });
  });
});
