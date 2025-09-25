from flask_restx import fields
from server.instance import server
import pandas as pd
import os
from datetime import datetime
import ast

app, api = server.app, server.api

# Book model for API serialization
book_model = api.model('Book', {
    'title': fields.String(required=True, description='The book title'),
    'description': fields.String(description='Book description'),
    'authors': fields.List(fields.String, description='List of authors'),
    'image': fields.String(description='Book cover image URL'),
    'preview_link': fields.String(description='Preview link'),
    'publisher': fields.String(description='Publisher name'),
    'published_date': fields.String(description='Publication date'),
    'info_link': fields.String(description='Information link'),
    'categories': fields.List(fields.String, description='Book categories'),
    'ratings_count': fields.Float(description='Number of ratings')
})

# Book input model for creating/updating
book_input_model = api.model('BookInput', {
    'title': fields.String(required=True, description='The book title'),
    'description': fields.String(description='Book description'),
    'authors': fields.List(fields.String, description='List of authors'),
    'image': fields.String(description='Book cover image URL'),
    'preview_link': fields.String(description='Preview link'),
    'publisher': fields.String(description='Publisher name'),
    'published_date': fields.String(description='Publication date'),
    'info_link': fields.String(description='Information link'),
    'categories': fields.List(fields.String, description='Book categories'),
    'ratings_count': fields.Float(description='Number of ratings')
})

class BookService:
    def __init__(self):
        # Get the path to the CSV file
        csv_path = os.environ.get('BOOKS_DATA_PATH', 'data/books_data.csv')
        if not os.path.isabs(csv_path):
            current_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(current_dir, '..', csv_path)
        self.csv_path = os.path.abspath(csv_path)
        self.df = None
        self.load_data()
    
    def load_data(self):
        """Load book data from CSV file"""
        try:
            # Due to large file size, we'll load in chunks
            chunk_size = 1000
            chunks = []
            for chunk in pd.read_csv(self.csv_path, chunksize=chunk_size, nrows=10000):  # Limit to first 10k rows
                chunks.append(chunk)
            
            self.df = pd.concat(chunks, ignore_index=True)
            
            # Clean and process the data
            self.df = self.df.fillna('')
            
            # Parse authors and categories from string representation of lists
            self.df['authors'] = self.df['authors'].apply(self._parse_list_string)
            self.df['categories'] = self.df['categories'].apply(self._parse_list_string)
            
            # Add an index as book ID
            self.df['id'] = self.df.index
            
        except Exception as e:
            print(f"Error loading book data: {e}")
            # Create empty DataFrame with expected columns
            self.df = pd.DataFrame(columns=[
                'Title', 'description', 'authors', 'image', 'previewLink',
                'publisher', 'publishedDate', 'infoLink', 'categories', 'ratingsCount', 'id'
            ])
    
    def _parse_list_string(self, list_str):
        """Parse string representation of list into actual list"""
        if not list_str or list_str == '':
            return []
        try:
            # Handle cases where it's already a list or a string representation of a list
            if isinstance(list_str, str):
                # Try to evaluate as Python literal
                parsed = ast.literal_eval(list_str)
                if isinstance(parsed, list):
                    return parsed
                else:
                    return [str(parsed)]
            elif isinstance(list_str, list):
                return list_str
            else:
                return [str(list_str)]
        except:
            # If parsing fails, return as single-item list
            return [str(list_str)] if list_str else []
    
    def get_all_books(self, page=1, per_page=20, search=None, category=None):
        """Get all books with pagination and optional filtering"""
        df_filtered = self.df.copy()
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            df_filtered = df_filtered[
                df_filtered['Title'].str.lower().str.contains(search_lower, na=False) |
                df_filtered['description'].str.lower().str.contains(search_lower, na=False) |
                df_filtered['authors'].apply(lambda x: any(search_lower in str(author).lower() for author in x))
            ]
        
        # Apply category filter
        if category:
            category_lower = category.lower()
            df_filtered = df_filtered[
                df_filtered['categories'].apply(lambda x: any(category_lower in str(cat).lower() for cat in x))
            ]
        
        # Calculate pagination
        total = len(df_filtered)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        # Get paginated results
        paginated_df = df_filtered.iloc[start_idx:end_idx]
        
        books = []
        for _, row in paginated_df.iterrows():
            books.append(self._row_to_dict(row))
        
        return {
            'books': books,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        }
    
    def get_book_by_id(self, book_id):
        """Get a specific book by ID"""
        try:
            book_id = int(book_id)
            if book_id < 0 or book_id >= len(self.df):
                return None
            
            row = self.df.iloc[book_id]
            return self._row_to_dict(row)
        except:
            return None
    
    def search_books_by_title(self, title):
        """Search books by title"""
        matching_books = self.df[self.df['Title'].str.contains(title, case=False, na=False)]
        
        books = []
        for _, row in matching_books.iterrows():
            books.append(self._row_to_dict(row))
        
        return books
    
    def get_books_by_author(self, author):
        """Get books by a specific author"""
        author_lower = author.lower()
        matching_books = self.df[
            self.df['authors'].apply(lambda x: any(author_lower in str(a).lower() for a in x))
        ]
        
        books = []
        for _, row in matching_books.iterrows():
            books.append(self._row_to_dict(row))
        
        return books
    
    def get_books_by_category(self, category):
        """Get books by category"""
        category_lower = category.lower()
        matching_books = self.df[
            self.df['categories'].apply(lambda x: any(category_lower in str(cat).lower() for cat in x))
        ]
        
        books = []
        for _, row in matching_books.iterrows():
            books.append(self._row_to_dict(row))
        
        return books
    
    def get_all_categories(self):
        """Get all unique categories"""
        categories = set()
        for cat_list in self.df['categories']:
            categories.update(cat_list)
        return sorted([cat for cat in categories if cat])
    
    def get_all_authors(self):
        """Get all unique authors"""
        authors = set()
        for author_list in self.df['authors']:
            authors.update(author_list)
        return sorted([author for author in authors if author])
    
    def _row_to_dict(self, row):
        """Convert DataFrame row to dictionary"""
        return {
            'id': int(row['id']),
            'title': row['Title'],
            'description': row['description'],
            'authors': row['authors'],
            'image': row['image'],
            'preview_link': row['previewLink'],
            'publisher': row['publisher'],
            'published_date': row['publishedDate'],
            'info_link': row['infoLink'],
            'categories': row['categories'],
            'ratings_count': float(row['ratingsCount']) if pd.notna(row['ratingsCount']) and row['ratingsCount'] != '' else None
        }

# Create book service instance
book_service = BookService()