const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const generateToken = require("../config/generateToken");
const expressAsyncHandler = require("express-async-handler");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter the required fields");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    //use await fonr mongo db queries as it may take some time to complete the task
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to create a user");
  }
});

const authUser = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      password: user.password,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("User not found. Incorrect email (or) password.");
  }
});

// /api/user?search=keerthana
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        //will see if this search param is present in name or email. If yes, return that
        $or: [
          { name: { $regex: req.query.search, $options: "i" } }, //options: "i" - case sensitive
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {}; //else don't do anything.

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } }); //get all users except the logged in suer. "not equal: ne"
  res.send(users);

  //const keyword = req.query; //to get query. to get nrml params- req.params.{name}
  // console.log(keyword);
});

module.exports = { registerUser, authUser, allUsers };
