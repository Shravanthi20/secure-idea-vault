const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const acl = require("../middleware/acl.middleware");
const { listComments, addComment } = require("../controllers/comment.controller");

// View Comments: Requires 'VIEW' permission on 'Comment' object
router.get("/:id/comments", auth, acl("VIEW", "Comment"), listComments);

// Add Comment: Requires 'POST' permission on 'Comment' object
router.post("/:id/comments", auth, acl("POST", "Comment"), addComment);

module.exports = router;
