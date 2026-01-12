const router = require("express").Router();
const Idea = require("../models/Idea");
const User = require("../models/User");
const { verifySignature } = require("../services/crypto.service");

router.get("/:id", async (req, res) => {
  const idea = await Idea.findById(req.params.id);
  if (!idea) return res.status(404).send("Not found");

  const owner = await User.findById(idea.ownerId);

  const valid = verifySignature(idea.dataHash,idea.digitalSignature,owner.publicKey);

  res.json({valid,hash: idea.dataHash,owner: owner.email});
});

module.exports = router;
