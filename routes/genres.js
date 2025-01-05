const express = require("express");
const Genre = require("../models/genre");
const BookGenre = require("../models/bookgenre");
const Book = require("../models/book");
const Author = require("../models/author");

const router = express.Router();

// get all genres
router.get("/", async function(req, res) {
    const totalCount = await Genre.countDocuments({}).exec();
    const genres = await Genre.find({}).exec();
    res.status(200).json({
        total_count: totalCount,
        items: genres
    })
})

// get one genre
router.get("/:genreId", async function(req, res) {
    const { genreId } = req.params;

    const doc = await Genre.findOne({ _id: genreId }).exec();
    res.status(200).json(doc);
})

// get books in a genre
router.get("/:genreId/books", async function(req, res) {
    const { genreId } = req.params;
    const { page = 1, per_page = 10} = req.query;

    // page: 1-index
    const startDocIndex = (page - 1) * per_page;

    const totalCount = await BookGenre.countDocuments({ genre: genreId }).exec();
    const allBooks = await BookGenre.find()
        .where("genre")
        .equals(genreId)
        .skip(startDocIndex)
        .limit(per_page)
        .populate({
            path: "book",
            populate: { path: "author" }
        })
        .populate("genre")
        .exec();

    res.status(200).json({
        total_count: totalCount,
        items: allBooks
    });
})

module.exports = router;