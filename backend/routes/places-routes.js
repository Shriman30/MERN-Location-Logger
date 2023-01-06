const express = require("express");
const { check } = require("express-validator");

const placesController = require("../controllers/places-controller");

const router = express.Router();

// get place by place ID
router.get("/:pid", placesController.getPlaceById);

// update a place by place ID
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesController.updatePlace
);

// get place by user ID
router.get("/user/:userId", placesController.getPlacesByUserId);

// Create a place and perform field checks before creating the place. The fields are the same as the ones taken from the body of the request
router.post(
  "/",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesController.createPlace
);

// Delete a place by place Id
router.delete("/:pid",  placesController.deletePlace);

module.exports = router;
