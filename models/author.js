const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
    name: { type: String, required: true},
});


// export model
module.exports = mongoose.model("Author", AuthorSchema);