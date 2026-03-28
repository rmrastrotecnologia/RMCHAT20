-- D1 Database Schema for RM Boot
-- Execute with: wrangler d1 execute rmboot --local --file=./src/database/schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  profile TEXT DEFAULT 'agent',
  companyId INTEGER NOT NULL,
  online BOOLEAN DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id)
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  planId INTEGER,
  subscriptionId TEXT,
  status TEXT DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Queues table
CREATE TABLE IF NOT EXISTS queues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  companyId INTEGER NOT NULL,
  color TEXT,
  greetingMessage TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id)
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  email TEXT,
  companyId INTEGER NOT NULL,
  profilePicUrl TEXT,
  acceptAudioMessage BOOLEAN DEFAULT 0,
  acceptAudioMessageGroupsIds TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id),
  UNIQUE(number, companyId)
);

-- WhatsApp Sessions table
CREATE TABLE IF NOT EXISTS whatsapps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  token TEXT NOT NULL,
  status TEXT DEFAULT 'qr',
  qrcode TEXT,
  companyId INTEGER NOT NULL,
  userId INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE,
  status TEXT DEFAULT 'open',
  contactId INTEGER NOT NULL,
  userId INTEGER,
  whatsappId INTEGER,
  companyId INTEGER NOT NULL,
  queueId INTEGER,
  lastMessage TEXT,
  lastMessageTime DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contactId) REFERENCES contacts(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (whatsappId) REFERENCES whatsapps(id),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (queueId) REFERENCES queues(id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE,
  ticketId INTEGER NOT NULL,
  contactId INTEGER NOT NULL,
  body TEXT,
  fromMe BOOLEAN DEFAULT 0,
  mediaType TEXT,
  mediaUrl TEXT,
  status TEXT DEFAULT 'sent',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticketId) REFERENCES tickets(id),
  FOREIGN KEY (contactId) REFERENCES contacts(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_companyId ON users(companyId);
CREATE INDEX IF NOT EXISTS idx_contacts_companyId ON contacts(companyId);
CREATE INDEX IF NOT EXISTS idx_whatsapps_companyId ON whatsapps(companyId);
CREATE INDEX IF NOT EXISTS idx_tickets_companyId ON tickets(companyId);
CREATE INDEX IF NOT EXISTS idx_tickets_userId ON tickets(userId);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_messages_ticketId ON messages(ticketId);
CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt);
