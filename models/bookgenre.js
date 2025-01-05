const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BookGenreSchema = new Schema({
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    genre: { type: Schema.Types.ObjectId, ref: "Genre", required: true }
});


// export model
module.exports = mongoose.model("BookGenre", BookGenreSchema);