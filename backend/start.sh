# Delete migration files
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc"  -delete

# Recreate migrations
python manage.py makemigrations
python manage.py migrate
