"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
// Try loading native node:sqlite DatabaseSync
let DatabaseSync;
try {
    const sqlite = require('node:sqlite');
    DatabaseSync = sqlite.DatabaseSync;
}
catch (e) {
    console.error('Node:sqlite not found, falling back to in-memory store');
}
const DB_PATH = process.env.DATABASE_PATH || (fs_1.default.existsSync(path_1.default.resolve(process.cwd(), 'prisma/dev.db')) ? path_1.default.resolve(process.cwd(), 'prisma/dev.db') : path_1.default.resolve(__dirname, '../prisma/dev.db'));
class SQLitePrismaClient {
    db;
    constructor() {
        // Ensure dir
        const dir = path_1.default.dirname(DB_PATH);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        if (DatabaseSync) {
            this.db = new DatabaseSync(DB_PATH);
            this.initSchema();
        }
    }
    initSchema() {
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
    `);
    }
    // 1. User
    user = {
        findUnique: async (params) => {
            let row;
            if (params.where.phone) {
                row = this.db.prepare('SELECT * FROM User WHERE phone = ?').get(params.where.phone);
            }
            else if (params.where.id) {
                row = this.db.prepare('SELECT * FROM User WHERE id = ?').get(params.where.id);
            }
            if (!row)
                return null;
            if (params.include?.kabadiwala) {
                const kProfile = this.db.prepare('SELECT * FROM KabadiwalaProfile WHERE userId = ?').get(row.id);
                row.kabadiwala = kProfile ? { ...kProfile, verified: Boolean(kProfile.verified) } : null;
            }
            return row;
        },
        findMany: async (params) => {
            let rows = [];
            if (params?.where?.phone?.in) {
                const placeholders = params.where.phone.in.map(() => '?').join(',');
                rows = this.db.prepare(`SELECT * FROM User WHERE phone IN (${placeholders})`).all(...params.where.phone.in);
            }
            else {
                rows = this.db.prepare('SELECT * FROM User').all();
            }
            return rows.map(r => {
                const kProfile = this.db.prepare('SELECT * FROM KabadiwalaProfile WHERE userId = ?').get(r.id);
                return {
                    ...r,
                    kabadiwala: kProfile ? { ...kProfile, verified: Boolean(kProfile.verified) } : null
                };
            });
        },
        create: async (params) => {
            const id = params.data.id || crypto_1.default.randomUUID();
            const createdAt = new Date().toISOString();
            const role = params.data.role || 'CITIZEN';
            this.db.prepare(`
        INSERT INTO User (id, name, phone, role, password, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, params.data.name, params.data.phone, role, params.data.password, createdAt);
            let kabadiwala = null;
            if (params.data.kabadiwala?.create) {
                const k = params.data.kabadiwala.create;
                const kId = crypto_1.default.randomUUID();
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
        findUnique: async (params) => {
            let row;
            if (params.where.userId) {
                row = this.db.prepare('SELECT * FROM KabadiwalaProfile WHERE userId = ?').get(params.where.userId);
            }
            else if (params.where.id) {
                row = this.db.prepare('SELECT * FROM KabadiwalaProfile WHERE id = ?').get(params.where.id);
            }
            if (!row)
                return null;
            row.verified = Boolean(row.verified);
            if (params.include?.user) {
                row.user = this.db.prepare('SELECT id, name, phone, role, createdAt FROM User WHERE id = ?').get(row.userId);
            }
            return row;
        },
        findMany: async (params) => {
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
        update: async (params) => {
            const profile = await this.kabadiwalaProfile.findUnique({ where: params.where });
            if (!profile)
                throw new Error('Kabadiwala profile not found');
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
        updateMany: async (params) => {
            if (params.where.userId && params.data.walletBalance?.increment) {
                this.db.prepare(`
          UPDATE KabadiwalaProfile
          SET walletBalance = walletBalance + ?
          WHERE userId = ?
        `).run(params.data.walletBalance.increment, params.where.userId);
            }
            return { count: 1 };
        },
        count: async (params) => {
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
        findUnique: async (params) => {
            const row = this.db.prepare('SELECT * FROM Pickup WHERE id = ?').get(params.where.id);
            if (!row)
                return null;
            return this.enrichPickup(row, params.include);
        },
        findMany: async (params) => {
            let query = 'SELECT * FROM Pickup';
            const args = [];
            if (params?.where) {
                const clauses = [];
                if (params.where.status) {
                    if (typeof params.where.status === 'string') {
                        clauses.push('status = ?');
                        args.push(params.where.status);
                    }
                    else if (params.where.status.in) {
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
        create: async (params) => {
            const id = params.data.id || crypto_1.default.randomUUID();
            const createdAt = new Date().toISOString();
            const scheduledAt = new Date(params.data.scheduledAt).toISOString();
            const completedAt = params.data.completedAt ? new Date(params.data.completedAt).toISOString() : null;
            this.db.prepare(`
        INSERT INTO Pickup (id, citizenId, kabadiwalaId, status, address, latitude, longitude, scheduledAt, totalAmount, notes, completedAt, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, params.data.citizenId, params.data.kabadiwalaId || null, params.data.status || 'REQUESTED', params.data.address, params.data.latitude, params.data.longitude, scheduledAt, params.data.totalAmount || null, params.data.notes || null, completedAt, createdAt);
            if (params.data.items?.create) {
                for (const item of params.data.items.create) {
                    const itemId = crypto_1.default.randomUUID();
                    this.db.prepare(`
            INSERT INTO ScrapItem (id, pickupId, category, estWeightKg, actualWeightKg, ratePerKg, imageUrl)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(itemId, id, item.category, item.estWeightKg, item.actualWeightKg || null, item.ratePerKg, item.imageUrl || null);
                }
            }
            return this.pickup.findUnique({ where: { id }, include: params.include });
        },
        update: async (params) => {
            const current = this.db.prepare('SELECT * FROM Pickup WHERE id = ?').get(params.where.id);
            if (!current)
                throw new Error('Pickup not found');
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
        count: async (params) => {
            let query = 'SELECT COUNT(*) as c FROM Pickup';
            const args = [];
            if (params?.where?.status) {
                if (typeof params.where.status === 'string') {
                    query += ' WHERE status = ?';
                    args.push(params.where.status);
                }
                else if (params.where.status.in) {
                    const ph = params.where.status.in.map(() => '?').join(',');
                    query += ` WHERE status IN (${ph})`;
                    args.push(...params.where.status.in);
                }
            }
            return this.db.prepare(query).get(...args).c;
        },
        deleteMany: async () => {
            this.db.exec('DELETE FROM Pickup');
            return { count: 0 };
        }
    };
    enrichPickup(row, include) {
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
        }
        else {
            p.kabadiwala = null;
        }
        // transactions
        p.transactions = this.db.prepare('SELECT * FROM "Transaction" WHERE pickupId = ?').all(row.id);
        return p;
    }
    // 4. ScrapItem
    scrapItem = {
        create: async (params) => {
            const id = crypto_1.default.randomUUID();
            this.db.prepare(`
        INSERT INTO ScrapItem (id, pickupId, category, estWeightKg, actualWeightKg, ratePerKg, imageUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, params.data.pickupId, params.data.category, params.data.estWeightKg, params.data.actualWeightKg || null, params.data.ratePerKg, params.data.imageUrl || null);
            return { id, ...params.data };
        },
        update: async (params) => {
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
        findMany: async (params) => {
            let query = 'SELECT * FROM "Transaction"';
            const args = [];
            if (params?.where?.kabadiwalaId) {
                query += ' WHERE kabadiwalaId = ?';
                args.push(params.where.kabadiwalaId);
            }
            query += ' ORDER BY createdAt DESC';
            const rows = this.db.prepare(query).all(...args);
            if (params?.include?.pickup) {
                return rows.map(r => ({
                    ...r,
                    pickup: this.pickup.findUnique({ where: { id: r.pickupId } })
                }));
            }
            return rows;
        },
        create: async (params) => {
            const id = crypto_1.default.randomUUID();
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
        findMany: async (params) => {
            return this.db.prepare('SELECT * FROM ScrapRate ORDER BY ratePerKg DESC').all();
        },
        create: async (params) => {
            const id = crypto_1.default.randomUUID();
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
    async $disconnect() {
        // cleanup
    }
}
exports.prisma = new SQLitePrismaClient();
exports.default = exports.prisma;
