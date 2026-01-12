import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Product, Sale, Customer, StockMovement } from '../types';

interface ShopDB extends DBSchema {
    products: {
        key: string;
        value: Product;
    };
    sales: {
        key: string;
        value: Sale;
        indexes: { 'by-date': Date };
    };
    customers: {
        key: string;
        value: Customer;
    };
    stockMovements: {
        key: string;
        value: StockMovement;
    };
    pendingSync: {
        key: number;
        value: {
            id?: number;
            type: 'CREATE' | 'UPDATE' | 'DELETE';
            entity: 'PRODUCT' | 'SALE' | 'CUSTOMER';
            data: any;
            timestamp: number;
        };
    };
}

const DB_NAME = 'shop-de-plumas-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ShopDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<ShopDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Almacenes principales
                if (!db.objectStoreNames.contains('products')) {
                    db.createObjectStore('products', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('sales')) {
                    const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
                    salesStore.createIndex('by-date', 'date');
                }
                if (!db.objectStoreNames.contains('customers')) {
                    db.createObjectStore('customers', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('stockMovements')) {
                    db.createObjectStore('stockMovements', { keyPath: 'id' });
                }
                // Cola de sincronización
                if (!db.objectStoreNames.contains('pendingSync')) {
                    db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
                }
            },
        });
    }
    return dbPromise;
};

// --- Operaciones Genéricas ---

export const getAll = async <K extends keyof ShopDB>(storeName: K): Promise<ShopDB[K]['value'][]> => {
    const db = await initDB();
    return db.getAll(storeName);
};

export const put = async <K extends keyof ShopDB>(storeName: K, value: ShopDB[K]['value']) => {
    const db = await initDB();
    return db.put(storeName, value);
};

export const remove = async <K extends keyof ShopDB>(storeName: K, key: string) => {
    const db = await initDB();
    return db.delete(storeName, key);
};

export const bulkPut = async <K extends keyof ShopDB>(storeName: K, values: ShopDB[K]['value'][]) => {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await Promise.all(values.map(val => store.put(val)));
    await tx.done;
};

// --- Sincronización ---

export const addToSyncQueue = async (
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: 'PRODUCT' | 'SALE' | 'CUSTOMER',
    data: any
) => {
    const db = await initDB();
    await db.add('pendingSync', {
        type,
        entity,
        data,
        timestamp: Date.now(),
    });
};

export const getPendingSyncs = async () => {
    const db = await initDB();
    return db.getAll('pendingSync');
};

export const clearSyncQueue = async (ids: number[]) => {
    const db = await initDB();
    const tx = db.transaction('pendingSync', 'readwrite');
    const store = tx.objectStore('pendingSync');
    await Promise.all(ids.map(id => store.delete(id)));
    await tx.done;
};
