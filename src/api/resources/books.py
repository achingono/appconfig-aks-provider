from flask import Flask, request
from flask_restx import Api, Resource, fields

from server.instance import server
from models.book import book_model, book_input_model, book_service

app, api = server.app, server.api

# Create namespace for books
books_ns = api.namespace('books', description='Book operations')

# Pagination model
pagination_model = api.model('Pagination', {
    'page': fields.Integer(description='Current page number'),
    'per_page': fields.Integer(description='Items per page'),
    'pages': fields.Integer(description='Total pages'),
    'total': fields.Integer(description='Total items')
})

# Books list response model
books_response_model = api.model('BooksResponse', {
    'books': fields.List(fields.Nested(book_model)),
    'pagination': fields.Nested(pagination_model)
})

@books_ns.route('/')
class BookList(Resource):
    @api.doc('get_all_books')
    @api.expect(api.parser().add_argument('page', type=int, default=1, help='Page number')
                             .add_argument('per_page', type=int, help='Items per page')
                             .add_argument('search', type=str, help='Search books by title, description, or author')
                             .add_argument('category', type=str, help='Filter by category'))
    @api.marshal_with(books_response_model)
    def get(self):
        """Get all books with pagination and optional filtering"""
        args = request.args
        page = int(args.get('page', 1))
        
        # Use default page size from app settings or fallback to 20
        app_settings = app.config.get('APP_SETTINGS', {})
        page_size_config = app_settings.get('PageSize', 20)
        if isinstance(page_size_config, dict):
            default_page_size = page_size_config.get('Default', 20)
        else:
            default_page_size = int(page_size_config)
        per_page = min(int(args.get('per_page', default_page_size)), 100)  # Limit max per_page
        
        search = args.get('search')
        category = args.get('category')
        
        result = book_service.get_all_books(page=page, per_page=per_page, search=search, category=category)
        
        return {
            'books': result['books'],
            'pagination': {
                'page': result['page'],
                'per_page': result['per_page'],
                'pages': result['pages'],
                'total': result['total']
            }
        }

@books_ns.route('/<int:book_id>')
class BookResource(Resource):
    @api.doc('get_book_by_id')
    @api.marshal_with(book_model)
    def get(self, book_id):
        """Get a book by ID"""
        book = book_service.get_book_by_id(book_id)
        if not book:
            api.abort(404, "Book not found")
        return book

@books_ns.route('/search/<string:title>')
class BookSearch(Resource):
    @api.doc('search_books_by_title')
    @api.marshal_list_with(book_model)
    def get(self, title):
        """Search books by title"""
        books = book_service.search_books_by_title(title)
        return books

@books_ns.route('/author/<string:author>')
class BooksByAuthor(Resource):
    @api.doc('get_books_by_author')
    @api.marshal_list_with(book_model)
    def get(self, author):
        """Get books by author"""
        books = book_service.get_books_by_author(author)
        return books

@books_ns.route('/category/<string:category>')
class BooksByCategory(Resource):
    @api.doc('get_books_by_category')
    @api.marshal_list_with(book_model)
    def get(self, category):
        """Get books by category"""
        books = book_service.get_books_by_category(category)
        return books

@books_ns.route('/categories')
class CategoriesList(Resource):
    @api.doc('get_all_categories')
    def get(self):
        """Get all book categories"""
        categories = book_service.get_all_categories()
        return {'categories': categories}

@books_ns.route('/authors')
class AuthorsList(Resource):
    @api.doc('get_all_authors')
    def get(self):
        """Get all authors"""
        authors = book_service.get_all_authors()
        return {'authors': authors}
