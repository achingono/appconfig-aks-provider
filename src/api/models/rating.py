from flask_restx import fields
from server.instance import server
import pandas as pd
import os
import sys
from datetime import datetime

app, api = server.app, server.api

# Rating model for API serialization
rating_model = api.model('Rating', {
    'id': fields.String(required=True, description='Book ID'),
    'title': fields.String(description='Book title'),
    'price': fields.String(description='Book price'),
    'user_id': fields.String(description='User ID'),
    'profile_name': fields.String(description='User profile name'),
    'helpfulness': fields.String(description='Review helpfulness ratio'),
    'score': fields.Float(description='Review score (1-5)'),
    'time': fields.Integer(description='Review timestamp'),
    'summary': fields.String(description='Review summary'),
    'text': fields.String(description='Full review text')
})

# Rating input model for creating/updating
rating_input_model = api.model('RatingInput', {
    'id': fields.String(required=True, description='Book ID'),
    'title': fields.String(description='Book title'),
    'price': fields.String(description='Book price'),
    'user_id': fields.String(description='User ID'),
    'profile_name': fields.String(description='User profile name'),
    'helpfulness': fields.String(description='Review helpfulness ratio'),
    'score': fields.Float(required=True, description='Review score (1-5)'),
    'time': fields.Integer(description='Review timestamp'),
    'summary': fields.String(description='Review summary'),
    'text': fields.String(description='Full review text')
})

# Rating statistics model
rating_stats_model = api.model('RatingStats', {
    'book_id': fields.String(description='Book ID'),
    'title': fields.String(description='Book title'),
    'total_ratings': fields.Integer(description='Total number of ratings'),
    'average_score': fields.Float(description='Average rating score'),
    'score_distribution': fields.Raw(description='Distribution of scores')
})

class RatingService:
    def __init__(self):
        # Get the path to the CSV file
        csv_path = os.environ.get('BOOKS_RATING_PATH', 'data/books_rating.csv')
        if not os.path.isabs(csv_path):
            current_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(current_dir, '..', csv_path)
        self.csv_path = os.path.abspath(csv_path)
        self.df = None
        self.load_data()
    
    def load_data(self):
        """Load rating data from CSV file"""
        try:
            # Due to large file size, we'll load in chunks
            chunk_size = 1000
            chunks = []
            for chunk in pd.read_csv(self.csv_path, chunksize=chunk_size, nrows=10000):  # Limit to first 10k rows
                chunks.append(chunk)
            
            self.df = pd.concat(chunks, ignore_index=True)
            
            # Clean and process the data
            self.df = self.df.fillna('')
            
            # Convert score to numeric
            self.df['review/score'] = pd.to_numeric(self.df['review/score'], errors='coerce')
            self.df['review/time'] = pd.to_numeric(self.df['review/time'], errors='coerce')
            
            # Add row index as review ID
            self.df['review_id'] = self.df.index
            
        except Exception as e:
            print(f"Error loading rating data: {e}")
            # Create empty DataFrame with expected columns
            self.df = pd.DataFrame(columns=[
                'Id', 'Title', 'Price', 'User_id', 'profileName', 
                'review/helpfulness', 'review/score', 'review/time', 
                'review/summary', 'review/text', 'review_id'
            ])
    
    def get_all_ratings(self, page=1, per_page=20, book_id=None, user_id=None, min_score=None, max_score=None):
        """Get all ratings with pagination and optional filtering"""
        df_filtered = self.df.copy()
        
        # Apply filters
        if book_id:
            df_filtered = df_filtered[df_filtered['Id'].astype(str) == str(book_id)]
        
        if user_id:
            df_filtered = df_filtered[df_filtered['User_id'] == user_id]
        
        if min_score is not None:
            df_filtered = df_filtered[df_filtered['review/score'] >= min_score]
        
        if max_score is not None:
            df_filtered = df_filtered[df_filtered['review/score'] <= max_score]
        
        # Calculate pagination
        total = len(df_filtered)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        # Get paginated results
        paginated_df = df_filtered.iloc[start_idx:end_idx]
        
        ratings = []
        for _, row in paginated_df.iterrows():
            ratings.append(self._row_to_dict(row))
        
        return {
            'ratings': ratings,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        }
    
    def get_rating_by_id(self, review_id):
        """Get a specific rating by review ID"""
        try:
            review_id = int(review_id)
            if review_id < 0 or review_id >= len(self.df):
                return None
            
            row = self.df.iloc[review_id]
            return self._row_to_dict(row)
        except:
            return None
    
    def get_ratings_for_book(self, book_id):
        """Get all ratings for a specific book"""
        book_ratings = self.df[self.df['Id'].astype(str) == str(book_id)]
        
        ratings = []
        for _, row in book_ratings.iterrows():
            ratings.append(self._row_to_dict(row))
        
        return ratings
    
    def get_ratings_by_user(self, user_id):
        """Get all ratings by a specific user"""
        user_ratings = self.df[self.df['User_id'] == user_id]
        
        ratings = []
        for _, row in user_ratings.iterrows():
            ratings.append(self._row_to_dict(row))
        
        return ratings
    
    def get_book_rating_stats(self, book_id):
        """Get rating statistics for a specific book"""
        book_ratings = self.df[self.df['Id'].astype(str) == str(book_id)]
        
        if book_ratings.empty:
            return None
        
        # Calculate statistics
        scores = book_ratings['review/score'].dropna()
        
        if scores.empty:
            return None
        
        # Score distribution
        score_distribution = {}
        for i in range(1, 6):
            score_distribution[str(i)] = int((scores == i).sum())
        
        return {
            'book_id': str(book_id),
            'title': book_ratings['Title'].iloc[0] if not book_ratings['Title'].empty else '',
            'total_ratings': len(scores),
            'average_score': float(scores.mean()),
            'score_distribution': score_distribution
        }
    
    def get_top_rated_books(self, limit=10, min_ratings=5):
        """Get top rated books with minimum number of ratings"""
        # Group by book and calculate stats
        book_stats = self.df.groupby('Id').agg({
            'Title': 'first',
            'review/score': ['count', 'mean']
        }).reset_index()
        
        # Flatten column names
        book_stats.columns = ['book_id', 'title', 'rating_count', 'average_score']
        
        # Filter by minimum ratings and sort by average score
        top_books = book_stats[
            (book_stats['rating_count'] >= min_ratings) & 
            (book_stats['average_score'].notna())
        ].sort_values('average_score', ascending=False).head(limit)
        
        result = []
        for _, row in top_books.iterrows():
            result.append({
                'book_id': str(row['book_id']),
                'title': row['title'],
                'total_ratings': int(row['rating_count']),
                'average_score': float(row['average_score'])
            })
        
        return result
    
    def search_reviews(self, search_text, page=1, per_page=20):
        """Search reviews by text content"""
        search_lower = search_text.lower()
        
        # Search in summary and text fields
        matching_reviews = self.df[
            self.df['review/summary'].str.lower().str.contains(search_lower, na=False) |
            self.df['review/text'].str.lower().str.contains(search_lower, na=False)
        ]
        
        # Calculate pagination
        total = len(matching_reviews)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        # Get paginated results
        paginated_df = matching_reviews.iloc[start_idx:end_idx]
        
        reviews = []
        for _, row in paginated_df.iterrows():
            reviews.append(self._row_to_dict(row))
        
        return {
            'reviews': reviews,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        }
    
    def _row_to_dict(self, row):
        """Convert DataFrame row to dictionary"""
        return {
            'review_id': int(row['review_id']),
            'id': str(row['Id']),
            'title': row['Title'],
            'price': row['Price'],
            'user_id': row['User_id'],
            'profile_name': row['profileName'],
            'helpfulness': row['review/helpfulness'],
            'score': float(row['review/score']) if pd.notna(row['review/score']) else None,
            'time': int(row['review/time']) if pd.notna(row['review/time']) else None,
            'summary': row['review/summary'],
            'text': row['review/text']
        }

# Create rating service instance
rating_service = RatingService()
