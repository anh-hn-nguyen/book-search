const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const GenreSchema = new Schema({
    list_name: { type: String, required: true},
    list_name_encoded: { type: String, required: true},
    display_name: { type: String, required: true}
});


// export model
module.exports = mongoose.model("Genre", GenreSchema);