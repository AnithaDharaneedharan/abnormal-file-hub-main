FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install --save-dev @types/uuid @types/react @types/react-dom @types/node @types/lodash.debounce
# Install test dependencies
RUN npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/testing-library__react @types/jest @types/testing-library__jest-dom @babel/plugin-proposal-private-property-in-object

# Copy project files
COPY . .

# Set environment for development
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true
ENV CI=true

EXPOSE 3000

# Default command starts the development server
CMD ["npm", "start"]