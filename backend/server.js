require("dotenv").config();
const app= require("./src/app");
const connectDB= require("./src/config/db");
connectDB();
app.listen(5000, ()=>console.log("Server running on 5000"));