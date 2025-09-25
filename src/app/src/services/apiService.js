import axios from 'axios';

// For client-side calls, we need to use the host's localhost URL
// Note: process.env variables in Next.js client-side code need to be prefixed with NEXT_PUBLIC_
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5100';

console.log('API_BASE_URL configured as:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service for books and ratings
class ApiService {
  
  // Books endpoints
  async getBooks({ page = 1, perPage = 10, search = '', category = '', author = '' } = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (author) params.append('author', author);

    try {
      const response = await api.get(`/books/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  async getBook(bookId) {
    try {
      const response = await api.get(`/books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw error;
    }
  }

  // Ratings endpoints
  async getRatings({ page = 1, perPage = 10, bookId = '', userId = '', minScore = '', maxScore = '' } = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    
    if (bookId) params.append('book_id', bookId);
    if (userId) params.append('user_id', userId);
    if (minScore) params.append('min_score', minScore.toString());
    if (maxScore) params.append('max_score', maxScore.toString());

    try {
      const response = await api.get(`/ratings/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ratings:', error);
      throw error;
    }
  }

  async getBookRatingStats(bookId) {
    try {
      const response = await api.get(`/ratings/stats/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rating stats:', error);
      throw error;
    }
  }

  async getTopRatedBooks(limit = 10, minRatings = 5) {
    try {
      const response = await api.get(`/ratings/top-rated?limit=${limit}&min_ratings=${minRatings}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top rated books:', error);
      throw error;
    }
  }

  async searchReviews({ search = '', page = 1, perPage = 10 } = {}) {
    const params = new URLSearchParams({
      search,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    try {
      const response = await api.get(`/ratings/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching reviews:', error);
      throw error;
    }
  }

  // Configuration endpoint
  async getConfiguration() {
    try {
      const response = await api.get('/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching configuration:', error);
      // Return fallback config
      return {
        Settings: {
          ColorScheme: "Green",
          PageSize: {
            Default: 10,
            Max: 200
          }
        },
        feature_management: {
          feature_flags: [
            {
              id: "Ratings",
              description: "",
              enabled: "true",
              conditions: {
                client_filters: []
              }
            },
            {
              id: "DarkMode",
              description: "",
              enabled: "true",
              conditions: {
                client_filters: []
              }
            }
          ]
        }
      };
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
