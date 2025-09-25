import React from 'react';

const SearchControls = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory, 
  selectedAuthor, 
  setSelectedAuthor,
  onSearch,
  onReset,
  categories = [],
  authors = []
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="search-controls mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field flex-1 min-w-[200px]"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select-field min-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
          
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="select-field min-w-[150px]"
          >
            <option value="">All Authors</option>
            {authors.map((author, index) => (
              <option key={index} value={author}>
                {author}
              </option>
            ))}
          </select>
          
          <button type="submit" className="btn-primary">Search</button>
          <button type="button" onClick={onReset} className="btn-secondary">Reset</button>
        </div>
      </form>
    </div>
  );
};

export default SearchControls;
