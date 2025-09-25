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
    <div className="pagination">
      <button 
        onClick={handlePrevious} 
        disabled={currentPage === 1}
      >
        Previous
      </button>
      
      {currentPage > 3 && (
        <>
          <button onClick={() => handlePageClick(1)}>1</button>
          {currentPage > 4 && <span>...</span>}
        </>
      )}
      
      {getPageNumbers().map(page => (
        <button
          key={page}
          onClick={() => handlePageClick(page)}
          style={{
            backgroundColor: page === currentPage ? '#3498db' : 'white',
            color: page === currentPage ? 'white' : '#333'
          }}
        >
          {page}
        </button>
      ))}
      
      {currentPage < totalPages - 2 && (
        <>
          {currentPage < totalPages - 3 && <span>...</span>}
          <button onClick={() => handlePageClick(totalPages)}>{totalPages}</button>
        </>
      )}
      
      <button 
        onClick={handleNext} 
        disabled={currentPage === totalPages}
      >
        Next
      </button>
      
      <span>
        Showing {startItem}-{endItem} of {totalItems} items
      </span>
    </div>
  );
};

export default Pagination;
