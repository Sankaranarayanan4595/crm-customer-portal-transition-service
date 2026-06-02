const { error } = require("winston");
const logdetailModel = require("../models/logdetailsModel");

module.exports.getSessionDetails = async (userId) => {
  try {
    let user = await logdetailModel
      .find({ userId: userId, active: true })
      .sort({ createdAt: -1 })
      .limit(1)
      .exec();
    if (user) {
      return user;
    } else {
      throw err();
    }
  } catch (e) {
    throw e;
  }
};

module.exports.updateSessionDetails = async (obj) => {
  try {
    const updatedLog = await logdetailModel.findOneAndUpdate(
      { userId: obj.userId, sessionId: obj.sessionId },
      { $set: { logoutTime: obj.logoutTime } },
      { new: true }
    );
    if (!updatedLog) {
      throw new error();
    }
    return updatedLog;
  } catch (error) {
    throw error;
  }
};

module.exports.updateSessionDetails = async (obj) => {
  try {
    const updatedLog = await logdetailModel.findOneAndUpdate(
      { userId: obj.userId, sessionId: obj.sessionId },
      { $set: { logoutTime: obj.logoutTime } },
      { new: true }
    );
    if (!updatedLog) {
      throw new error();
    }
    return updatedLog;
  } catch (error) {
    throw error;
  }
};

module.exports.deactivePreviosusSessions = async (userId) => {
  try {
    console.log(userId);
    const updatedLog = await logdetailModel.updateMany(
      { userId: userId },
      { $set: { active: false } },
      { new: true }
    );
    if (!updatedLog) {
      throw new error();
    }
    console.log(updatedLog);
    return updatedLog;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
