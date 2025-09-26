# Data Model

This project uses two CSV files mounted into the API container. The API reads them via pandas and exposes endpoints for books and ratings.

Files
- `books_data.csv` (default path `/app/data/books_data.csv`)
- `books_rating.csv` (default path `/app/data/books_rating.csv`)

Environment variables
- `BOOKS_DATA_PATH`: path to books CSV
- `BOOKS_RATING_PATH`: path to ratings CSV

books_data.csv (columns)
- Title: string – book title
- description: string – description text
- authors: list (string-encoded) – parsed to list
- image: string – cover image URL
- previewLink: string – preview link
- publisher: string
- publishedDate: string
- infoLink: string
- categories: list (string-encoded) – parsed to list
- ratingsCount: number – count of ratings

books_rating.csv (columns)
- Id: string – book ID
- Title: string – book title
- Price: string
- User_id: string
- profileName: string
- review/helpfulness: string
- review/score: number (1-5)
- review/time: number (unix timestamp)
- review/summary: string
- review/text: string

References
- Parsing and mapping implemented in [`src/api/models/book.py`](../src/api/models/book.py) and [`src/api/models/rating.py`](../src/api/models/rating.py).
- Verification job ensures these files exist and are readable: [`helm/templates/verification/job.yaml`](../helm/templates/verification/job.yaml).
