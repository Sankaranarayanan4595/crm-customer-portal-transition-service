const _ = require("lodash");
var moment = require("moment");
const { validateToken } = require("./token");
const sessionService = require("../Service/sessionService");
const axios = require("axios");
const accessKeyValidator = require("./accessKeyValidate");



module.exports.getSessionUser = async (req, res, next) => {
  try {
    // Handle shared link authorization
    if (req.headers["shared-link"] === "true") {
      return accessKeyValidator.validateKey(req, res, next);
    }

    // Build headers for authentication request
    const xAccessToken = req.headers["x-access-token"];
    const accessToken = req.headers["access-token"];
    const sessionId = req.headers["session-id"];


    if (!accessToken) {
      return res.status(401).send({ message: "Access token missing" });
    }

    if (!xAccessToken) {
      return res.status(401).send({ message: "x-access-token header is missing" });
    }

    if (!sessionId) {
      return res.status(401).send({ message: "session-id header is missing" });
    }

    if (!process.env.AUTHENTICATE_URL) {
      return res.status(500).send({ message: "Authentication service URL not configured" });
    }

    const headers = {
      "access-token": accessToken,
      "x-access-token": xAccessToken,
      "session-id": sessionId
    };

    // Call authentication service
    const response = await axios.get(process.env.AUTHENTICATE_URL, { headers });

    if (response.status === 200 && response.data) {
      req.user = response.data;
      return next();
    }

    return res.status(response.status || 401).send({
      message: response.data?.message || "Unauthorized",
      code: response?.data?.code || "Unauthorized"
    });

  } catch (error) {

    const statusCode = error.response?.status || 500;
    // CWE-200: Only forward the upstream service message; never expose raw Node.js error internals
    // (e.g. error.message can leak 'ECONNREFUSED 127.0.0.1:3001' revealing internal topology)
    const message = error.response?.data?.message || "Authentication failed. Please try again.";
    const code = error?.response?.data?.code || "error";
    return res.status(statusCode).send({ message, code });
  }
};

module.exports.getTokenDetails = async (req) => {
  try {
    const reqToken = _.get(req.headers, "x-access-token", "");
    const tokenReg = await validateToken(reqToken);
    return tokenReg;
  } catch (error) {
    console.log("User req not found", error);
    throw new Error("Unauthorized access: Token validation failed");
  }
};
