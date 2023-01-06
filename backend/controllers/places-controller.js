const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");

// get a single place
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong: Could not find place",
      500
    );
    return next(error);
  }
  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided place Id",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) }); // convert place object to js object. then remove the '_' from the '_id' property to the created object
};

// get all the places created by a user
const getPlacesByUserId = async (req, res, next) => {
  const userID = req.params.userId;
  // let places;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userID).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed. please try again",
      500
    );
    return next(error);
  }

  // if(!places || places.length === 0){ return next(new HttpError("Could not find places for the provided user id", 404))}
  if (!userWithPlaces || userWithPlaces.length === 0) {
    return next(
      new HttpError("Could not find places for the provided user id", 404)
    ); // this is how we throw an error in async functions. In this case we could have used throw (error) just like in the above
  }
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

/// Create a new place
const createPlace = async (req, res, next) => {
  const { title, description, address, creator } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please verify your data", 422)
    );
  }
  const createdPlace = new Place({
    title: title,
    description: description,
    address: address,
    image:
      "https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260",
    creator,
  });

  //check if the provided user id exists already. if user does not exist, then Creating place failed
  let user;
  try {
    user = await User.findById(creator);
  } catch {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }

  // Extra check in the case the user does not exist
  if (!user) {
    const error = new HttpError("Could not find user for the provided ID", 404);
    return next(error);
  }

  // if the user does exist, then:
  try {
    const session = await mongoose.startSession(); // start a session
    session.startTransaction(); // start the transaction
    await createdPlace.save({ session: session }); // save the created place in the currently active session into the database
    user.places.push(createdPlace); // add the created place to the list of places of the user
    await user.save({ session: session }); // save the updated information into the database
    await session.commitTransaction(); // terminate the transaction
  } catch (err) {
    const error = new HttpError("Creatomg place failed", 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

/// Update an existing place
const updatePlace = async (req, res, next) => {
  // get the fields that are requested to be updated
  const { title, description } = req.body;
  // get the id of the place we want to update
  const placeId = req.params.pid;
  // check to see if the inputs passed are correct
  if (!validationResult(req).isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please verify your data", 400)
    );
  }
  // update process starts here
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Could not find selected place, please try again",
      500
    );
    return next(error);
  }
  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong: Could not update selected place",
      500
    );
    return next(error);
  }
  // DUMMY_PLACES[placeIndex] = updatedPlace;

  // update process ends here
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  //find the place
  try {
    place = await Place.findById(placeId).populate("creator"); //use populate() to be able to access the entire content of another document stored in a different collection
  } catch {
    const error = new HttpError("Could not delete the requested place", 500);
    return next(error);
  }
  //check if place id exists
  if (!place) {
    return next(new HttpError("Could not find palce for thid id", 404));
  }

  // delete the place
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session: session });
    place.creator.places.pull(place);
    await place.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Could not delete the requested place", 500);
    return next(error);
  }
  res.status(200).json({ message: "Deleted the place" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
