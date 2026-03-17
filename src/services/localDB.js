// src/services/localDB.js
// expo-sqlite v14+ uses the new async API (openDatabaseAsync)
import * as SQLite from 'expo-sqlite';

let db = null;

// ── Open & Initialize ──────────────────────────────────────────────────────

export const initDB = async () => {
  db = await SQLite.openDatabaseAsync('transync.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      ownerId TEXT,
      driverId TEXT,
      vehicleId TEXT,
      origin TEXT,
      destination TEXT,
      scheduledDate TEXT,
      status TEXT DEFAULT 'assigned',
      startTime TEXT,
      endTime TEXT,
      distanceKm REAL,
      notes TEXT,
      synced INTEGER DEFAULT 0,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS fuel_logs (
      id TEXT PRIMARY KEY,
      tripId TEXT,
      vehicleId TEXT,
      driverId TEXT,
      liters REAL,
      pricePerLiter REAL,
      totalCost REAL,
      odometer REAL,
      mileage REAL,
      synced INTEGER DEFAULT 0,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      ownerId TEXT,
      registrationNumber TEXT,
      model TEXT,
      type TEXT,
      serviceIntervalKm REAL,
      lastServiceKm REAL,
      currentOdometer REAL,
      rcExpiry TEXT,
      insuranceExpiry TEXT,
      pollutionExpiry TEXT,
      synced INTEGER DEFAULT 0,
      createdAt TEXT
    );
  `);
};

const getDB = async () => {
  if (!db) db = await SQLite.openDatabaseAsync('transync.db');
  return db;
};

// ── Trips ──────────────────────────────────────────────────────────────────

export const saveTrip = async (trip) => {
  const database = await getDB();
  await database.runAsync(
    `INSERT OR REPLACE INTO trips
      (id, ownerId, driverId, vehicleId, origin, destination, scheduledDate,
       status, startTime, endTime, distanceKm, notes, synced, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      trip.id, trip.ownerId, trip.driverId, trip.vehicleId,
      trip.origin, trip.destination, trip.scheduledDate, trip.status,
      trip.startTime ?? null, trip.endTime ?? null, trip.distanceKm ?? null,
      trip.notes ?? null, trip.synced ?? 0,
      trip.createdAt ?? new Date().toISOString(),
    ]
  );
};

export const getTripsByDriver = async (driverId) => {
  const database = await getDB();
  return database.getAllAsync(
    'SELECT * FROM trips WHERE driverId = ? ORDER BY createdAt DESC',
    [driverId]
  );
};

export const updateTripStatus = async (tripId, status, extra = {}) => {
  const database = await getDB();
  await database.runAsync(
    `UPDATE trips SET status=?, startTime=?, endTime=?, distanceKm=?, synced=0 WHERE id=?`,
    [status, extra.startTime ?? null, extra.endTime ?? null, extra.distanceKm ?? null, tripId]
  );
};

// ── Fuel Logs ──────────────────────────────────────────────────────────────

export const saveFuelLog = async (log) => {
  const database = await getDB();
  await database.runAsync(
    `INSERT OR REPLACE INTO fuel_logs
      (id, tripId, vehicleId, driverId, liters, pricePerLiter,
       totalCost, odometer, mileage, synced, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      log.id, log.tripId, log.vehicleId, log.driverId,
      log.liters, log.pricePerLiter, log.totalCost,
      log.odometer, log.mileage, 0,
      new Date().toISOString(),
    ]
  );
};

// ── Sync Helpers ───────────────────────────────────────────────────────────

export const getUnsyncedRecords = async (table) => {
  const database = await getDB();
  return database.getAllAsync(`SELECT * FROM ${table} WHERE synced = 0`);
};

export const markSynced = async (table, id) => {
  const database = await getDB();
  await database.runAsync(`UPDATE ${table} SET synced = 1 WHERE id = ?`, [id]);
};
