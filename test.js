require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("node:fs/promises");
const Genre = require("./models/genre");
const Author = require("./models/author");
const Book = require("./models/book");
const BookGenre = require("./models/bookgenre");

mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URI;

const key = process.env.NYT_BOOK_API_KEY;
const bookBaseUrl = process.env.NYT_BOOK_API_URL;

async function main() {
    try {
        await mongoose.connect(mongoDB);
        console.log("successfully connected to db");

        const genreCodes = await Genre.find().select("list_name_encoded").limit(18).exec();

        console.log(genreCodes);

        await addData(genreCodes);

    } catch (err) {
        console.error(err);
    }

}

async function addData(genreCodes) {
    if (genreCodes.length == 0) {
        return;
    }
    const genreCode = genreCodes.pop()["list_name_encoded"];
    await addDataByGenre(genreCode);

    console.log(`FINISH adding data for ${genreCode}\nNum REMAINING genres: ${genreCodes.length}`);

    setTimeout(()=> {
        addData(genreCodes);
    }, 10000);
    
}

async function addBook(bookData) {
    const authorName = bookData["author"].trim();
    
    const author = await Author.findOne({name: authorName}).exec();

    const bookInstance = new Book({
        title: bookData["title"],
        author: author._id,
        amazon_product_url: bookData["amazon_product_url"],
        book_image: bookData["book_image"],
        description: bookData["description"]
    })

    const savedBook = await bookInstance.save();
    console.log(`success adding book ${savedBook.title}`);
    return savedBook;

}


async function addAuthor(name) {
    const authorInstance = new Author({
        name: name
    })

    const savedAuthor = await authorInstance.save();
    console.log(`success adding ${name}`);
    return savedAuthor;
}
async function addGenre(genreData) {
    const genreInstance = new Genre({
        list_name: genreData["list_name"],
        list_name_encoded: genreData["list_name_encoded"],
        display_name: genreData["display_name"]
    })

    await genreInstance.save();
    console.log(`success adding ${genreData["display_name"]}`);
}

async function fetchOverview() {
    let url = `${bookBaseUrl}/overview.json?api-key=${key}`;
    
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`${response.statusText}`);
    }
    const resJson = await response.json();

    await fs.writeFile(`${module.path}/db/overview-books.json`, JSON.stringify(resJson));
}

async function addDataByGenre(genreCode, offset=0) {
    console.log(genreCode);
    // fetch data from NYT
    const url = `${bookBaseUrl}/current/${genreCode}?api-key=${key}&offset=${offset}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw Error(`${response.statusText}`);
    }
    const jsonRes = await response.json();

    const totalCount = jsonRes["num_results"];
    const books = jsonRes["results"]["books"];
    console.log(totalCount);
    const genreDoc = await Genre.findOne({ list_name_encoded: genreCode }).exec();

    await (async function() {
        for (const bookData of books) {
            console.log(`processing book ${bookData["title"]}`);
            // create author if not exist
            const authorName = bookData["author"].trim();
            if (!authorName) {
                continue;
            }
            let authorDoc = await Author.findOne({ name: authorName }).exec();
            
            console.log(`author doc ${authorDoc}`);
            if (!authorDoc) {
                // create author
                const newAuthor = new Author({
                    name: authorName
                })
                authorDoc = await newAuthor.save();
                console.log(`success adding author ${authorName}`);
            } else {
                console.log(`${authorName} exists`);
            }
            
            
            // create book if not exist
            const bookTitle = bookData["title"];
            let bookDoc = await Book.findOne({
                title: bookTitle,
                author: authorDoc._id
            }).exec();
            console.log(`book doc ${bookDoc}`);

            if (!bookDoc) {
                const newBook = new Book({
                    title: bookTitle,
                    author: authorDoc._id,
                    amazon_product_url: bookData["amazon_product_url"],
                    book_image: bookData["book_image"],
                    description: bookData["description"]
                })
            
                bookDoc = await newBook.save();
                console.log(`sucess adding book ${bookTitle}`);
            } else {
                console.log(`book ${bookTitle} exists`);
            }
    
            // create book genre if not exist
    
            let bookGenreDoc = await BookGenre.findOne({
                genre: genreDoc._id,
                book: bookDoc._id
            }).exec();
            console.log(`book genre doc ${bookGenreDoc}`);

            if (!bookGenreDoc) {
                const newBookGenreDoc = new BookGenre({
                    genre: genreDoc._id,
                    book: bookDoc._id
                });
                await newBookGenreDoc.save();
                console.log(`sucess adding book genre ${bookTitle} ${genreCode}`);
            } else {
                console.log(`book genre ${bookTitle} ${genreCode} exists`)
            }
        }
    })();
    
    const nextOffset = offset + 20;
    if (nextOffset < totalCount) {
        setTimeout(async () => {
            await addDataByGenre(genreCode, offset=nextOffset);
        }, 3000);
    }

}


main();