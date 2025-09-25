from flask import Flask, request
from flask_restx import Api, Resource, fields

from server.instance import server
from models.rating import rating_model, rating_input_model, rating_stats_model, rating_service

app, api = server.app, server.api

# Create namespace for ratings
ratings_ns = api.namespace('ratings', description='Rating operations')

# Pagination model
pagination_model = api.model('RatingPagination', {
    'page': fields.Integer(description='Current page number'),
    'per_page': fields.Integer(description='Items per page'),
    'pages': fields.Integer(description='Total pages'),
    'total': fields.Integer(description='Total items')
})

# Ratings list response model
ratings_response_model = api.model('RatingsResponse', {
    'ratings': fields.List(fields.Nested(rating_model)),
    'pagination': fields.Nested(pagination_model)
})

# Top rated book model
top_rated_book_model = api.model('TopRatedBook', {
    'book_id': fields.String(description='Book ID'),
    'title': fields.String(description='Book title'),
    'total_ratings': fields.Integer(description='Total number of ratings'),
    'average_score': fields.Float(description='Average rating score')
})

@ratings_ns.route('/')
class RatingList(Resource):
    @api.doc('get_all_ratings')
    @api.expect(api.parser().add_argument('page', type=int, default=1, help='Page number')
                             .add_argument('per_page', type=int, default=20, help='Items per page')
                             .add_argument('book_id', type=str, help='Filter by book ID')
                             .add_argument('user_id', type=str, help='Filter by user ID')
                             .add_argument('min_score', type=float, help='Minimum rating score')
                             .add_argument('max_score', type=float, help='Maximum rating score'))
    @api.marshal_with(ratings_response_model)
    def get(self):
        """Get all ratings with pagination and optional filtering"""
        args = request.args
        page = int(args.get('page', 1))
        per_page = min(int(args.get('per_page', 20)), 100)  # Limit max per_page
        book_id = args.get('book_id')
        user_id = args.get('user_id')
        min_score = args.get('min_score', type=float)
        max_score = args.get('max_score', type=float)
        
        result = rating_service.get_all_ratings(
            page=page, 
            per_page=per_page, 
            book_id=book_id, 
            user_id=user_id,
            min_score=min_score,
            max_score=max_score
        )
        
        return {
            'ratings': result['ratings'],
            'pagination': {
                'page': result['page'],
                'per_page': result['per_page'],
                'pages': result['pages'],
                'total': result['total']
            }
        }

@ratings_ns.route('/<int:review_id>')
class RatingResource(Resource):
    @api.doc('get_rating_by_id')
    @api.marshal_with(rating_model)
    def get(self, review_id):
        """Get a rating by review ID"""
        rating = rating_service.get_rating_by_id(review_id)
        if not rating:
            api.abort(404, "Rating not found")
        return rating

@ratings_ns.route('/book/<string:book_id>')
class BookRatings(Resource):
    @api.doc('get_ratings_for_book')
    @api.marshal_list_with(rating_model)
    def get(self, book_id):
        """Get all ratings for a specific book"""
        ratings = rating_service.get_ratings_for_book(book_id)
        return ratings

@ratings_ns.route('/user/<string:user_id>')
class UserRatings(Resource):
    @api.doc('get_ratings_by_user')
    @api.marshal_list_with(rating_model)
    def get(self, user_id):
        """Get all ratings by a specific user"""
        ratings = rating_service.get_ratings_by_user(user_id)
        return ratings

@ratings_ns.route('/stats/<string:book_id>')
class BookRatingStats(Resource):
    @api.doc('get_book_rating_stats')
    @api.marshal_with(rating_stats_model)
    def get(self, book_id):
        """Get rating statistics for a specific book"""
        stats = rating_service.get_book_rating_stats(book_id)
        if not stats:
            api.abort(404, "No ratings found for this book")
        return stats

@ratings_ns.route('/top-rated')
class TopRatedBooks(Resource):
    @api.doc('get_top_rated_books')
    @api.expect(api.parser().add_argument('limit', type=int, default=10, help='Number of books to return')
                             .add_argument('min_ratings', type=int, default=5, help='Minimum number of ratings required'))
    @api.marshal_list_with(top_rated_book_model)
    def get(self):
        """Get top rated books"""
        args = request.args
        limit = min(int(args.get('limit', 10)), 50)  # Limit max results
        min_ratings = int(args.get('min_ratings', 5))
        
        books = rating_service.get_top_rated_books(limit=limit, min_ratings=min_ratings)
        return books

@ratings_ns.route('/search')
class ReviewSearch(Resource):
    @api.doc('search_reviews')
    @api.expect(api.parser().add_argument('q', type=str, required=True, help='Search query')
                             .add_argument('page', type=int, default=1, help='Page number')
                             .add_argument('per_page', type=int, default=20, help='Items per page'))
    def get(self):
        """Search reviews by text content"""
        args = request.args
        search_text = args.get('q')
        
        if not search_text:
            api.abort(400, "Search query 'q' is required")
        
        page = int(args.get('page', 1))
        per_page = min(int(args.get('per_page', 20)), 100)
        
        result = rating_service.search_reviews(search_text, page=page, per_page=per_page)
        
        return {
            'reviews': result['reviews'],
            'pagination': {
                'page': result['page'],
                'per_page': result['per_page'],
                'pages': result['pages'],
                'total': result['total']
            }
        }
