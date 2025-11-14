import mongoose from 'mongoose';

export const setupIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: -1 });

    // Documents collection indexes
    await db.collection('documents').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('documents').createIndex({ filename: 'text', originalName: 'text' });
    await db.collection('documents').createIndex({ tags: 1 });
    await db.collection('documents').createIndex({ collectionId: 1 });
    await db.collection('documents').createIndex({ isDeleted: 1 });
    await db.collection('documents').createIndex({ userId: 1, isDeleted: 1 });

    // Collections collection indexes
    await db.collection('collections').createIndex({ userId: 1, order: 1 });
    await db.collection('collections').createIndex({ userId: 1, parentId: 1 });

    // Tags collection indexes
    await db.collection('tags').createIndex({ userId: 1, name: 1 }, { unique: true });
    await db.collection('tags').createIndex({ userId: 1, useCount: -1 });

    // Notes collection indexes (for future use)
    await db.collection('notes').createIndex({ documentId: 1, pageNumber: 1 });
    await db.collection('notes').createIndex({ userId: 1, createdAt: -1 });

    // Conversations collection indexes (for future use)
    await db.collection('conversations').createIndex({ userId: 1, documentId: 1 });
    await db.collection('conversations').createIndex({ createdAt: -1 });

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
};