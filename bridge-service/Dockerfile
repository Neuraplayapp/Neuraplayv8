# Use Node.js 18 LTS
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application code
COPY . .

# Expose port (Fly.io will set this via environment)
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 