const mongoose = require("mongoose");
const LeadsActivationStatus = require("../../models/Leads-Mast-Activation-Status");
const User = require("../../models/userModel");
const Employee = require("../../models/userEmployee.js");
const { getTokenDetails } = require("../../middlewares/authendicateSession");

const getStatusById = async (type, status_code) => {
  try {
    const statusId = await LeadsActivationStatus.findOne({
      cStatus_Type: type,
      cStatus_Code: status_code,
      bActive: true
    });
    return statusId?._id.toString();
  } catch (error) {
    console.error(`Error in getStatusById for ${type}/${status_code}:`, error);
    return null;
  }
};

const getStatusByType = async (type) => {
  try {
    const statuses = await LeadsActivationStatus.find({
      cStatus_Type: type,
      bActive: true
    });
    return statuses;
  } catch (error) {
    console.error(`Error in getStatusByType for ${type}:`, error);
    return [];
  }
};

const getUserName = async (_id) => {
  try {
    const UserName = await User.findOne({ _id: { $eq: _id } }, { loginName: 1, empId: 1, _id: 0 });
    if (!UserName) {
      console.log("User not found");
      return null;
    }
    if (UserName.empId) {
      const empDetails = await Employee.findOne({ _id: UserName.empId }, { empName: 1, _id: 0 });
      if (empDetails && empDetails.empName) {
        return empDetails.empName;
      } else {
        console.log("Employee details not found");
      }
    }
    return UserName.loginName;
  } catch (err) {
    console.error("Error fetching User:", err);
    throw err;
  }
};

// Proxied function. Full migration pending (requires moving oldOpportunityCache).
const getOpportunityData = async (data) => {
  try {
    if (!data?._id) return;

    console.log("getOpportunityData received data:", data._id);

    // ✅ Store old data in memory for later comparison
    oldOpportunityCache.set(String(data._id), JSON.parse(JSON.stringify(data)));

  } catch (err) {
    console.error("Error in getOpportunityData:", err);
    throw err;
  }
};

module.exports = {
  getStatusById,
  getStatusByType,
  getUserName,
  getOpportunityData
};
