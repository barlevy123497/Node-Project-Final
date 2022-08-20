const express = require("express");
const { Card } = require("../models/Card");
const joi = require("joi");
const _ = require("lodash");
const router = express.Router();
const auth = require("../middlewares/auth");

const cardSchema = joi.object({
  name: joi.string().required().min(2),
  address: joi.string().required().min(2),
  description: joi.string().required().min(2),
  phone: joi
    .string()
    .required()
    .regex(/^0\d([\d]{0,1})([-]{0,1})\d{7}$/),
  image: joi.string().required(),
});

const genCardNumber = async () => {
  while (true) {
    let randomNum = _.random(1000, 999999);
    let card = await Card.findOne({ cardNumber: randomNum });
    if (!card) return randomNum;
  }
};

router.post("/", auth, async (req, res) => {
  try {
    // joi validate
    const { error } = cardSchema.validate(req.body);
    if (error) return res.status(400).send(error.message);

    // checking if card exist
    let card = new Card(req.body);
    card.cardNumber = await genCardNumber();
    card.user_id = req.payload._id;

    // saving card in db
    await card.save();
    res.status(201).send(card);
  } catch (error) {
    res.status(400).send("error in post card");
  }
});

// Cards of specific User
router.get("/my-cards", auth, async (req, res) => {
  try {
    const myCards = await Card.find({ user_id: req.payload._id });
    // if (myCards.length == 0) return res.status(404).send("there is no cards");
    res.status(200).send(myCards);
  } catch (error) {
    res.status(400).send("error in delete specific card");
  }
});

// get specifed card of specific user
router.get("/:id", auth, async (req, res) => {
  try {
    let card = await Card.findOne({
      _id: req.params.id,
      user_id: req.payload._id,
    });
    if (!card) res.status(404).send("card was not found");
    res.status(200).send(card);
  } catch (error) {
    res.status(400).send("error in getting specific card");
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { error } = cardSchema.validate(req.body);
    if (error) return res.status(400).send(error.message);
    let card = await Card.findByIdAndUpdate(
      { _id: req.params.id, user_id: req.payload._id },
      req.body,
      { new: true }
    );
    if (!card) return res.status(404).send("card was not found");
    res.status(200).send(card);
  } catch (error) {
    res.status(400).send("error in put specific card");
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const card = await Card.findByIdAndRemove({
      _id: req.params.id,
      user_id: req.payload._id,
    });
    if (!card) return res.status(404).send("card was not found");
    res.status(200).send("card was deleted successfully");
  } catch (error) {
    res.status(400).send("error in delete specific card");
  }
});

router.get("/", auth, async (req, res) => {
  try {
    let cards = await Card.find();
    res.status(200).send(cards);
  } catch (error) {}
});
module.exports = router;
