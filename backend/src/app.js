const express = require("express");
const app = express();
const auth = require("./routes/auth.routes");
const idea = require("./routes/idea.routes");
const acl = require("./routes/acl.routes");
const rateLimit = require("./middleware/rateLimit.middleware")
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const corsOptions = {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    optionsSuccessStatus: 200
};

app.use(helmet()); // Secure HTTP headers
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/auth", rateLimit, auth);
app.use("/api/ideas", idea);
app.use("/api/acl", acl);
app.use("/api/verify", require("./routes/verify.routes"));
app.use("/api/ideas", require("./routes/comment.routes")); // Comments are sub-resource of ideas
app.use("/api/ideas", require("./routes/audit.routes")); // Audit logs are sub-resource of ideas

module.exports = app;