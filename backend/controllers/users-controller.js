const User = require("../models/user");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
    // users = await User.find({}, 'email name'); // this is an alternative to the above way of finding a user. {} -> Find the user without specifying the property
  } catch {
    return next(
      new HttpError("Fetching users failed, please try again later", 500)
    );
  }
  res.send({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { name, email, password } = req.body;

  //checking for existing user
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Singing Up failed, please try again later.",
      500
    );
    return next(error);
  }
  // return error if user already exsits
  if (existingUser) {
    const error = new HttpError(
      "There already exists a user with the entered email. Try Loging in instead",
      422
    );
    return next(error);
  }

  // create new user
  const createdUser = new User({
    name: name,
    email: email,
    image:
      "https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260",
    password: password, // password encryption is missing
    places: [],
  });

  // save the user to the database
  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Registering the user failed, please try again",
      500
    );
    return next(error);
  }
  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  //Check if the existing user is stored in the database
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch {
    const error = new HttpError(
      "Logging in failed, please try again later",
      500
    );
    return next(error);
  }
  //check if the email or password is correct:
  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError(
      "Invalid credentials: Could not log you in",
      401
    );
    return next(error);
  }

  res.status(200).json({ message: "Logged In", user: existingUser.toObject({getters:true}) });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
