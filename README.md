# File Hub

A modern, full-stack file management application built with Django and React. This application provides a robust and user-friendly interface for uploading, downloading, and managing files with advanced features like duplicate detection, file categorization, and search capabilities.

## Features

### File Management
- Upload files with progress tracking
- Download files with original filenames preserved
- Delete files with visual feedback
- Automatic file type detection and categorization
- Duplicate file detection using SHA-256 hashing
- Support for various file types (documents, images, videos, etc.)

### Search and Filtering
- Search files by filename or content
- Filter files by type (document, image, spreadsheet, etc.)
- Filter files by date (today, this week, this month, this year)
- Custom date range filtering
- Real-time search with performance metrics

### User Interface
- Modern, responsive design
- Drag and drop file upload
- Upload progress indication
- Loading states and error handling
- Clean and intuitive layout
- Cumulative Layout Shift (CLS) optimization

### Performance
- Efficient file handling with chunked uploads
- Optimized database queries with proper indexing
- File deduplication to save storage space
- Caching and query optimization
- Performance metrics tracking

## Tech Stack

### Backend (Django)
- Django REST Framework for API
- PostgreSQL for database
- Custom file storage handling
- Advanced file type detection
- Comprehensive logging

### Frontend (React)
- React with TypeScript
- TanStack Query for data fetching
- Tailwind CSS for styling
- Heroicons for icons
- Modern React patterns and hooks

## Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- Virtual environment (recommended)

### Backend Setup
1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database and other configuration
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API endpoint
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### File Upload
1. Drag and drop files into the upload area or click to select files
2. Watch the upload progress in real-time
3. Receive immediate feedback on successful uploads or duplicates

### File Management
1. View all files in the main dashboard
2. Use the search bar to find specific files
3. Filter files by type using the dropdown menu
4. Filter files by date range using the date picker
5. Download files by clicking the download button
6. Delete files using the trash icon

### Search and Filtering
1. Use the search bar for filename or content search
2. Select file types from the dropdown to filter by type
3. Use date filters for quick time-based filtering
4. Set custom date ranges for specific time periods

## API Endpoints

### Files
- `GET /api/files/` - List all files
- `POST /api/files/` - Upload a new file
- `GET /api/files/{id}/` - Get file details
- `DELETE /api/files/{id}/` - Delete a file
- `GET /api/files/{id}/download/` - Download a file

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

