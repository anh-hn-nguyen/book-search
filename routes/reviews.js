require("dotenv").config();

const express = require("express");

const router = express.Router();
const Genre = require("../models/genre");

const reviewKey = process.env.NYT_ARTICLE_API_KEY;
const reviewBaseUrl = process.env.NYT_ARTICLE_API_URL;

router.get("/", async function(req, res){
    const { genreId } = req.query;

    let url = `${reviewBaseUrl}?api-key=${reviewKey}&fq=news_desk%3A(%22Books%22)%20AND%20type_of_material%3A(%22Review%22)`;

    if (genreId) {
        const doc = await Genre.findOne({ _id: genreId }).exec();
        const nameParts = doc.list_name.split(" ");
        const lastIndex = nameParts.length - 1;
        const midIndex = Math.floor(lastIndex / 2);
        const keyWord = ["books", "e-book", "series", "hardcover", "paperback"].includes(nameParts[lastIndex].toLowerCase()) ? nameParts[midIndex] : nameParts[lastIndex];
        url += `&q=${keyWord}`;
        console.log(url);
    }

    const result = await fetch(url);
    const resultBody = await result.json();

    res.status(200).json(resultBody);
})

module.exports = router;