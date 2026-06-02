const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    companyId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "mast_company_informations",
      },
    ],

    defCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mast_company_informations",
    },

    loginName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    userType: {
      type: String,
      required: true, //deafault value like general or prod user
    },
    docId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    empId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "useradmin_mast_employees",
    },

    superUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "useradmin_mast_role_types",
    },

    roleName: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "useradmin_mast_roles",
    },

    addtionalRole: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "useradmin_mast_roles",
    },

    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "useradmin_mast_users",
    },
    globalUser: {
      type: Boolean,
      default: false,
      required: false,
    },
    etag: {
      type: String,
      required: false,
    },
    Guid: {
      type: String,

      // required : true
    },
    updatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "useradmin_mast_users",
    },
    bActive: {
      type: Boolean,
      // required: true,
      default: false,
    },
    loginDate: {
      type: Date,
      default: null,
    },
    updateDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "useradmin_mast_users",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isSso_user: {
      type: Boolean,
      required: false,
      default: false,
    },
    profileLogo: {
      type: String,
    },
    unifiedUserId: {
      type: mongoose.Schema.Types.ObjectId
    },
     bStatus: {
        type: Number,  // 3-created-ac, 2-suspended,1- newlyCreated,0-delete
        // required: true,
        default: 1
    },
  },
  {
    versionKey: false,
    strict: true,
  }
);

const User = mongoose.model("useradmin_mast_users", userSchema);

module.exports = User;
