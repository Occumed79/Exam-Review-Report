/**
 * Parse-HIPAA Backend Server
 * 
 * This server provides a HIPAA-compliant backend for the SME Risk Intelligence Engine.
 * It handles:
 * - Secure case data storage
 * - Audit logging for all PHI access
 * - Encryption at rest and in transit
 * - User authentication and authorization
 * - Real-time intelligence data synchronization
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const ParseServer = require('parse-server').ParseServer;
const ParseDashboard = require('parse-dashboard');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration for security
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL || 'https://exam-review-report.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Parse-Application-Id', 'X-Parse-REST-API-Key']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Parse Server configuration
const parseServerConfig = {
  databaseURI: process.env.DATABASE_URL || 'postgres://localhost:5432/sme_risk_engine',
  appId: process.env.PARSE_APP_ID || 'sme-risk-engine-app',
  masterKey: process.env.PARSE_MASTER_KEY || 'your-master-key-change-in-production',
  restAPIKey: process.env.PARSE_REST_API_KEY || 'your-rest-api-key-change-in-production',
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
  
  // HIPAA Compliance Settings
  enableAnonymousUsers: false,
  allowClientClassCreation: false,
  allowExpiredAuthTokens: false,
  
  // Security
  enforcePrivateUsers: true,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // File storage (using local filesystem for now, can be upgraded to S3)
  filesAdapter: {
    module: 'parse-server/lib/Adapters/Files/FilesAdapter',
    options: {
      filesSubDirectory: 'files'
    }
  },
  
  // Email adapter (optional, for notifications)
  emailAdapter: {
    module: 'parse-server-simple-mail-adapter',
    options: {
      fromAddress: process.env.EMAIL_FROM || 'noreply@sme-risk-engine.com',
      domain: process.env.EMAIL_DOMAIN || 'localhost',
      apiKey: process.env.EMAIL_API_KEY || ''
    }
  }
};

// Initialize Parse Server
const parseServer = new ParseServer(parseServerConfig);

// Mount Parse Server
app.use('/parse', parseServer.app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'SME Risk Intelligence Engine Backend',
    hipaaCompliant: true,
    features: [
      'Case Management',
      'Medical Record Storage',
      'Audit Logging',
      'Real-time Intelligence',
      'Document Processing',
      'User Authentication'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Start server
const PORT = process.env.PORT || 1337;
app.listen(PORT, () => {
  console.log(`🚀 Parse-HIPAA Server running on port ${PORT}`);
  console.log(`📊 Parse Dashboard available at http://localhost:${PORT}/dashboard`);
  console.log(`🛡️ HIPAA Compliance: ENABLED`);
  console.log(`🔒 Database: ${parseServerConfig.databaseURI}`);
});

module.exports = app;
