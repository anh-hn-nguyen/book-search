const mongoose = require("mongoose");
const author = require("./author");

const Schema = mongoose.Schema;

const BookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "Author"},
    amazon_product_url: String,
    book_image: String,
    description: String
});


// export model
module.exports = mongoose.model("Book", BookSchema);