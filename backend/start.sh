#!/bin/sh

echo "Running migrations..."
python manage.py migrate

echo "Starting server..."
gunicorn core.wsgi:application --bind 0.0.0.0:8000
