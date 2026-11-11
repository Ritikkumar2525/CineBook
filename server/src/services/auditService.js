const AuditLog = require('../models/AuditLog');

/**
 * Record an audit log event
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} action
 * @param {string} entityType
 * @param {string} entityId
 * @param {Object} details
 * @param {string} ipAddress
 * @returns {Promise<AuditLog>}
 */
const log = async (userId, action, entityType, entityId, details = {}, ipAddress = null) => {
  try {
    const auditLog = await AuditLog.create({
      user: userId || null,
      action,
      entityType,
      entityId: entityId ? entityId.toString() : null,
      details,
      ipAddress: ipAddress || null,
    });
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};

/**
 * Retrieve paginated audit logs with filters
 * @param {Object} filters
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const getAuditLogs = async (filters = {}, page = 1, limit = 20) => {
  const query = {};

  if (filters.action) {
    query.action = filters.action;
  }
  if (filters.entityType) {
    query.entityType = filters.entityType;
  }
  if (filters.entityId) {
    query.entityId = filters.entityId;
  }
  if (filters.userId) {
    query.user = filters.userId;
  }
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.createdAt.$lte = new Date(filters.endDate);
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('user', 'name email role');

  return {
    logs,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

module.exports = {
  log,
  getAuditLogs,
};
