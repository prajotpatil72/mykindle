import Collection from '../models/Collection.js';
import Document from '../models/Document.js';
import mongoose from 'mongoose';

// @desc    Create collection
// @route   POST /api/collections
// @access  Private
export const createCollection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, color, icon, parentId } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Collection name is required',
      });
    }

    // Validate parent exists if provided
    if (parentId) {
      const parent = await Collection.findOne({ _id: parentId, userId });
      if (!parent) {
        return res.status(404).json({
          status: 'error',
          message: 'Parent collection not found',
        });
      }
    }

    // Get order (last in list)
    const lastCollection = await Collection.findOne({ userId, parentId: parentId || null })
      .sort({ order: -1 });
    const order = lastCollection ? lastCollection.order + 1 : 0;

    const collection = await Collection.create({
      userId,
      name: name.trim(),
      description: description?.trim(),
      color: color || '#4f46e5',
      icon: icon || '📁',
      parentId: parentId || null,
      order,
    });

    res.status(201).json({
      status: 'success',
      message: 'Collection created successfully',
      data: {
        collection,
      },
    });
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create collection',
    });
  }
};

// @desc    Get all collections
// @route   GET /api/collections
// @access  Private
export const getCollections = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { includeDocCount = true } = req.query;

    const collections = await Collection.find({ userId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Get document counts if requested
    if (includeDocCount === 'true') {
      const collectionsWithCount = await Promise.all(
        collections.map(async (collection) => {
          const docCount = await Document.countDocuments({
            userId,
            collectionId: collection._id,
            isDeleted: false,
          });
          return {
            ...collection,
            documentCount: docCount,
          };
        })
      );

      // Build tree structure
      const tree = buildCollectionTree(collectionsWithCount);

      return res.status(200).json({
        status: 'success',
        data: {
          collections: collectionsWithCount,
          tree,
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        collections,
      },
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch collections',
    });
  }
};

// @desc    Get single collection
// @route   GET /api/collections/:id
// @access  Private
export const getCollection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const collection = await Collection.findOne({ _id: id, userId });

    if (!collection) {
      return res.status(404).json({
        status: 'error',
        message: 'Collection not found',
      });
    }

    // Get document count
    const documentCount = await Document.countDocuments({
      userId,
      collectionId: collection._id,
      isDeleted: false,
    });

    // Get path
    const path = await collection.getFullPath();

    res.status(200).json({
      status: 'success',
      data: {
        collection: {
          ...collection.toObject(),
          documentCount,
          path,
        },
      },
    });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch collection',
    });
  }
};

// @desc    Update collection
// @route   PUT /api/collections/:id
// @access  Private
export const updateCollection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, description, color, icon, parentId, order } = req.body;

    const collection = await Collection.findOne({ _id: id, userId });

    if (!collection) {
      return res.status(404).json({
        status: 'error',
        message: 'Collection not found',
      });
    }

    // Validate parent exists and prevent circular reference
    if (parentId !== undefined && parentId !== null) {
      if (parentId === id) {
        return res.status(400).json({
          status: 'error',
          message: 'Collection cannot be its own parent',
        });
      }

      const parent = await Collection.findOne({ _id: parentId, userId });
      if (!parent) {
        return res.status(404).json({
          status: 'error',
          message: 'Parent collection not found',
        });
      }

      // Check for circular reference
      const isCircular = await checkCircularReference(parentId, id, userId);
      if (isCircular) {
        return res.status(400).json({
          status: 'error',
          message: 'Moving collection here would create a circular reference',
        });
      }
    }

    // Update fields
    if (name !== undefined) collection.name = name.trim();
    if (description !== undefined) collection.description = description?.trim();
    if (color !== undefined) collection.color = color;
    if (icon !== undefined) collection.icon = icon;
    if (parentId !== undefined) collection.parentId = parentId || null;
    if (order !== undefined) collection.order = order;

    await collection.save();

    res.status(200).json({
      status: 'success',
      message: 'Collection updated successfully',
      data: {
        collection,
      },
    });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update collection',
    });
  }
};

// @desc    Delete collection
// @route   DELETE /api/collections/:id
// @access  Private
export const deleteCollection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { moveDocuments } = req.query;

    const collection = await Collection.findOne({ _id: id, userId });

    if (!collection) {
      return res.status(404).json({
        status: 'error',
        message: 'Collection not found',
      });
    }

    // Check for child collections
    const childCollections = await Collection.find({ parentId: id, userId });
    if (childCollections.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete collection with child collections',
      });
    }

    // Handle documents in this collection
    if (moveDocuments === 'root') {
      // Move documents to root (no collection)
      await Document.updateMany(
        { userId, collectionId: id },
        { $set: { collectionId: null } }
      );
    } else if (moveDocuments) {
      // Move to specified collection
      const targetCollection = await Collection.findOne({
        _id: moveDocuments,
        userId,
      });

      if (!targetCollection) {
        return res.status(404).json({
          status: 'error',
          message: 'Target collection not found',
        });
      }

      await Document.updateMany(
        { userId, collectionId: id },
        { $set: { collectionId: moveDocuments } }
      );
    } else {
      // Check if collection has documents
      const documentCount = await Document.countDocuments({
        userId,
        collectionId: id,
        isDeleted: false,
      });

      if (documentCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete collection with documents. Move or delete documents first.',
        });
      }
    }

    await collection.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete collection',
    });
  }
};

// @desc    Reorder collections
// @route   PUT /api/collections/reorder
// @access  Private
export const reorderCollections = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { collections } = req.body; // Array of { id, order }

    if (!Array.isArray(collections) || collections.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Collections array is required',
      });
    }

    // Update orders in bulk
    const bulkOps = collections.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, userId },
        update: { $set: { order } },
      },
    }));

    await Collection.bulkWrite(bulkOps);

    res.status(200).json({
      status: 'success',
      message: 'Collections reordered successfully',
    });
  } catch (error) {
    console.error('Reorder collections error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reorder collections',
    });
  }
};

// Helper function to build tree structure
const buildCollectionTree = (collections) => {
  const map = {};
  const roots = [];

  // Create map
  collections.forEach((collection) => {
    map[collection._id] = { ...collection, children: [] };
  });

  // Build tree
  collections.forEach((collection) => {
    if (collection.parentId) {
      if (map[collection.parentId]) {
        map[collection.parentId].children.push(map[collection._id]);
      }
    } else {
      roots.push(map[collection._id]);
    }
  });

  return roots;
};

// Helper function to check circular reference
const checkCircularReference = async (parentId, childId, userId) => {
  let current = parentId;

  while (current) {
    if (current === childId) {
      return true;
    }

    const parent = await Collection.findOne({ _id: current, userId });
    if (!parent) break;

    current = parent.parentId;
  }

  return false;
};