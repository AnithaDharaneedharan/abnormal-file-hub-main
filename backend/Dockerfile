FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy project files
COPY . .

# Create necessary directories
RUN mkdir -p media staticfiles data

# Set permissions
RUN chmod -R 777 data media staticfiles

# Collect static files
RUN python manage.py collectstatic --noinput

# Make start script executable
COPY start.sh .
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]