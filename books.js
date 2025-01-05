const express = require("express");
const BookGenre = require("./models/bookgenre");
const Book = require("./models/book");
const Author = require("./models/author");
const Genre = require("./models/genre");

const router = express.Router();

router.get("/", async function(req, res) {
    const { page = 1, per_page = 10, author = ""} = req.query;

    const terms = author ? author.trim().split(/\s+/).map(term => term.toLowerCase()) : [];

    const regex = new RegExp(`${terms.join("\.*")}` , 'i');

    const authorDocs = await Author.find({ name: regex}).select("_id").exec();
    const authorDocIds = authorDocs.map(doc => doc._id);

    const bookDocs = await Book.find( {author : { $in: authorDocIds }})
        .select("_id")
        .exec();

    const bookDocIds = bookDocs.map(doc => doc._id);
    console.log(bookDocIds.length);

    // page: 1-index
    const startDocIndex = (page - 1) * per_page;
    
    const totalCount = await BookGenre.countDocuments({ book: { $in: bookDocIds} }).exec();
    const items = await BookGenre.find()
        .where("book")
        .in(bookDocIds)
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
        items: items
    });
})

module.exports = router;