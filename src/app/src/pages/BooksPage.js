import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import appConfigService from '../services/appConfigService';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';
import SearchControls from '../components/SearchControls';

const BooksPage = ({ appConfig, onViewRatings }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: appConfig?.ui?.pageSize || 10,
    pages: 0,
    total: 0
  });

  // Available options for filters
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);

  useEffect(() => {
    // Initialize with app config page size
    const pageSize = appConfig?.ui?.pageSize || appConfigService.getPageSize();
    setPagination(prev => ({ ...prev, per_page: pageSize }));
    loadBooks(1, pageSize);
  }, [appConfig]);

  const loadBooks = async (page = 1, perPage = null, search = '', category = '', author = '') => {
    setLoading(true);
    setError(null);

    try {
      const actualPerPage = perPage || pagination.per_page;
      const response = await apiService.getBooks({
        page,
        perPage: actualPerPage,
        search,
        category,
        author
      });

      setBooks(response.books || []);
      setPagination(response.pagination || {
        page,
        per_page: actualPerPage,
        pages: 0,
        total: 0
      });

      // Extract unique categories and authors for filter options
      if (response.books) {
        const allCategories = new Set();
        const allAuthors = new Set();

        response.books.forEach(book => {
          if (book.categories) {
            book.categories.forEach(cat => allCategories.add(cat));
          }
          if (book.authors) {
            book.authors.forEach(author => allAuthors.add(author));
          }
        });

        setCategories(Array.from(allCategories).sort());
        setAuthors(Array.from(allAuthors).sort());
      }
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error('Error loading books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadBooks(1, null, searchTerm, selectedCategory, selectedAuthor);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedAuthor('');
    loadBooks(1);
  };

  const handlePageChange = (page) => {
    loadBooks(page, null, searchTerm, selectedCategory, selectedAuthor);
  };

  return (
    <div className="space-y-5">
      <SearchControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedAuthor={selectedAuthor}
        setSelectedAuthor={setSelectedAuthor}
        onSearch={handleSearch}
        onReset={handleReset}
        categories={categories}
        authors={authors}
      />

      {error && (
        <div className="bg-danger text-white p-4 rounded-lg text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">
          Loading books...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {books.map((book, index) => (
              <BookCard 
                key={`${book.title}-${index}`} 
                book={book} 
                onViewRatings={onViewRatings}
              />
            ))}
          </div>

          {books.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-500">
              No books found. Try adjusting your search criteria.
            </div>
          )}

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.per_page}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default BooksPage;
