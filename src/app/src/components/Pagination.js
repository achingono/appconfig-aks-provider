import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    onPageChange(page);
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="pagination flex items-center justify-center space-x-2 mt-8">
      <button 
        onClick={handlePrevious} 
        disabled={currentPage === 1}
        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      {currentPage > 3 && (
        <>
          <button 
            onClick={() => handlePageClick(1)}
            className="pagination-btn"
          >
            1
          </button>
          {currentPage > 4 && <span className="text-gray-500">...</span>}
        </>
      )}
      
      {getPageNumbers().map(page => (
        <button
          key={page}
          onClick={() => handlePageClick(page)}
          className={`pagination-btn ${
            page === currentPage 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      
      {currentPage < totalPages - 2 && (
        <>
          {currentPage < totalPages - 3 && <span className="text-gray-500">...</span>}
          <button 
            onClick={() => handlePageClick(totalPages)}
            className="pagination-btn"
          >
            {totalPages}
          </button>
        </>
      )}
      
      <button 
        onClick={handleNext} 
        disabled={currentPage === totalPages}
        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
      
      <span className="text-sm text-gray-600 ml-4">
        Showing {startItem}-{endItem} of {totalItems} items
      </span>
    </div>
  );
};

export default Pagination;
