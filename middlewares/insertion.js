const TransitionMastPhases = require("../models/Transition/Transition_Mast_Phase");
const TransitionTasks = require("../models/Transition/Transition_Tasks");

module.exports.checkPhaseName = async function (req, res, next) {
  const id = req.params.id;
  const Name = req.body.cPhaseName;
  try {
    let existing;

    if (id) {
      existing = await TransitionMastPhases.findOne({
        _id: { $ne: id },
        cPhaseName: Name,
      });
    } else {
      existing = await TransitionMastPhases.findOne({
        cPhaseName: Name,
      });
    }

    if (existing) {
      return res.status(400).json({
        status: false,
        message: `Phase "${existing.cPhaseName}" already exists.`,
      });
    }

    next();
  } catch (error) {
    console.error("Error checking phase name existence:", error.message);
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
};

module.exports.checkTaskName = async function (req, res, next) {
  const id = req.params.id;
  const Name = req.body.cTaskName;
  try {
    let existing;

    if (id) {
      existing = await TransitionTasks.findOne({
        _id: { $ne: id },
        cTaskName: Name,
      });
    } else {
      existing = await TransitionTasks.findOne({
        cTaskName: Name,
      });
    }

    if (existing) {
      return res.status(201).json({
        success: false,
        message: `Task "${existing.cTaskName}" already exists.`,
      });
    }

    next();
  } catch (error) {
    console.error("Error checking task name existence:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};