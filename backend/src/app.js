const express = require("express");
const app = express();
const auth= require("./routes/auth.routes");
app.use(express.json());

app.use("/api/auth", auth);

module.exports = app;