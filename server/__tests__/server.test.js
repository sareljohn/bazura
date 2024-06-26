import request from 'supertest';
import app from '../server.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Test from 'supertest/lib/test.js';

// Mock bcrypt.hash to immediately resolve
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation((data, salt, callback) => {
    callback(null, 'hashedPassword');
  }),
}));


const mockQuery = jest.fn().mockImplementation((sql, values, callback) => {
  if (sql.startsWith("SELECT")) {
    callback(null, [{ foodID: 1, foodName: "Food 1", foodDesc: "Description 1", category: "Category 1", price: 10.99 }]);
  } else if (sql.startsWith("INSERT")) {
    callback(null, { insertId: 1 });
  } else if (sql.startsWith("UPDATE")) {
    // Assuming update is successful
    callback(null, { affectedRows: 1 });
  } else if (sql.startsWith("DELETE")) {
    // Assuming delete is successful
    callback(null, { affectedRows: 1 });
  } else {
    callback(new Error("Invalid SQL query"));
  }
});


jest.mock('mysql', () => ({
  createConnection: jest.fn(() => ({
    query: mockQuery
  })),
}));


////////////////// fetch meals //////////////////////
describe('GET /meals', () => {
  test('responds with a JSON object containing meal data', async () => {
    const response = await request(app)
      .get('/meals')
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('meals');
    expect(Array.isArray(response.body.meals)).toBe(true);
  });
});


////////////////// authentication test cases //////////////////////
describe('verifyUser middleware', () => {
  test('throws an error if no token is present', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(401);
    expect(response.body.Error).toBe('Authentication error: Token missing');
  });

  test('throws an error if the token is invalid', async () => {
      const token = 'invalid_token';
      const response = await request(app)
        .get('/')
        .set('Cookie', [`token=${token}`]);
      expect(response.statusCode).toBe(401);
      expect(response.body.Error).toBe('Authentication error: Invalid token');
  });

  test('returns the username if the token is valid', async () => {
    const token = jwt.sign({ username: 'testuser' }, 'jwtKey', { expiresIn: '1d' });
    const response = await request(app)
      .get('/')
      .set('Cookie', [`token=${token}`]);
    expect(response.statusCode).toBe(200);
    expect(response.body.Status).toBe('Success');
    expect(response.body.username).toBe('testuser');
  });
});



