const express = require("express");
const Author = require("../models/author");
const Book = require("../models/book");
const Genre = require("../models/genre");
const BookGenre = require("../models/bookgenre");

const router = express.Router();


router.get("/", async function(req, res) {
    const { q } = req.query;
    
    const terms = q ? q.trim().split(/\s+/).map(term => term.toLowerCase()) : [];
    
    const regex = new RegExp(`${terms.join("\.*")}` , 'i');

    const totalCount = await Author.countDocuments({ name: regex }).exec();
    const docs = await Author.find({name: regex}).limit(10).exec();

    res.json({
        total_count: totalCount,
        items: docs
    })
})

router.get("/:authorId/books", async function(req, res) {
    const { authorId } = req.params;

    const bookDocs = await Book.find()
        .where("author")
        .equals(authorId)
        .select("_id")
        .exec();

    const bookDocIds = bookDocs.map(doc => doc._id);

    const totalCount = await BookGenre.countDocuments({ book : { $in: bookDocIds}}).exec();

    const items = await BookGenre.find()
        .where("book")
        .in(bookDocIds)
        .populate({
            path: "book",
            populate: { path: "author" }
        })
        .populate("genre")
        .exec();

    res.json({
        total_count: totalCount,
        items: items
    });
    
})
module.exports = router;
