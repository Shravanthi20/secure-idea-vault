const express = require("express");
const app = express();
const auth = require("./routes/auth.routes");
const idea = require("./routes/idea.routes");
const acl = require("./routes/acl.routes");
const rateLimit = require("./middleware/rateLimit.middleware")

app.use(express.json());
app.use("/api/auth", rateLimit, auth);
app.use("/api/ideas", idea);
app.use("/api/acl", acl);
app.use("/api/verify", require("./routes/verify.routes"));

module.exports = app;