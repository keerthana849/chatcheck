const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(registerUser).get(protect, allUsers); //as this is used in server.js. endpoint will be /api/user - this registers user. post request. and call a function
router.post("/login", authUser); //another way of creating a route. direct call the request method and to be called function

module.exports = router;
