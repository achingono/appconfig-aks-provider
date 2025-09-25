# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Next.js configuration
COPY next.config.js ./

# Copy Tailwind and PostCSS configuration
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Copy the pages directory (Next.js routing)
COPY pages ./pages/

# Copy the lib directory (server-side utilities)
COPY lib ./lib/

# Copy remaining source code (components, services, styles)
COPY src ./src/

# Build the Next.js app
RUN npm run build

# Expose port 8080
EXPOSE 8080
ENV PORT=8080

# Start the Next.js server
CMD ["npm", "start"]
