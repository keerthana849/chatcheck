const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const accessChat = asyncHandler(async (req, res) => {
  // res.send("hii");
  const { userId } = req.body; //the user with which we are accesing/creating a new chat with

  if (!userId) {
    console.log("User Id param is not sent with the request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    //check if a chat is already present.
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } }, //element match and it has to be equal to the logged in user
      { users: { $elemMatch: { $eq: userId } } }, //the user that logged in user is finding. both of them should be rpesent in the users array.
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage"); //currently we jsut have id in the suers array. Instead of that, populate all other values also except password;

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  }); //populate latest message with these values.

  if (isChat.length > 0) {
    res.send(isChat[0]); //only 1 chat wioll exist. reyurn that value
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
    try {
      const createdChat = await Chat.create(chatData);

      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      ); //if we don't write populate here, it would have given just the user ids of both users

      res.status(200).send(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

const fetchChats = asyncHandler(async (req, res) => {
  try {
    // Chat.find({ users: { $elemMatch: { $eq: req.user._id } } }).then((result) =>
    //   res.send(result)
    // ); //find a chat where the loggedin user is a part of users array
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 }) //sort wrt updated at field
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });

        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  var users = JSON.parse(req.body.users); // from front end we will get data in stringify format. In BE, we have to parse it to obj before using it.

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(req.user); //current logged in user should also be part of group chat.

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password") //If we don't populate here, it will just give us ids in users{} obj. we need all details of users here.
      .populate("groupAdmin", "-password"); //populates req.user with out pwd field

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId, //find this id
    {
      chatName: chatName, //update chatname field with the req.body.chatname. as names are same for both, we can jsut write chatName instead of all this.
    },
    {
      new: true, //if we dont write this, it will return the old name only.
    }
  )
    .populate("users", "-password") //if we dont populate, we will get only the ids in users array and groupadmin place. as it is reference to a user, to get those particualr user details, we need to populate.
    .populate("groupAdmin", "-password"); //after updating it, populate these fileds.

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat not found");
  } else {
    res.json(updatedChat);
  }
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId }, //add this userId to users.
    },
    {
      new: true, //return the updated one
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat not found");
  } else {
    res.json(added);
  }
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId }, //add this userId to users.
    },
    {
      new: true, //return the updated one
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat not found");
  } else {
    res.json(removed);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
