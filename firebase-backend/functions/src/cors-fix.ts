import cors from 'cors';

export const corsConfig = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://souk-el-syarat.web.app',
      'https://souk-el-syarat.firebaseapp.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || '*');
    } else {
      callback(null, false);
    }
  },
  credentials: true, // THIS FIXES THE CORS CREDENTIALS ISSUE
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Total-Count']
});
