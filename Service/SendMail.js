const Maillog = require("../models/logMailDtl");
const SendgirdAPI = require("@sendgrid/mail");
const mailProfile = require("../models/mailProfileModel");
const axios = require("axios");

module.exports.sendEmail = async (mailDetails) => {
  try {
    const mailConfig = await mailProfile
      .findOne({ fromEmail: process.env.From_Email, bActive: true })
      .select()
      .exec();

    // console.log("mailConfig: ", mailConfig);
    console.log("mailDetails: ", mailDetails);

    if (!mailConfig) {
      throw new Error("Mail configuration not found.");
    }

    SendgirdAPI.setApiKey(mailConfig.sendGirdKey);

    const mailConfigObj = mailConfig.toObject();
    const bccMail = mailConfigObj.addlBccEmail;

    // Normalize input: always arrays
    let toList = Array.isArray(mailDetails.to)
      ? mailDetails.to
      : mailDetails.to
        ? [mailDetails.to]
        : [];

    let ccList = Array.isArray(mailDetails.cc)
      ? mailDetails.cc
      : mailDetails.cc
        ? [mailDetails.cc]
        : [];

    let bccList = bccMail ? [bccMail] : [];

    if (Array.isArray(mailDetails.bcc)) {
      bccList = [...bccList, ...mailDetails.bcc];
    }

    // Convert all emails to lowercase for case-insensitive comparison
    const normalize = (list) =>
      list.filter(Boolean).map((email) => email.trim().toLowerCase());

    toList = normalize(toList);
    ccList = normalize(ccList);
    bccList = normalize(bccList);

    // Remove emails in ccList that are already in toList
    ccList = ccList.filter((email) => !toList.includes(email));

    // Remove emails in bccList that are already in toList or ccList
    bccList = bccList.filter(
      (email) => !toList.includes(email) && !ccList.includes(email)
    );

    console.log("Filtered toList:", toList);
    console.log("Filtered ccList:", ccList);
    console.log("Filtered bccList:", bccList);

    const msg = {
      toMail: toList,
      fromEmail: mailConfig.fromEmail,
      ccMail: ccList,
      bccMail: bccList,
      subject: mailDetails.subject,
      html: mailDetails.html,
      sendGirdKey: mailConfig.sendGirdKey,
      profileName: "No Reply",
      attachments: mailDetails?.attachments,
    };

    const emailApi = process.env.EMAILAPI;
    const bodyContent = JSON.stringify(msg);

    const response = await axios.post(emailApi, bodyContent, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `${mailConfig.sendGirdKey}`,
        "access-key": process.env.ACCESS_KEY,
      },
      maxBodyLength: Infinity,
    });

    console.log("sendEmail response", response.data);

    // Optional: Save to mail log if needed
    // const mail = new Maillog({
    //   from: msg.fromEmail,
    //   email: msg.toMail.join(", "),
    //   ccEmail: msg.ccMail.join(", "),
    //   bccEMail: msg.bccMail.join(", "),
    //   subject: msg.subject,
    //   apiBodyData: JSON.stringify(msg),
    //   message: msg.html,
    //   apiResult: JSON.stringify(response.data),
    // });
    // await mail.save();

  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email. Mail service not up");
  }
};
