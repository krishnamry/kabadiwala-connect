import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Try loading native node:sqlite DatabaseSync
let DatabaseSync: any;
try {
  const sqlite = require('node:sqlite');
  DatabaseSync = sqlite.DatabaseSync;
} catch (e) {
  console.error('Node:sqlite not found, falling back to in-memory store');
}

const DB_PATH = process.env.DATABASE_PATH || (fs.existsSync(path.resolve(process.cwd(), 'prisma/dev.db')) ? path.resolve(process.cwd(), 'prisma/dev.db') : path.resolve(__dirname, '../prisma/dev.db'));

class SQLitePrismaClient {
  private db: any;

  constructor() {
    // Ensure dir
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (DatabaseSync) {
      this.db = new DatabaseSync(DB_PATH);
      this.initSchema();
    }
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'CITIZEN',
        password TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS KabadiwalaProfile (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0,
        reputationScore REAL NOT NULL DEFAULT 4.5,
        walletBalance REAL NOT NULL DEFAULT 0,
        latitude REAL,
        longitude REAL,
        vehicleType TEXT DEFAULT 'Cargo Rickshaw',
        aadhaarNumber TEXT DEFAULT 'Verified',
        serviceRadiusKm REAL DEFAULT 5.0,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Pickup (
        id TEXT PRIMARY KEY,
        citizenId TEXT NOT NULL,
        kabadiwalaId TEXT,
        status TEXT NOT NULL DEFAULT 'REQUESTED',
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        scheduledAt TEXT NOT NULL,
        totalAmount REAL,
        notes TEXT,
        completedAt TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (citizenId) REFERENCES User(id),
        FOREIGN KEY (kabadiwalaId) REFERENCES User(id)
      );

      CREATE TABLE IF NOT EXISTS ScrapItem (
        id TEXT PRIMARY KEY,
        pickupId TEXT NOT NULL,
        category TEXT NOT NULL,
        estWeightKg REAL NOT NULL,
        actualWeightKg REAL,
        ratePerKg REAL NOT NULL,
        imageUrl TEXT,
        FOREIGN KEY (pickupId) REFERENCES Pickup(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Transaction" (
        id TEXT PRIMARY KEY,
        pickupId TEXT NOT NULL,
        amount REAL NOT NULL,
        kabadiwalaId TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PAID',
        paymentMethod TEXT DEFAULT 'WALLET_ESCROW',
        createdAt TEXT NOT NULL,
        FOREIGN KEY (pickupId) REFERENCES Pickup(id)
      );

      CREATE TABLE IF NOT EXISTS ScrapRate (
        id TEXT PRIMARY KEY,
        category TEXT UNIQUE NOT NULL,
        ratePerKg REAL NOT NULL,
        unit TEXT NOT NULL DEFAULT 'kg',
        description TEXT NOT NULL,
        badge TEXT,
        icon TEXT,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS RecyclerProfile (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE NOT NULL,
        facilityName TEXT NOT NULL,
        cpcbRegNumber TEXT UNIQUE NOT NULL,
        statePcb TEXT DEFAULT 'Delhi Pollution Control Committee (DPCC)',
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT,
        materialsAccepted TEXT,
        offeredRates TEXT,
        dailyCapacityKg REAL DEFAULT 5000,
        pickupAvailable INTEGER DEFAULT 1,
        verified INTEGER DEFAULT 1,
        rating REAL DEFAULT 4.8,
        totalReviewsCount INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS EWasteLot (
        id TEXT PRIMARY KEY,
        lotCode TEXT UNIQUE NOT NULL,
        collectorId TEXT NOT NULL,
        collectorName TEXT NOT NULL,
        category TEXT NOT NULL,
        approxWeightKg REAL NOT NULL,
        totalItems INTEGER DEFAULT 1,
        estimatedValue REAL NOT NULL,
        askingPrice REAL,
        minBidAmount REAL,
        recyclerOfferedRate REAL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'AVAILABLE',
        highestBid REAL,
        winningBidId TEXT,
        imageUrl TEXT,
        gpsLat REAL NOT NULL,
        gpsLng REAL NOT NULL,
        locationAddress TEXT,
        locationZone TEXT,
        auctionDurationMins INTEGER DEFAULT 60,
        auctionExpiresAt TEXT,
        antiSnipingExtensions INTEGER DEFAULT 0,
        recyclerId TEXT,
        recyclerName TEXT,
        qrCode TEXT,
        traceabilityHash TEXT,
        saleTokenNumber TEXT,
        weighbridgeOperatorId TEXT,
        verifiedAtWeighbridge INTEGER DEFAULT 0,
        actualWeightKg REAL,
        isCustomLot INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        confirmedAt TEXT,
        FOREIGN KEY (collectorId) REFERENCES User(id)
      );

      CREATE TABLE IF NOT EXISTS EWasteLotItem (
        id TEXT PRIMARY KEY,
        lotId TEXT NOT NULL,
        category TEXT NOT NULL,
        weightKg REAL NOT NULL,
        ratePerKg REAL NOT NULL,
        quantity INTEGER DEFAULT 1,
        subtotal REAL,
        FOREIGN KEY (lotId) REFERENCES EWasteLot(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS LotBid (
        id TEXT PRIMARY KEY,
        lotId TEXT NOT NULL,
        recyclerId TEXT NOT NULL,
        recyclerName TEXT NOT NULL,
        bidAmount REAL NOT NULL,
        bidPerKg REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (lotId) REFERENCES EWasteLot(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS SaleToken (
        id TEXT PRIMARY KEY,
        tokenNumber TEXT UNIQUE NOT NULL,
        lotId TEXT UNIQUE NOT NULL,
        collectorId TEXT NOT NULL,
        collectorName TEXT NOT NULL,
        collectorPhone TEXT NOT NULL,
        collectorAadhaarRef TEXT,
        recyclerId TEXT NOT NULL,
        recyclerName TEXT NOT NULL,
        cpcbRegNumber TEXT NOT NULL,
        category TEXT NOT NULL,
        cpcbCategoryCode TEXT DEFAULT 'ITEW2',
        grossWeightKg REAL NOT NULL,
        tareWeightKg REAL NOT NULL,
        netWeightKg REAL NOT NULL,
        ratePerKg REAL NOT NULL,
        totalAmount REAL NOT NULL,
        paymentMode TEXT DEFAULT 'CASH_ON_SPOT',
        weighbridgeGpsLat REAL NOT NULL,
        weighbridgeGpsLng REAL NOT NULL,
        operatorId TEXT,
        sha256Signature TEXT NOT NULL,
        eprCredits REAL NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (lotId) REFERENCES EWasteLot(id)
      );

      CREATE TABLE IF NOT EXISTS Review (
        id TEXT PRIMARY KEY,
        reviewerId TEXT NOT NULL,
        targetUserId TEXT NOT NULL,
        saleTokenId TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING_MUTUAL',
        revealedAt TEXT,
        ratingOverall REAL NOT NULL,
        ratingScaleAcc REAL,
        ratingPayoutSpd REAL,
        ratingPurity REAL,
        reviewText TEXT,
        isVerifiedTrade INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (reviewerId) REFERENCES User(id),
        FOREIGN KEY (targetUserId) REFERENCES User(id)
      );

      CREATE TABLE IF NOT EXISTS ChatMessage (
        id TEXT PRIMARY KEY,
        senderId TEXT NOT NULL,
        receiverId TEXT NOT NULL,
        contextType TEXT NOT NULL,
        contextId TEXT NOT NULL,
        text TEXT,
        audioUrl TEXT,
        imageUrl TEXT,
        isRead INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (senderId) REFERENCES User(id),
        FOREIGN KEY (receiverId) REFERENCES User(id)
      );
    `);

    // Safe column migrations on User table for KYC
    try {
      this.db.exec("ALTER TABLE User ADD COLUMN kycStatus TEXT NOT NULL DEFAULT 'UNVERIFIED'");
    } catch {}
    try {
      this.db.exec("ALTER TABLE User ADD COLUMN kycDocuments TEXT");
    } catch {}
  }

  // 1. User
  user = {
    findUnique: async (params: { where: { phone?: string; id?: string }; include?: any }) => {
      let row: any;
      if (params.where.phone) {
        row = this.db.prepare('SELECT * FROM User WHERE phone = ?').get(params.where.phone);
      } else if (params.where.id) {
        row = this.db.prepare('SELECT * FROM User WHERE id = ?').get(params.where.id);
      }
      if (!row) return null;

      if (params.include?.kabadiwala) {
        const kProfile = this.db.prepare('SELECT * FROM KabadiwalaProfile WHERE userId = ?').get(row.id);
        row.kabadiwala = kProfile ? { ...kProfile, verified: Boolean(kProfile.verified) } : null;
      }
      if (params.include?.recycler) {
        row.recycler = await this.recyclerProfile.findUnique({ where: { userId: row.id } });
      }
      row.kycStatus = row.kycStatus || 'UNVERIFIED';
      try {
        row.kycDocuments = JSON.parse(row.kycDocuments || '{}');
      } catch {
        row.kycDocuments = null;
      }
      return row;
    },

    update: async (params: { where: { id?: string; phone?: string }; data: any; include?: any }) => {
      const updates: string[] = [];
      const args: any[] = [];
      if (params.data.kycStatus !== undefined) {
        updates.push('kycStatus = ?');
        args.push(params.data.kycStatus);
      }
      if (params.data.kycDocuments !== undefined) {
        updates.push('kycDocuments = ?');
        args.push(typeof params.data.kycDocuments === 'object' ? JSON.stringify(params.data.kycDocuments) : params.data.kycDocuments);
      }
      if (params.data.name !== undefined) {
        updates.push('name = ?');
        args.push(params.data.name);
      }
      if (params.data.role !== undefined) {
        updates.push('role = ?');
        args.push(params.data.role);
      }
      if (updates.length > 0) {
        const whereClause = params.where.id ? 'id = ?' : 'phone = ?';
        const whereVal = params.where.id || params.where.phone;
        args.push(whereVal);
        this.db.prepare(`UPDATE User SET ${updates.join(', ')} WHERE ${whereClause}`).run(...args);
      }
      return this.user.findUnique({ where: params.where, include: params.include });
    },

    findMany: async (params?: { where?: any; select?: any }) => {
      let query = 'SELECT * FROM User';
      const args: any[] = [];
      const clauses: string[] = [];

      if (params?.where?.phone?.in) {
        const placeholders = params.where.phone.in.map(() => '?').join(',');
        clauses.push(`phone IN (${placeholders})`);
        args.push(...params.where.phone.in);
      } else if (params?.where?.phone) {
        clauses.push('phone = ?');
        args.push(params.where.phone);
      }

      if (params?.where?.role) {
        clauses.push('role = ?');
        args.push(params.where.role);
      }

      if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
      }

      const rows = this.db.prepare(query).all(...args);

      return rows.map((r: any) => {
        const kProfile = this.db.prepare('SELECT * FROM KabadiwalaProfile WHERE userId = ?').get(r.id);
        const rProfile = this.db.prepare('SELECT * FROM RecyclerProfile WHERE userId = ?').get(r.id);
        return {
          ...r,
          kycStatus: r.kycStatus || 'UNVERIFIED',
          kabadiwala: kProfile ? { ...kProfile, verified: Boolean(kProfile.verified) } : null,
          recycler: rProfile ? { ...rProfile, verified: Boolean(rProfile.verified) } : null
        };
      });
    },

    create: async (params: { data: any; include?: any }) => {
      const id = params.data.id || crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const role = params.data.role || 'CITIZEN';

      this.db.prepare(`
        INSERT INTO User (id, name, phone, role, password, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, params.data.name, params.data.phone, role, params.data.password, createdAt);

      let kabadiwala: any = null;
      if (params.data.kabadiwala?.create) {
        const k = params.data.kabadiwala.create;
        const kId = crypto.randomUUID();
        this.db.prepare(`
          INSERT INTO KabadiwalaProfile (id, userId, verified, reputationScore, walletBalance, latitude, longitude, vehicleType, aadhaarNumber, serviceRadiusKm)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(kId, id, k.verified ? 1 : 0, k.reputationScore ?? 4.5, k.walletBalance ?? 0, k.latitude ?? null, k.longitude ?? null, k.vehicleType || 'Cargo Rickshaw', k.aadhaarNumber || 'Verified', k.serviceRadiusKm ?? 5.0);

        kabadiwala = {
          id: kId,
          userId: id,
          verified: Boolean(k.verified),
          reputationScore: k.reputationScore ?? 4.5,
          walletBalance: k.walletBalance ?? 0,
          latitude: k.latitude ?? null,
          longitude: k.longitude ?? null,
          vehicleType: k.vehicleType || 'Cargo Rickshaw',
          aadhaarNumber: k.aadhaarNumber || 'Verified'
        };
      }

      return {
        id,
        name: params.data.name,
        phone: params.data.phone,
        role,
        password: params.data.password,
        createdAt,
        kabadiwala
      };
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM User');
      return { count: 0 };
    }
  };

  // 2. KabadiwalaProfile
  kabadiwalaProfile = {
    findUnique: async (params: { where: { userId?: string; id?: string }; include?: any }) => {
      let row: any;
      if (params.where.userId) {
        row = this.db.prepare('SELECT * FROM KabadiwalaProfile WHERE userId = ?').get(params.where.userId);
      } else if (params.where.id) {
        row = this.db.prepare('SELECT * FROM KabadiwalaProfile WHERE id = ?').get(params.where.id);
      }
      if (!row) return null;
      row.verified = Boolean(row.verified);

      if (params.include?.user) {
        row.user = this.db.prepare('SELECT id, name, phone, role, createdAt FROM User WHERE id = ?').get(row.userId);
      }
      return row;
    },

    findMany: async (params?: { include?: any; orderBy?: any }) => {
      const rows = this.db.prepare('SELECT * FROM KabadiwalaProfile').all();
      return rows.map(r => {
        const user = this.db.prepare('SELECT id, name, phone, role, createdAt FROM User WHERE id = ?').get(r.userId);
        return {
          ...r,
          verified: Boolean(r.verified),
          user
        };
      });
    },

    update: async (params: { where: { id?: string; userId?: string }; data: any; include?: any }) => {
      const profile = await this.kabadiwalaProfile.findUnique({ where: params.where });
      if (!profile) throw new Error('Kabadiwala profile not found');

      const verified = params.data.verified !== undefined ? (params.data.verified ? 1 : 0) : (profile.verified ? 1 : 0);
      const lat = params.data.latitude !== undefined ? params.data.latitude : profile.latitude;
      const lng = params.data.longitude !== undefined ? params.data.longitude : profile.longitude;

      this.db.prepare(`
        UPDATE KabadiwalaProfile
        SET verified = ?, latitude = ?, longitude = ?
        WHERE id = ?
      `).run(verified, lat, lng, profile.id);

      return this.kabadiwalaProfile.findUnique({ where: { id: profile.id }, include: params.include });
    },

    updateMany: async (params: { where: { userId?: string }; data: any }) => {
      if (params.where.userId && params.data.walletBalance?.increment) {
        this.db.prepare(`
          UPDATE KabadiwalaProfile
          SET walletBalance = walletBalance + ?
          WHERE userId = ?
        `).run(params.data.walletBalance.increment, params.where.userId);
      }
      return { count: 1 };
    },

    count: async (params?: { where?: { verified?: boolean } }) => {
      if (params?.where?.verified !== undefined) {
        const res = this.db.prepare('SELECT COUNT(*) as c FROM KabadiwalaProfile WHERE verified = ?').get(params.where.verified ? 1 : 0);
        return res.c;
      }
      const res = this.db.prepare('SELECT COUNT(*) as c FROM KabadiwalaProfile').get();
      return res.c;
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM KabadiwalaProfile');
      return { count: 0 };
    }
  };

  // 3. Pickup
  pickup = {
    findUnique: async (params: { where: { id: string }; include?: any }) => {
      const row = this.db.prepare('SELECT * FROM Pickup WHERE id = ?').get(params.where.id);
      if (!row) return null;
      return this.enrichPickup(row, params.include);
    },

    findMany: async (params?: { where?: any; include?: any; orderBy?: any }) => {
      let query = 'SELECT * FROM Pickup';
      const args: any[] = [];

      if (params?.where) {
        const clauses: string[] = [];
        if (params.where.status) {
          if (typeof params.where.status === 'string') {
            clauses.push('status = ?');
            args.push(params.where.status);
          } else if (params.where.status.in) {
            const ph = params.where.status.in.map(() => '?').join(',');
            clauses.push(`status IN (${ph})`);
            args.push(...params.where.status.in);
          }
        }
        if (params.where.citizenId) {
          clauses.push('citizenId = ?');
          args.push(params.where.citizenId);
        }
        if (params.where.kabadiwalaId) {
          clauses.push('kabadiwalaId = ?');
          args.push(params.where.kabadiwalaId);
        }
        if (clauses.length > 0) {
          query += ' WHERE ' + clauses.join(' AND ');
        }
      }

      query += ' ORDER BY createdAt DESC';
      const rows = this.db.prepare(query).all(...args);
      return rows.map(r => this.enrichPickup(r, params?.include));
    },

    create: async (params: { data: any; include?: any }) => {
      const id = params.data.id || crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const scheduledAt = new Date(params.data.scheduledAt).toISOString();
      const completedAt = params.data.completedAt ? new Date(params.data.completedAt).toISOString() : null;

      this.db.prepare(`
        INSERT INTO Pickup (id, citizenId, kabadiwalaId, status, address, latitude, longitude, scheduledAt, totalAmount, notes, completedAt, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        params.data.citizenId,
        params.data.kabadiwalaId || null,
        params.data.status || 'REQUESTED',
        params.data.address,
        params.data.latitude,
        params.data.longitude,
        scheduledAt,
        params.data.totalAmount || null,
        params.data.notes || null,
        completedAt,
        createdAt
      );

      if (params.data.items?.create) {
        for (const item of params.data.items.create) {
          const itemId = crypto.randomUUID();
          this.db.prepare(`
            INSERT INTO ScrapItem (id, pickupId, category, estWeightKg, actualWeightKg, ratePerKg, imageUrl)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(itemId, id, item.category, item.estWeightKg, item.actualWeightKg || null, item.ratePerKg, item.imageUrl || null);
        }
      }

      return this.pickup.findUnique({ where: { id }, include: params.include });
    },

    update: async (params: { where: { id: string }; data: any; include?: any }) => {
      const current = this.db.prepare('SELECT * FROM Pickup WHERE id = ?').get(params.where.id);
      if (!current) throw new Error('Pickup not found');

      const status = params.data.status || current.status;
      const kabadiwalaId = params.data.kabadiwalaId !== undefined ? params.data.kabadiwalaId : current.kabadiwalaId;
      const totalAmount = params.data.totalAmount !== undefined ? params.data.totalAmount : current.totalAmount;
      const completedAt = params.data.completedAt ? new Date(params.data.completedAt).toISOString() : current.completedAt;

      this.db.prepare(`
        UPDATE Pickup
        SET status = ?, kabadiwalaId = ?, totalAmount = ?, completedAt = ?
        WHERE id = ?
      `).run(status, kabadiwalaId, totalAmount, completedAt, params.where.id);

      return this.pickup.findUnique({ where: { id: params.where.id }, include: params.include });
    },

    count: async (params?: { where?: any }) => {
      let query = 'SELECT COUNT(*) as c FROM Pickup';
      const args: any[] = [];
      const clauses: string[] = [];

      if (params?.where) {
        if (params.where.status) {
          if (typeof params.where.status === 'string') {
            clauses.push('status = ?');
            args.push(params.where.status);
          } else if (params.where.status.in) {
            const ph = params.where.status.in.map(() => '?').join(',');
            clauses.push(`status IN (${ph})`);
            args.push(...params.where.status.in);
          }
        }
        if (params.where.citizenId) {
          clauses.push('citizenId = ?');
          args.push(params.where.citizenId);
        }
        if (params.where.kabadiwalaId) {
          clauses.push('kabadiwalaId = ?');
          args.push(params.where.kabadiwalaId);
        }
        if (clauses.length > 0) {
          query += ' WHERE ' + clauses.join(' AND ');
        }
      }
      return this.db.prepare(query).get(...args).c;
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM Pickup');
      return { count: 0 };
    }
  };

  private enrichPickup(row: any, include?: any) {
    const p = { ...row };
    // items
    p.items = this.db.prepare('SELECT * FROM ScrapItem WHERE pickupId = ?').all(row.id);

    // citizen
    p.citizen = this.db.prepare('SELECT id, name, phone FROM User WHERE id = ?').get(row.citizenId);

    // kabadiwala
    if (row.kabadiwalaId) {
      const kUser = this.db.prepare('SELECT id, name, phone FROM User WHERE id = ?').get(row.kabadiwalaId);
      if (kUser) {
        const kProfile = this.db.prepare('SELECT * FROM KabadiwalaProfile WHERE userId = ?').get(row.kabadiwalaId);
        p.kabadiwala = {
          ...kUser,
          kabadiwala: kProfile ? { ...kProfile, verified: Boolean(kProfile.verified) } : null
        };
      }
    } else {
      p.kabadiwala = null;
    }

    // transactions
    p.transactions = this.db.prepare('SELECT * FROM "Transaction" WHERE pickupId = ?').all(row.id);

    // Cryptographic verification fields & Handover OTP
    const digitsOnly = p.id.replace(/\D/g, '');
    p.verificationOtp = digitsOnly.length >= 4 ? digitsOnly.slice(-4) : '4821';
    p.traceabilityHash = `0x${crypto.createHash('sha256').update(p.id + (p.completedAt || p.createdAt)).digest('hex').slice(0, 16)}`;
    p.isVerified = p.status === 'COMPLETED';
    p.verifiedAt = p.completedAt || null;

    return p;
  }

  // 4. ScrapItem
  scrapItem = {
    create: async (params: { data: any }) => {
      const id = crypto.randomUUID();
      this.db.prepare(`
        INSERT INTO ScrapItem (id, pickupId, category, estWeightKg, actualWeightKg, ratePerKg, imageUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, params.data.pickupId, params.data.category, params.data.estWeightKg, params.data.actualWeightKg || null, params.data.ratePerKg, params.data.imageUrl || null);
      return { id, ...params.data };
    },

    update: async (params: { where: { id: string }; data: any }) => {
      this.db.prepare(`
        UPDATE ScrapItem SET actualWeightKg = ? WHERE id = ?
      `).run(params.data.actualWeightKg, params.where.id);
      return { id: params.where.id, ...params.data };
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM ScrapItem');
      return { count: 0 };
    }
  };

  // 5. Transaction
  transaction = {
    findMany: async (params?: { where?: any; include?: any; orderBy?: any }) => {
      let query = 'SELECT * FROM "Transaction"';
      const args: any[] = [];
      if (params?.where?.kabadiwalaId) {
        query += ' WHERE kabadiwalaId = ?';
        args.push(params.where.kabadiwalaId);
      }
      query += ' ORDER BY createdAt DESC';
      const rows = this.db.prepare(query).all(...args);

      if (params?.include?.pickup) {
        return Promise.all(rows.map(async (r: any) => ({
          ...r,
          pickup: await this.pickup.findUnique({ where: { id: r.pickupId } })
        })));
      }
      return rows;
    },

    create: async (params: { data: any }) => {
      const id = crypto.randomUUID();
      const createdAt = params.data.createdAt ? new Date(params.data.createdAt).toISOString() : new Date().toISOString();
      this.db.prepare(`
        INSERT INTO "Transaction" (id, pickupId, amount, kabadiwalaId, status, paymentMethod, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, params.data.pickupId, params.data.amount, params.data.kabadiwalaId, params.data.status || 'PAID', params.data.paymentMethod || 'WALLET_ESCROW', createdAt);
      return { id, ...params.data, createdAt };
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM "Transaction"');
      return { count: 0 };
    }
  };

  // 6. ScrapRate
  scrapRate = {
    findMany: async (params?: { orderBy?: any }) => {
      return this.db.prepare('SELECT * FROM ScrapRate ORDER BY ratePerKg DESC').all();
    },

    create: async (params: { data: any }) => {
      const id = crypto.randomUUID();
      const updatedAt = new Date().toISOString();
      this.db.prepare(`
        INSERT INTO ScrapRate (id, category, ratePerKg, unit, description, badge, icon, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, params.data.category, params.data.ratePerKg, params.data.unit || 'kg', params.data.description, params.data.badge || null, params.data.icon || null, updatedAt);
      return { id, ...params.data, updatedAt };
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM ScrapRate');
      return { count: 0 };
    }
  };

  // 7. RecyclerProfile
  recyclerProfile = {
    findUnique: async (params: { where: { userId?: string; id?: string; cpcbRegNumber?: string }; include?: any }) => {
      let row: any;
      if (params.where.userId) {
        row = this.db.prepare('SELECT * FROM RecyclerProfile WHERE userId = ?').get(params.where.userId);
      } else if (params.where.id) {
        row = this.db.prepare('SELECT * FROM RecyclerProfile WHERE id = ?').get(params.where.id);
      } else if (params.where.cpcbRegNumber) {
        row = this.db.prepare('SELECT * FROM RecyclerProfile WHERE cpcbRegNumber = ?').get(params.where.cpcbRegNumber);
      }
      if (!row) return null;
      return this.enrichRecycler(row, params.include);
    },

    findMany: async (params?: { include?: any; orderBy?: any }) => {
      const rows = this.db.prepare('SELECT * FROM RecyclerProfile').all();
      return rows.map((r: any) => this.enrichRecycler(r, params?.include));
    },

    create: async (params: { data: any }) => {
      const id = params.data.id || crypto.randomUUID();
      const offeredRates = typeof params.data.offeredRates === 'object' ? JSON.stringify(params.data.offeredRates) : (params.data.offeredRates || '{}');
      const materialsAccepted = Array.isArray(params.data.materialsAccepted) ? JSON.stringify(params.data.materialsAccepted) : (params.data.materialsAccepted || '[]');

      this.db.prepare(`
        INSERT INTO RecyclerProfile (id, userId, facilityName, cpcbRegNumber, statePcb, latitude, longitude, address, materialsAccepted, offeredRates, dailyCapacityKg, pickupAvailable, verified, rating, totalReviewsCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        params.data.userId,
        params.data.facilityName,
        params.data.cpcbRegNumber,
        params.data.statePcb || 'Delhi Pollution Control Committee (DPCC)',
        params.data.latitude ?? 28.5355,
        params.data.longitude ?? 77.2690,
        params.data.address || 'Plot 42, Okhla Phase-II, New Delhi',
        materialsAccepted,
        offeredRates,
        params.data.dailyCapacityKg ?? 5000,
        params.data.pickupAvailable === false ? 0 : 1,
        params.data.verified === false ? 0 : 1,
        params.data.rating ?? 4.8,
        params.data.totalReviewsCount ?? 0
      );
      return this.recyclerProfile.findUnique({ where: { id } });
    },

    update: async (params: { where: { id?: string; userId?: string }; data: any }) => {
      const updates: string[] = [];
      const args: any[] = [];
      if (params.data.rating !== undefined) {
        updates.push('rating = ?');
        args.push(params.data.rating);
      }
      if (params.data.totalReviewsCount !== undefined) {
        updates.push('totalReviewsCount = ?');
        args.push(params.data.totalReviewsCount);
      }
      if (params.data.offeredRates !== undefined) {
        updates.push('offeredRates = ?');
        args.push(typeof params.data.offeredRates === 'object' ? JSON.stringify(params.data.offeredRates) : params.data.offeredRates);
      }
      if (params.data.verified !== undefined) {
        updates.push('verified = ?');
        args.push(params.data.verified ? 1 : 0);
      }
      if (updates.length > 0) {
        let whereClause = 'id = ?';
        let whereVal = params.where.id;
        if (params.where.userId) {
          whereClause = 'userId = ?';
          whereVal = params.where.userId;
        }
        args.push(whereVal);
        this.db.prepare(`UPDATE RecyclerProfile SET ${updates.join(', ')} WHERE ${whereClause}`).run(...args);
      }
      return this.recyclerProfile.findUnique({ where: params.where });
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM RecyclerProfile');
      return { count: 0 };
    }
  };

  private enrichRecycler(row: any, include?: any) {
    const r = { ...row };
    try {
      r.materialsAccepted = JSON.parse(r.materialsAccepted || '[]');
    } catch {
      r.materialsAccepted = [];
    }
    try {
      r.offeredRates = JSON.parse(r.offeredRates || '{}');
    } catch {
      r.offeredRates = {};
    }
    r.verified = Boolean(r.verified);
    r.pickupAvailable = Boolean(r.pickupAvailable);
    if (include?.user) {
      r.user = this.db.prepare('SELECT id, name, phone, role, createdAt FROM User WHERE id = ?').get(row.userId);
    }
    return r;
  }

  // 8. EWasteLot
  eWasteLot = {
    findMany: async (params?: { where?: any; include?: any; orderBy?: any }) => {
      let query = 'SELECT * FROM EWasteLot';
      const args: any[] = [];
      const clauses: string[] = [];

      if (params?.where?.collectorId) {
        clauses.push('collectorId = ?');
        args.push(params.where.collectorId);
      }
      if (params?.where?.status) {
        clauses.push('status = ?');
        args.push(params.where.status);
      }
      if (params?.where?.category) {
        clauses.push('category = ?');
        args.push(params.where.category);
      }
      if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
      }
      query += ' ORDER BY createdAt DESC';

      const rows = this.db.prepare(query).all(...args);
      return rows.map((r: any) => this.enrichLot(r));
    },

    findUnique: async (params: { where: { id?: string; lotCode?: string } }) => {
      let row: any;
      if (params.where.id) {
        row = this.db.prepare('SELECT * FROM EWasteLot WHERE id = ?').get(params.where.id);
      } else if (params.where.lotCode) {
        row = this.db.prepare('SELECT * FROM EWasteLot WHERE lotCode = ?').get(params.where.lotCode);
      }
      if (!row) return null;
      return this.enrichLot(row);
    },

    create: async (params: { data: any }) => {
      const id = params.data.id || crypto.randomUUID();
      const lotCode = params.data.lotCode || `KC-LOT-${Math.floor(1000 + Math.random() * 9000)}`;
      const createdAt = params.data.createdAt || new Date().toISOString();
      const auctionDurationMins = params.data.auctionDurationMins || 60;
      const auctionExpiresAt = params.data.auctionExpiresAt || new Date(Date.now() + auctionDurationMins * 60 * 1000).toISOString();
      const qrCode = params.data.qrCode || `KBD-EWASTE-${lotCode.replace(/\D/g, '')}-IN`;
      const traceabilityHash = params.data.traceabilityHash || `0x${crypto.createHash('sha256').update(id + createdAt).digest('hex').slice(0, 16)}`;

      this.db.prepare(`
        INSERT INTO EWasteLot (
          id, lotCode, collectorId, collectorName, category, approxWeightKg, totalItems,
          estimatedValue, askingPrice, minBidAmount, recyclerOfferedRate, status,
          highestBid, winningBidId, imageUrl, gpsLat, gpsLng, locationAddress, locationZone,
          auctionDurationMins, auctionExpiresAt, antiSnipingExtensions, recyclerId, recyclerName,
          qrCode, traceabilityHash, saleTokenNumber, weighbridgeOperatorId, verifiedAtWeighbridge,
          actualWeightKg, isCustomLot, createdAt, confirmedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `).run(
        id, lotCode, params.data.collectorId, params.data.collectorName || 'Collector', params.data.category,
        params.data.approxWeightKg || 10, params.data.totalItems || 1, params.data.estimatedValue || 0,
        params.data.askingPrice || params.data.estimatedValue || 0, params.data.minBidAmount || 0,
        params.data.recyclerOfferedRate || 0, params.data.status || 'AVAILABLE',
        params.data.highestBid || null, params.data.winningBidId || null, params.data.imageUrl || null,
        params.data.gpsLat || 28.5685, params.data.gpsLng || 77.2412, params.data.locationAddress || 'Mayapuri Scrap Yard',
        params.data.locationZone || 'West Delhi', auctionDurationMins, auctionExpiresAt, 0,
        params.data.recyclerId || null, params.data.recyclerName || null, qrCode, traceabilityHash,
        params.data.saleTokenNumber || null, null, 0, null, params.data.isCustomLot ? 1 : 0,
        createdAt, null
      );

      // Create items if provided
      if (Array.isArray(params.data.items)) {
        for (const it of params.data.items) {
          const itemId = it.id || crypto.randomUUID();
          this.db.prepare(`
            INSERT INTO EWasteLotItem (id, lotId, category, weightKg, ratePerKg, quantity, subtotal)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(itemId, id, it.category || params.data.category, it.weightKg || params.data.approxWeightKg, it.ratePerKg || 0, it.quantity || 1, it.subtotal || 0);
        }
      }

      return this.eWasteLot.findUnique({ where: { id } });
    },

    update: async (params: { where: { id: string }; data: any }) => {
      const allowed = [
        'status', 'highestBid', 'winningBidId', 'recyclerId', 'recyclerName', 'recyclerOfferedRate',
        'auctionExpiresAt', 'antiSnipingExtensions', 'saleTokenNumber', 'verifiedAtWeighbridge',
        'actualWeightKg', 'weighbridgeOperatorId', 'confirmedAt'
      ];
      const updates: string[] = [];
      const args: any[] = [];

      for (const key of allowed) {
        if (params.data[key] !== undefined) {
          updates.push(`${key} = ?`);
          args.push(params.data[key]);
        }
      }

      if (updates.length > 0) {
        args.push(params.where.id);
        this.db.prepare(`UPDATE EWasteLot SET ${updates.join(', ')} WHERE id = ?`).run(...args);
      }

      return this.eWasteLot.findUnique({ where: { id: params.where.id } });
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM LotBid');
      this.db.exec('DELETE FROM EWasteLotItem');
      this.db.exec('DELETE FROM EWasteLot');
      return { count: 0 };
    }
  };

  private enrichLot(row: any) {
    const lot = { ...row };
    lot.isCustomLot = Boolean(lot.isCustomLot);
    lot.verifiedAtWeighbridge = Boolean(lot.verifiedAtWeighbridge);
    lot.items = this.db.prepare('SELECT * FROM EWasteLotItem WHERE lotId = ?').all(row.id);
    lot.bids = this.db.prepare('SELECT * FROM LotBid WHERE lotId = ? ORDER BY bidAmount DESC').all(row.id);
    if (!lot.highestBid && lot.bids.length > 0) {
      lot.highestBid = lot.bids[0].bidAmount;
    }
    return lot;
  }

  // 9. LotBid
  lotBid = {
    findMany: async (params?: { where?: { lotId?: string; recyclerId?: string } }) => {
      let query = 'SELECT * FROM LotBid';
      const args: any[] = [];
      const clauses: string[] = [];
      if (params?.where?.lotId) {
        clauses.push('lotId = ?');
        args.push(params.where.lotId);
      }
      if (params?.where?.recyclerId) {
        clauses.push('recyclerId = ?');
        args.push(params.where.recyclerId);
      }
      if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
      }
      query += ' ORDER BY createdAt DESC';
      return this.db.prepare(query).all(...args);
    },

    create: async (params: { data: any }) => {
      const id = params.data.id || crypto.randomUUID();
      const createdAt = params.data.createdAt || new Date().toISOString();
      this.db.prepare(`
        INSERT INTO LotBid (id, lotId, recyclerId, recyclerName, bidAmount, bidPerKg, status, notes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, params.data.lotId, params.data.recyclerId, params.data.recyclerName,
        params.data.bidAmount, params.data.bidPerKg, params.data.status || 'PENDING',
        params.data.notes || null, createdAt
      );

      // Auto-update lot highest bid
      this.db.prepare(`
        UPDATE EWasteLot SET highestBid = MAX(COALESCE(highestBid, 0), ?), status = 'BIDDING'
        WHERE id = ?
      `).run(params.data.bidAmount, params.data.lotId);

      return { id, ...params.data, createdAt };
    },

    update: async (params: { where: { id: string }; data: any }) => {
      if (params.data.status) {
        this.db.prepare('UPDATE LotBid SET status = ? WHERE id = ?').run(params.data.status, params.where.id);
      }
      return this.db.prepare('SELECT * FROM LotBid WHERE id = ?').get(params.where.id);
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM LotBid');
      return { count: 0 };
    }
  };

  // 10. SaleToken
  saleToken = {
    findUnique: async (params: { where: { tokenNumber?: string; lotId?: string; id?: string } }) => {
      let row: any;
      if (params.where.tokenNumber) {
        row = this.db.prepare('SELECT * FROM SaleToken WHERE tokenNumber = ?').get(params.where.tokenNumber);
      } else if (params.where.lotId) {
        row = this.db.prepare('SELECT * FROM SaleToken WHERE lotId = ?').get(params.where.lotId);
      } else if (params.where.id) {
        row = this.db.prepare('SELECT * FROM SaleToken WHERE id = ?').get(params.where.id);
      }
      return row || null;
    },

    findMany: async (params?: { where?: { collectorId?: string; recyclerId?: string }; orderBy?: any }) => {
      let query = 'SELECT * FROM SaleToken';
      const args: any[] = [];
      const clauses: string[] = [];
      if (params?.where?.collectorId) {
        clauses.push('collectorId = ?');
        args.push(params.where.collectorId);
      }
      if (params?.where?.recyclerId) {
        clauses.push('recyclerId = ?');
        args.push(params.where.recyclerId);
      }
      if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
      }
      query += ' ORDER BY createdAt DESC';
      return this.db.prepare(query).all(...args);
    },

    create: async (params: { data: any }) => {
      const id = params.data.id || crypto.randomUUID();
      const createdAt = params.data.createdAt || new Date().toISOString();
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const tokenNumber = params.data.tokenNumber || `KBD-SL-${datePart}-DL01-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const sha256Signature = params.data.sha256Signature || crypto.createHash('sha256').update(tokenNumber + params.data.lotId + params.data.netWeightKg).digest('hex');

      this.db.prepare(`
        INSERT INTO SaleToken (
          id, tokenNumber, lotId, collectorId, collectorName, collectorPhone, collectorAadhaarRef,
          recyclerId, recyclerName, cpcbRegNumber, category, cpcbCategoryCode, grossWeightKg,
          tareWeightKg, netWeightKg, ratePerKg, totalAmount, paymentMode, weighbridgeGpsLat,
          weighbridgeGpsLng, operatorId, sha256Signature, eprCredits, createdAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
      `).run(
        id, tokenNumber, params.data.lotId, params.data.collectorId, params.data.collectorName,
        params.data.collectorPhone, params.data.collectorAadhaarRef || 'XXXX-XXXX-8921',
        params.data.recyclerId, params.data.recyclerName, params.data.cpcbRegNumber,
        params.data.category, params.data.cpcbCategoryCode || 'ITEW2', params.data.grossWeightKg,
        params.data.tareWeightKg, params.data.netWeightKg, params.data.ratePerKg,
        params.data.totalAmount, params.data.paymentMode || 'CASH_ON_SPOT',
        params.data.weighbridgeGpsLat || 28.5355, params.data.weighbridgeGpsLng || 77.2690,
        params.data.operatorId || 'OP-OKHLA-981', sha256Signature, params.data.eprCredits || params.data.netWeightKg,
        createdAt
      );

      // Link token back to lot
      this.db.prepare(`
        UPDATE EWasteLot SET saleTokenNumber = ?, status = 'CONFIRMED', verifiedAtWeighbridge = 1, actualWeightKg = ?, confirmedAt = ?
        WHERE id = ?
      `).run(tokenNumber, params.data.netWeightKg, createdAt, params.data.lotId);

      return this.saleToken.findUnique({ where: { tokenNumber } });
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM SaleToken');
      return { count: 0 };
    }
  };

  // 11. Review
  review = {
    findMany: async (params?: { where?: { targetUserId?: string; reviewerId?: string; saleTokenId?: string; status?: string } }) => {
      let query = 'SELECT * FROM Review';
      const args: any[] = [];
      const clauses: string[] = [];
      if (params?.where?.targetUserId) {
        clauses.push('targetUserId = ?');
        args.push(params.where.targetUserId);
      }
      if (params?.where?.reviewerId) {
        clauses.push('reviewerId = ?');
        args.push(params.where.reviewerId);
      }
      if (params?.where?.saleTokenId) {
        clauses.push('saleTokenId = ?');
        args.push(params.where.saleTokenId);
      }
      if (params?.where?.status) {
        clauses.push('status = ?');
        args.push(params.where.status);
      }
      if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
      }
      query += ' ORDER BY createdAt DESC';
      return this.db.prepare(query).all(...args);
    },

    findUnique: async (params: { where: { id: string } }) => {
      return this.db.prepare('SELECT * FROM Review WHERE id = ?').get(params.where.id) || null;
    },

    create: async (params: { data: any }) => {
      const id = params.data.id || crypto.randomUUID();
      const createdAt = params.data.createdAt || new Date().toISOString();
      const status = params.data.status || 'PENDING_MUTUAL';

      this.db.prepare(`
        INSERT INTO Review (
          id, reviewerId, targetUserId, saleTokenId, status, revealedAt, ratingOverall,
          ratingScaleAcc, ratingPayoutSpd, ratingPurity, reviewText, isVerifiedTrade, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, params.data.reviewerId, params.data.targetUserId, params.data.saleTokenId || null,
        status, params.data.revealedAt || null, params.data.ratingOverall ?? params.data.rating ?? 5,
        params.data.ratingScaleAcc || null, params.data.ratingPayoutSpd || null,
        params.data.ratingPurity || null, params.data.reviewText || params.data.comment || null, 1, createdAt
      );

      // Check double-blind reveal: if counterpart already reviewed this saleTokenId, reveal both!
      if (params.data.saleTokenId) {
        const counterReviews = this.db.prepare(`
          SELECT * FROM Review WHERE saleTokenId = ? AND id != ?
        `).all(params.data.saleTokenId, id);

        if (counterReviews.length > 0) {
          const revealedAt = new Date().toISOString();
          this.db.prepare(`
            UPDATE Review SET status = 'REVEALED', revealedAt = ? WHERE saleTokenId = ?
          `).run(revealedAt, params.data.saleTokenId);

          // Update target user's reputation score using Bayesian average
          this.recalculateBayesianScore(params.data.targetUserId);
          this.recalculateBayesianScore(params.data.reviewerId);
        }
      }

      return this.review.findUnique({ where: { id } });
    },

    update: async (params: { where: { id: string }; data: any }) => {
      if (params.data.status) {
        this.db.prepare('UPDATE Review SET status = ?, revealedAt = ? WHERE id = ?')
          .run(params.data.status, params.data.revealedAt || new Date().toISOString(), params.where.id);
      }
      return this.review.findUnique({ where: { id: params.where.id } });
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM Review');
      return { count: 0 };
    }
  };

  private recalculateBayesianScore(userId: string) {
    const reviews = this.db.prepare(`
      SELECT ratingOverall FROM Review WHERE targetUserId = ? AND status = 'REVEALED'
    `).all(userId);

    if (reviews.length === 0) return;
    const v = reviews.length;
    const R = reviews.reduce((acc: number, cur: any) => acc + cur.ratingOverall, 0) / v;
    const m = 5;
    const C = 4.2;
    const W = Number((((v / (v + m)) * R) + ((m / (v + m)) * C)).toFixed(2));

    // Update KabadiwalaProfile or RecyclerProfile if applicable
    this.db.prepare('UPDATE KabadiwalaProfile SET reputationScore = ? WHERE userId = ?').run(W, userId);
    this.db.prepare('UPDATE RecyclerProfile SET rating = ?, totalReviewsCount = ? WHERE userId = ?').run(W, v, userId);
  }

  // 12. ChatMessage
  chatMessage = {
    findMany: async (params: { where: { contextType: string; contextId: string } }) => {
      return this.db.prepare(`
        SELECT * FROM ChatMessage WHERE contextType = ? AND contextId = ? ORDER BY createdAt ASC
      `).all(params.where.contextType, params.where.contextId);
    },

    create: async (params: { data: any }) => {
      const id = params.data.id || crypto.randomUUID();
      const createdAt = params.data.createdAt || new Date().toISOString();
      this.db.prepare(`
        INSERT INTO ChatMessage (id, senderId, receiverId, contextType, contextId, text, audioUrl, imageUrl, isRead, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, params.data.senderId, params.data.receiverId || params.data.recipientId || null, params.data.contextType,
        params.data.contextId, params.data.text || null, params.data.audioUrl || null,
        params.data.imageUrl || null, 0, createdAt
      );
      return { id, ...params.data, isRead: false, createdAt };
    },

    markRead: async (contextType: string, contextId: string, receiverId: string) => {
      this.db.prepare(`
        UPDATE ChatMessage SET isRead = 1 WHERE contextType = ? AND contextId = ? AND receiverId = ?
      `).run(contextType, contextId, receiverId);
      return { success: true };
    },

    deleteMany: async () => {
      this.db.exec('DELETE FROM ChatMessage');
      return { count: 0 };
    }
  };

  async $disconnect() {
    // cleanup
  }
}

export const prisma = new SQLitePrismaClient();
export default prisma;
