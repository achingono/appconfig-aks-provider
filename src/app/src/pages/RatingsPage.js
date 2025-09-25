import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const RatingsPage = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    pages: 0,
    total: 0
  });

  // Filter states
  const [bookIdFilter, setBookIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getRatings({
        page,
        perPage: pagination.per_page,
        bookId: filters.bookId || bookIdFilter,
        userId: filters.userId || userIdFilter,
        minScore: filters.minScore || minScore,
        maxScore: filters.maxScore || maxScore
      });

      setRatings(response.ratings || []);
      setPagination(response.pagination || {
        page,
        per_page: 10,
        pages: 0,
        total: 0
      });
    } catch (err) {
      setError('Failed to load ratings. Please try again.');
      console.error('Error loading ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadRatings(1, {
      bookId: bookIdFilter,
      userId: userIdFilter,
      minScore,
      maxScore
    });
  };

  const handleReset = () => {
    setBookIdFilter('');
    setUserIdFilter('');
    setMinScore('');
    setMaxScore('');
    loadRatings(1, {});
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const renderStars = (score) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="text-yellow-500">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
        <span className="ml-2 text-gray-700">({score}/5)</span>
      </div>
    );
  };

  return (
    <div className="page-container space-y-6">
      <div className="search-controls">
        <h3 className="text-lg font-semibold text-secondary mb-4">Filter Ratings</h3>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Book ID"
            value={bookIdFilter}
            onChange={(e) => setBookIdFilter(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="User ID"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Min Score"
            min="1"
            max="5"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Max Score"
            min="1"
            max="5"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            className="input-field"
          />
          <button onClick={handleFilter} className="btn-primary">Filter</button>
          <button onClick={handleReset} className="btn-secondary">Reset</button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          Loading ratings...
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {ratings.map((rating, index) => (
              <div key={`${rating.id}-${index}`} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-secondary mb-1">{rating.title}</h4>
                    <div className="text-sm text-gray-500">
                      Book ID: {rating.id} | Review Date: {formatDate(rating.time)}
                    </div>
                  </div>
                  {renderStars(rating.score)}
                </div>

                <div className="mb-3">
                  <strong className="font-medium">Reviewer:</strong> {rating.profile_name}
                  {rating.helpfulness && (
                    <span className="ml-4 text-sm text-green-600">
                      Helpful: {rating.helpfulness}
                    </span>
                  )}
                </div>

                {rating.summary && (
                  <div className="mb-3">
                    <strong className="font-medium">Summary:</strong> {rating.summary}
                  </div>
                )}

                {rating.text && (
                  <div className="bg-gray-50 p-3 rounded-md leading-relaxed">
                    {rating.text}
                  </div>
                )}

                {rating.price && (
                  <div className="mt-3 text-sm text-gray-500">
                    Price at time of review: {rating.price}
                  </div>
                )}
              </div>
            ))}
          </div>

          {ratings.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No ratings found. Try adjusting your filter criteria.
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pagination flex items-center justify-center space-x-4 mt-8">
              <button 
                onClick={() => loadRatings(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} 
                ({pagination.total} total ratings)
              </span>
              <button 
                onClick={() => loadRatings(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RatingsPage;
