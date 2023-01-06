const express = require("express");
const { check } = require("express-validator");
const usersController = require("../controllers/users-controller");

const router = express.Router();

// Create new user + log user in
router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 5 }),
  ],
  usersController.signup
);

// Log user in
router.post("/login", usersController.login);

// Retrieve list of all users
router.get("/", usersController.getUsers);

module.exports = router;
