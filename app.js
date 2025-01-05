require("dotenv").config();
const express = require("express");
const genre = require("./genres");
const book = require("./books");
const review = require("./reviews");
const author = require("./authors");

const app = express();
const port = 3000;

// set up database connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const mongoDB = process.env.MONGODB_URI;

mongoose.connect(mongoDB)
    .then(() => console.log("Successfully connected to db"))
    .catch((error) => console.log(error));

app.use(express.static("public"));

app.use("/genres", genre);
app.use("/books", book);
app.use("/authors", author);

app.use("/reviews", review);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})