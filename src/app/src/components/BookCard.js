import React from 'react';

const BookCard = ({ book, onViewRatings, currentColors }) => {
  const {
    id,
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

  const handleViewRatings = () => {
    if (onViewRatings && id !== undefined) {
      onViewRatings(id, title);
    }
  };

  return (
    <div className="card hover:shadow-lg">
      {image && (
        <img 
          src={image} 
          alt={title}
          className="w-24 h-36 object-cover rounded mb-4"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      
      <h3 className="text-lg font-bold text-secondary mb-2 leading-tight">{title}</h3>
      
      {authors.length > 0 && (
        <div className="text-gray-500 mb-2">
          by {authors.join(', ')}
        </div>
      )}
      
      {description && (
        <div className="text-sm leading-relaxed text-dark mb-4 line-clamp-3">
          {description}
        </div>
      )}
      
      <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
        {publisher && <div>Publisher: {publisher}</div>}
        {published_date && <div>Published: {published_date}</div>}
        {categories.length > 0 && <div>Categories: {categories.join(', ')}</div>}
        {ratings_count && <div>Ratings: {ratings_count}</div>}
        
        <div className="flex gap-2 mt-2">
          {preview_link && (
            <button 
              onClick={handlePreview}
              className="text-xs px-3 py-1 rounded font-medium transition-colors text-white"
              style={{ backgroundColor: currentColors?.primary || '#3498db' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = currentColors?.primaryHover || '#2980b9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = currentColors?.primary || '#3498db'}
            >
              Preview Book
            </button>
          )}
          
          {onViewRatings && id !== undefined && (
            <button 
              onClick={handleViewRatings}
              className="text-xs px-3 py-1 rounded font-medium transition-colors text-white"
              style={{ backgroundColor: currentColors?.primary || '#3498db' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = currentColors?.primaryHover || '#2980b9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = currentColors?.primary || '#3498db'}
            >
              View Ratings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
