//chatName
//isGroupChat
//users
//latestMessage
//groupAdmin

const mongoose = require("mongoose");

const chatModel = mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId, //type is an object id referencing to users table
        ref: "User",
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId, //type is an object id referencing to users table
      ref: "User",
    },
  },
  {
    timestamps: true, //whenever data is created, time stamps will be automativaly added
  }
);

const Chat = mongoose.model("Chat", chatModel); //name of model, obj that we created i.e the schema for this model

module.exports = Chat;
