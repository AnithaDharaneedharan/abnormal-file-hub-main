FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install --save-dev @types/uuid @types/react @types/react-dom @types/node

# Copy project files
COPY . .

# Set environment for development
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true

EXPOSE 3000

# Start the development server with polling for hot reload in Docker
CMD ["npm", "start"] 