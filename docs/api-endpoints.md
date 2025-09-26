# API Endpoints (Quick Reference)

Base URL
- Local docker-compose: http://localhost:5100
- Ingress: https://api.<domain>

Books
- GET `/books/` – List books with pagination and filters
  - Query: `page`, `per_page`, `search`, `category`
- GET `/books/{book_id}` – Get book by ID
- GET `/books/search/{title}` – Search books by title
- GET `/books/author/{author}` – Books by author
- GET `/books/category/{category}` – Books by category
- GET `/books/categories` – List categories
- GET `/books/authors` – List authors

Ratings
- GET `/ratings/` – List ratings with pagination and filters
  - Query: `page`, `per_page`, `book_id`, `user_id`, `min_score`, `max_score`
- GET `/ratings/{review_id}` – Get rating by review ID
- GET `/ratings/book/{book_id}` – Ratings for a book
- GET `/ratings/user/{user_id}` – Ratings by user
- GET `/ratings/stats/{book_id}` – Rating stats for a book
- GET `/ratings/top-rated?limit={n}&min_ratings={m}` – Top rated books
- GET `/ratings/search?q={text}` – Search reviews

Docs
- Swagger UI: `/swagger`

References
- Implementations: [`src/api/resources/books.py`](../src/api/resources/books.py), [`src/api/resources/ratings.py`](../src/api/resources/ratings.py)
- Models/services: [`src/api/models/book.py`](../src/api/models/book.py), [`src/api/models/rating.py`](../src/api/models/rating.py)
