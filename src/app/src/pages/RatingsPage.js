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
      <div style={{ color: '#f39c12' }}>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
        <span style={{ marginLeft: '8px', color: '#333' }}>({score}/5)</span>
      </div>
    );
  };

  return (
    <div>
      <div className="controls">
        <h3>Filter Ratings</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Book ID"
            value={bookIdFilter}
            onChange={(e) => setBookIdFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="User ID"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
          />
          <input
            type="number"
            placeholder="Min Score"
            min="1"
            max="5"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Score"
            min="1"
            max="5"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
          />
          <button onClick={handleFilter}>Filter</button>
          <button onClick={handleReset}>Reset</button>
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          Loading ratings...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '20px' }}>
            {ratings.map((rating, index) => (
              <div key={`${rating.id}-${index}`} className="book-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{rating.title}</h4>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      Book ID: {rating.id} | Review Date: {formatDate(rating.time)}
                    </div>
                  </div>
                  {renderStars(rating.score)}
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <strong>Reviewer:</strong> {rating.profile_name}
                  {rating.helpfulness && (
                    <span style={{ marginLeft: '15px', fontSize: '12px', color: '#27ae60' }}>
                      Helpful: {rating.helpfulness}
                    </span>
                  )}
                </div>

                {rating.summary && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Summary:</strong> {rating.summary}
                  </div>
                )}

                {rating.text && (
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '10px', 
                    borderRadius: '4px',
                    lineHeight: '1.4'
                  }}>
                    {rating.text}
                  </div>
                )}

                {rating.price && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#7f8c8d' }}>
                    Price at time of review: {rating.price}
                  </div>
                )}
              </div>
            ))}
          </div>

          {ratings.length === 0 && !loading && (
            <div className="loading">
              No ratings found. Try adjusting your filter criteria.
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => loadRatings(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages} 
                ({pagination.total} total ratings)
              </span>
              <button 
                onClick={() => loadRatings(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
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
