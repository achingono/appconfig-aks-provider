import React from 'react';

const BookCard = ({ book }) => {
  const {
    title = 'No Title',
    description = '',
    authors = [],
    image,
    preview_link,
    publisher = '',
    published_date = '',
    categories = [],
    ratings_count
  } = book;

  const handlePreview = () => {
    if (preview_link) {
      window.open(preview_link, '_blank');
    }
  };

  return (
    <div className="book-card">
      {image && (
        <img 
          src={image} 
          alt={title}
          className="book-image"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      
      <h3 className="book-title">{title}</h3>
      
      {authors.length > 0 && (
        <div className="book-authors">
          by {authors.join(', ')}
        </div>
      )}
      
      {description && (
        <div className="book-description">
          {description}
        </div>
      )}
      
      <div className="book-meta">
        {publisher && <div>Publisher: {publisher}</div>}
        {published_date && <div>Published: {published_date}</div>}
        {categories.length > 0 && <div>Categories: {categories.join(', ')}</div>}
        {ratings_count && <div>Ratings: {ratings_count}</div>}
        
        {preview_link && (
          <button 
            onClick={handlePreview}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Preview Book
          </button>
        )}
      </div>
    </div>
  );
};

export default BookCard;
