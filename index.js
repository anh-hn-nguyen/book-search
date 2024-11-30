// Global
const key = "kkOEmG1rghZxj6iDArqzk97OHLJVFY3l";
const reviewKey = "Op54d2FsMAlDvaioUvY6pzofTCme2pPH";

const bookBaseUrl = "https://api.nytimes.com/svc/books/v3/lists";
const reviewBaseUrl = "https://api.nytimes.com/svc/search/v2/articlesearch.json";
// const mockBaseUrl = "http://localhost:5500/book-search/db";

const imageFileNames = ["images/br_1.jpg", "images/br_2.jpg", "images/br_3.jpg"];

const bookSectionHeader = document.querySelector("main .book-section h2");
const publishedDateInput = document.querySelector("#published-date");
const resultSection = document.querySelector("section.books-result");
const reviewsResultSection = document.querySelector("section.reviews-result");
const previousBtn = document.querySelector("section.book-section nav > *:first-child")
const nextBtn = document.querySelector("section.book-section nav > *:last-child")
const genreLink = document.querySelector("header nav .genre");
const genreMenu = document.querySelector("header nav #genre-wrapper > ul");

let pageNumber = 0;
const numItemsPerPage = 20;
let allBooks = []; // overview books
let params = {
    publishedDate: "",
    selectedGenre: "",
    offset: 0
};

publishedDateInput.addEventListener("input", (event) => {
    firstResultPageSetup();

    params = {...params, publishedDate: `${event.target.value}-01`};
    fetchResult();
})

genreLink.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const currClassName = genreMenu.getAttribute("class");
    if (currClassName === "active") {
        genreMenu.setAttribute("class", "inactive");
    } else {
        genreMenu.setAttribute("class", "active");
    }

    genreMenu.parentElement.classList.toggle("list-item-active");
})

document.addEventListener("click", (event) => {
    genreMenu.setAttribute("class", "inactive");
    genreMenu.parentElement.classList.remove("list-item-active");
})



function fetchResult() {
    if (params.genre) {
        fetchByGenre();
    } else {
        fetchOverview();
    }
}

function firstResultPageSetup() {
    pageNumber = 0;
    previousBtn.disabled = true;
    nextBtn.disabled = false;
}


function fetchByGenre() {
    const { genre, offset } = params;

    let publishedDate = params.publishedDate ? params.publishedDate: "current";
    
    let url = `${bookBaseUrl}/${publishedDate}/${genre}?offset=${offset}&api-key=${key}`;

    // MOCK URL
    // url = `${mockBaseUrl}/chilren-books.json`;

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then ((json) => {
            const books = json["num_results"] === 0 ? [] : json["results"]["books"];
            displayBooks(books);
        })
        .catch((e) => console.error(e));

    fetchReviews();
}

// if no genre indicated, display overview top 5 books in each genre
function fetchOverview() {
    let url = `${bookBaseUrl}/overview.json?api-key=${key}`;

    if (params.publishedDate) {
        url += `&published_date=${params.publishedDate}`;
    }

    // MOCK URL
    // url = `${mockBaseUrl}/overview-books.json`;

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`${response.statusText}`);
            }
            return response.json();
        })
        .then((json) => {
            // extract the list of books
            allBooks = [];
            for (const list of json["results"]["lists"]) {
                for (const book of list["books"]) {
                    book["genre"] = list["display_name"];
                    allBooks.push(book);
                }
            }
            // display the books
            displayBooks(allBooks);

        })
        .catch((e) => console.error(e));

    fetchReviews();

}

function displayBooks(books, startIndex=0) {
    // this function displays <= numItemsOnPage

    while (resultSection.firstChild) {
        resultSection.removeChild(resultSection.firstChild);
    }

    if (books.length === 0 || startIndex >= books.length) {
        const p = document.createElement("p");
        p.textContent = "Sorry, no other results to display";
        resultSection.appendChild(p);

        nextBtn.disabled = true;
    }

    const endIndex = Math.min(startIndex + numItemsPerPage, books.length);

    for (let i = startIndex; i < endIndex; i++) {
        const book = books[i];

        const articleLink = document.createElement("a");
        articleLink.href = book["amazon_product_url"];
        articleLink.target = "_blank";
        articleLink.title = "Buy the book on Amazon";

        const article = document.createElement("article");
    
        // div img
        const divImg = document.createElement("div");
        const img = document.createElement("img");
        img.src = book["book_image"];
        divImg.appendChild(img);

        // title
        const h3 = document.createElement("h3");
        h3.textContent = book["title"];

        const authorPara = document.createElement("p");
        authorPara.textContent = `by ${book["author"]}`;

        // description
        const descPara = document.createElement("p");
        descPara.textContent = book["description"];

        article.appendChild(divImg);
        article.appendChild(h3);
        article.appendChild(authorPara);
        article.appendChild(descPara);

        // (optional) genre
        if (book["genre"]) {
            const genrePara = document.createElement("p");
            genrePara.textContent = book["genre"];
            genrePara.setAttribute("class", "genre-name");
            article.appendChild(genrePara);
        }
       

        articleLink.append(article);

        resultSection.appendChild(articleLink);
    }
}


nextBtn.addEventListener("click", (event) => {
    event.preventDefault();
    pageNumber++;

    // enable previous btn
    previousBtn.disabled = false;

    // load next 20 for overview
    const offset = pageNumber * numItemsPerPage;
    if (params.genre) {
        params = {...params, offset: offset};
        fetchByGenre();
    } else {
        displayBooks(allBooks, offset);
    }

})

previousBtn.addEventListener("click", (event) => {
    event.preventDefault();
    pageNumber--;

    // enable next btn
    nextBtn.disabled = false;

    if (pageNumber == 0) {
        previousBtn.disabled = true;
    }

    const offset = pageNumber * numItemsPerPage;

    if (params.genre) {
        params = {...params, offset: offset};
        fetchByGenre();
    } else {
        displayBooks(allBooks, offset);
    }
})

function fetchGenres() {
    let url = `${bookBaseUrl}/names.json?api-key=${key}`;

    // MOCK URL
    // url = `${mockBaseUrl}/genres.json`;

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.statusText}`);
            }
            return response.json();
        })
        .then((json) => {
            if (json["num_results"] > 0) {
                displayGenres(json["results"]);

            }
        })
}

function displayGenres(genres) {
    // genres = genres.filter(item => item["display_name"].length <= 30);
    
    // menu position
    const parent = genreMenu.parentElement;
    const menuParentStyle = getComputedStyle(parent);
    genreMenu.style.top = menuParentStyle.height + menuParentStyle.paddingTop;
    genreMenu.style.left = 0;

    
    genres.sort((a, b) => a["display_name"].localeCompare(b["display_name"]));

    while (genreMenu.firstChild) {
        genreMenu.removeChild(genreMenu.firstChild);
    }

    for (const genre of genres) {
        const listItem = document.createElement("li");
        const itemLink = document.createElement("a");
        itemLink.href = "";
        itemLink.setAttribute("data-genre-id", genre["list_name_encoded"]);
        itemLink.textContent = genre["display_name"];

        itemLink.addEventListener("click", (event) => {
            event.preventDefault();
            firstResultPageSetup();
            bookSectionHeader.textContent = `${itemLink.textContent}`;
            params = {...params, genre: itemLink.getAttribute("data-genre-id"), offset: 0};
            fetchResult();
        })

        listItem.appendChild(itemLink);
        genreMenu.appendChild(listItem);
    }

}

function fetchReviews() {
    let url = `${reviewBaseUrl}?api-key=${reviewKey}&fq=news_desk%3A(%22Books%22)%20AND%20type_of_material%3A(%22Review%22)`;
    if (params.genre) {
        url += `&q=${params.genre}`;
    }

    // MOCK URL
    // url = `${mockBaseUrl}/reviews.json`;

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`${response.statusText}`);
            }
            return response.json();
        })
        .then((json) => {
            displayReviews(json["response"]["docs"]);
        })
}

function checkImages(reviews) {
    for (const review of reviews) {
        if (review.multimedia.length > 0) {
            return;
        }
    }

    // if no images are found at all, append images to the first 3 reviews
    for (let i = 0; i < Math.min(3, reviews.length); i++) {
        const review = reviews[i];
        review.multimedia.push({
            url: imageFileNames[i],
            modified: true
        })
        reviews[i] = review;
    }
}

function displayReviews(reviews) {
    // display at most 3 reviews
    while (reviewsResultSection.firstChild) {
        reviewsResultSection.removeChild(reviewsResultSection.firstChild);
    }

    checkImages(reviews);

    let selectedReviews = 0;
    let i = 0;

    while (i < reviews.length && selectedReviews < 3) {
        const review = reviews[i];
        if (review.multimedia.length == 0) {
            i++;
            continue;
        }
        selectedReviews++;

        const articleLink = document.createElement("a");
        articleLink.href = review["web_url"];
        articleLink.target = "_blank";
        
        const article = document.createElement("article");

        // heading
        const h3 = document.createElement("h3");
        h3.textContent = review["headline"]["main"];

        // content: img + description
        const divContent = document.createElement("div");

        
        // create this if there is image
        const divImg = document.createElement("div");
        const img = document.createElement("img");
        const media = review.multimedia[0];
        
        img.src = (!media.modified) ? `https://www.nytimes.com/${media.url}`: `${media.url}`;
        img.alt = media.caption;
        divImg.appendChild(img);
        
        const descPara = document.createElement("p");
        descPara.textContent = review["snippet"];
        
        divContent.appendChild(divImg);
        divContent.appendChild(descPara);

        article.appendChild(h3);
        article.appendChild(divContent);
        articleLink.appendChild(article)

        reviewsResultSection.appendChild(articleLink);
        i++;
    }
}

function initialize() {
    fetchGenres();
    firstResultPageSetup();
    fetchOverview();
}


initialize();