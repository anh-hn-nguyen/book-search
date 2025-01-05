const baseUrl = `${document.location.origin}`;
const imageFileNames = ["images/br_1.jpg", "images/br_2.jpg", "images/br_3.jpg"];

const bookSectionHeader = document.querySelector("main .book-section h2");
const publishedDateInput = document.querySelector("#published-date");
const authorSearchInput = document.querySelector("#authorSearch");
const authorSuggestionsDataList = document.querySelector("#authorSuggestions");
const searchSubmitBtn = document.querySelector("#searchSubmit");
const bookResultSection = document.querySelector("section.books-result");
const reviewsResultSection = document.querySelector("section.reviews-result");
const previousBtn = document.querySelector("section.book-section nav > *:first-child")
const nextBtn = document.querySelector("section.book-section nav > *:last-child")
const genreLink = document.querySelector("header nav .genre");
const genreMenu = document.querySelector("header nav #genre-wrapper > ul");
const statusBox = document.querySelector("#status-box");

let pageNumber = 0;
const numItemsPerPage = 10;

let selectedGenre  = "";
let selectedAuthor = "";
let authorQuery = "";

let authorSearchTimer = null;

function reset() {
    selectedAuthor = "";
    selectedGenre = "";
    authorQuery = "";
    pageNumber = 1;
    previousBtn.disabled = true;
    nextBtn.disabled = false;
}

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



authorSearchInput.addEventListener("input", (event) => {
    clearTimeout(authorSearchTimer);

    const inputValue = event.target.value;
    authorSearchTimer = setTimeout(()=> {
        fetchAuthors(inputValue);
    }, 500);
})

searchSubmitBtn.addEventListener("click", handleSearchSubmit);

async function handleSearchSubmit(event) {
    const value = authorSearchInput.value.trim().toLowerCase();
    if (!value) return;

    event.preventDefault();

    reset();
    authorQuery = value.split(/\s+/).join("+");
    
    fetchBooks();

}


function fetchAuthors(q = "") {
    let url = `${baseUrl}/authors`;
    if (q) {
        url += `?q=${q.trim().split(/\s+/).join("+")}`;
    }

    fetch(url)
        .then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.statusText}`);
            }
            return res.json();
        })
        .then((json) => {
            displayAuthors(json["items"]);
        })
    
}

function displayAuthors(items) {
    while (authorSuggestionsDataList.firstChild) {
        authorSuggestionsDataList.removeChild(authorSuggestionsDataList.firstChild);
    }

    for (const item of items) {
        const option = document.createElement("option");
        option.value = item["name"];

        authorSuggestionsDataList.appendChild(option);
    }
}

function fetchBooks() {
    // select path to fetch
    let url = `${baseUrl}/books`;

    if (selectedGenre) {
        url = `${baseUrl}/genres/${selectedGenre}/books`;
    }
    if (selectedAuthor) {
        url = `${baseUrl}/authors/${selectedAuthor}/books`;
    }
    
    // add query params
    url += `?page=${pageNumber}&per_page=${numItemsPerPage}`;

    if (!selectedGenre && !selectedAuthor && authorQuery) {
        url += `&author=${authorQuery}`;
    }


    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then ((json) => {
            // check whether this is last page
            nextBtn.disabled = (pageNumber * numItemsPerPage) >= json["total_count"];
            displayBooks(json["items"]);
        })
        .catch((e) => console.error(e));

    if (pageNumber === 1) {
        fetchReviews();
    }

}


function displayBooks(items) {
    // this function displays <= numItemsOnPage

    while (bookResultSection.firstChild) {
        bookResultSection.removeChild(bookResultSection.firstChild);
    }

    if (items.length === 0) {
        const div = document.createElement("div");
        div.classList.add("status");

        const p = document.createElement("p");
        p.textContent = "Sorry, no other results to display";
        div.appendChild(p);
        bookResultSection.appendChild(div);
    }


    for (const item of items) {
        const book = item["book"];
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
        authorPara.textContent = `by ${book["author"]["name"]}`;

        // description
        const descPara = document.createElement("p");
        descPara.textContent = book["description"];

        article.appendChild(divImg);
        article.appendChild(h3);
        article.appendChild(authorPara);
        article.appendChild(descPara);

        const genrePara = document.createElement("p");
        genrePara.textContent = item["genre"]["display_name"];
        genrePara.setAttribute("class", "genre-name");
        article.appendChild(genrePara);
        

        articleLink.append(article);

        bookResultSection.appendChild(articleLink);
    }
}


nextBtn.addEventListener("click", (event) => {
    event.preventDefault();
    pageNumber++;

    // enable previous btn
    previousBtn.disabled = false;

    fetchBooks();
    

})

previousBtn.addEventListener("click", (event) => {
    event.preventDefault();
    pageNumber--;

    // enable next btn
    nextBtn.disabled = false;

    if (pageNumber == 1) {
        previousBtn.disabled = true;
    }

   fetchBooks();
})

function fetchGenres() {
    let url = `${baseUrl}/genres`;


    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.statusText}`);
            }
            return response.json();
        })
        .then((json) => {
            displayGenres(json["items"]);
            
        })
}

function displayGenres(genres) {
    
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
        itemLink.setAttribute("data-genre-id", genre._id);
        itemLink.textContent = genre["display_name"];

        itemLink.addEventListener("click", (event) => {
            event.preventDefault();
            reset();
            bookSectionHeader.textContent = `${itemLink.textContent}`;
            selectedGenre = itemLink.getAttribute("data-genre-id");
            fetchBooks();
        })

        listItem.appendChild(itemLink);
        genreMenu.appendChild(listItem);
    }

}

function fetchReviews() {
    let url = `${baseUrl}/reviews`;

    if (selectedGenre) {
        url += `?genreId=${selectedGenre}`;
    }

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
    reset();
    fetchGenres();
    fetchBooks();
}


initialize();