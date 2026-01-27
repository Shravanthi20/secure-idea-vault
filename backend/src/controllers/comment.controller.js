const Comment = require("../models/Comment");
const User = require("../models/User");

// GET /ideas/:id/comments
exports.listComments = async (req, res) => {
    try {
        const comments = await Comment.find({ ideaId: req.params.id })
            .populate("userId", "email") // Only show email or pseudonym
            .sort({ timestamp: 1 });

        res.json(comments);
    } catch (err) {
        res.status(500).send("Error fetching comments");
    }
};

// POST /ideas/:id/comments
exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).send("Comment text required");

        const comment = await Comment.create({
            ideaId: req.params.id,
            userId: req.user.uid,
            text
        });

        const populated = await comment.populate("userId", "email");
        res.json(populated);
    } catch (err) {
        console.error("Add Comment Error:", err);
        res.status(500).send("Failed to add comment");
    }
};
