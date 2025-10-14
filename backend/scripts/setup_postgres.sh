#!/bin/bash
#
# PostgreSQL Setup Script for Gitzen
#
# This script sets up a PostgreSQL database using Docker for development.
# It creates the database, user, and runs initial migrations.
#

set -e  # Exit on error

echo "🐘 Setting up PostgreSQL for Gitzen..."

# Configuration
CONTAINER_NAME="gitzen-postgres"
POSTGRES_VERSION="15-alpine"
POSTGRES_USER="gitzen"
POSTGRES_PASSWORD="gitzen_dev_password"
POSTGRES_DB="gitzen"
POSTGRES_PORT="5432"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop and remove existing container if it exists
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "🛑 Stopping existing container..."
    docker stop $CONTAINER_NAME > /dev/null 2>&1 || true
    docker rm $CONTAINER_NAME > /dev/null 2>&1 || true
fi

# Start PostgreSQL container
echo "🚀 Starting PostgreSQL container..."
docker run -d \
    --name $CONTAINER_NAME \
    -e POSTGRES_USER=$POSTGRES_USER \
    -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
    -e POSTGRES_DB=$POSTGRES_DB \
    -p $POSTGRES_PORT:5432 \
    -v gitzen-postgres-data:/var/lib/postgresql/data \
    postgres:$POSTGRES_VERSION

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Test connection
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec $CONTAINER_NAME pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "❌ PostgreSQL failed to start after $MAX_RETRIES attempts"
        exit 1
    fi
    echo "   Attempt $RETRY_COUNT/$MAX_RETRIES..."
    sleep 1
done

# Display connection information
echo ""
echo "✅ PostgreSQL container started successfully!"
echo ""
echo "📋 Connection Details:"
echo "   Host:     localhost"
echo "   Port:     $POSTGRES_PORT"
echo "   Database: $POSTGRES_DB"
echo "   User:     $POSTGRES_USER"
echo "   Password: $POSTGRES_PASSWORD"
echo ""
echo "🔗 Connection URL:"
echo "   postgresql+asyncpg://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB"
echo ""
echo "🔧 Useful Commands:"
echo "   Stop:    docker stop $CONTAINER_NAME"
echo "   Start:   docker start $CONTAINER_NAME"
echo "   Logs:    docker logs $CONTAINER_NAME"
echo "   Remove:  docker rm -f $CONTAINER_NAME"
echo "   Connect: docker exec -it $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB"
echo ""
echo "📝 Update your backend/.env file with:"
echo "   POSTGRES_USER=$POSTGRES_USER"
echo "   POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo "   POSTGRES_HOST=localhost"
echo "   POSTGRES_PORT=$POSTGRES_PORT"
echo "   POSTGRES_DB=$POSTGRES_DB"
echo ""
echo "🎯 Next steps:"
echo "   1. Update backend/.env with the connection details above"
echo "   2. Run: cd backend && source venv/bin/activate"
echo "   3. Run: alembic upgrade head"
echo "   4. Run: python -m app.main"
echo ""
