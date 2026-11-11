const mongoose = require('mongoose');

/**
 * Execute a block of database operations within a transaction if supported,
 * or execute directly if MongoDB is running in standalone single mode.
 * 
 * @param {Function} callback - Function receiving (session) => Promise<any>
 * @returns {Promise<any>}
 */
const runInTransaction = async (callback) => {
  const client = mongoose.connection.getClient();
  const topologyType = client?.topology?.description?.type;
  const isReplicaSetOrSharded =
    topologyType === 'ReplicaSetWithPrimary' ||
    topologyType === 'ReplicaSetNoPrimary' ||
    topologyType === 'Sharded';

  if (!isReplicaSetOrSharded) {
    // Standalone mongod does not support transactions; execute directly
    return await callback(null);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  runInTransaction,
};
