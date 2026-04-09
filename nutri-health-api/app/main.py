"""
NutriHealth API - Main Application
FastAPI backend for food scanning and nutritional analysis
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.load_env import ensure_dotenv_loaded

ensure_dotenv_loaded()

from app.database import init_db
from app.routers import scan, auth, stories

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle application startup and shutdown events.
    """
    # Startup
    logger.info("Starting NutriHealth API...")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down NutriHealth API...")


# Create FastAPI application
app = FastAPI(
    title="NutriHealth API",
    description="Backend API for NutriHealth mobile application - food scanning and nutritional analysis for children",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:8081,http://localhost:19006").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(scan.router)
app.include_router(stories.router)


@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint - API information
    """
    return {
        "name": "NutriHealth API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    """
    return {
        "status": "healthy",
        "service": "nutrihealth-api"
    }


# Background task for cache cleanup (can be triggered manually or by scheduler)
@app.get("/admin/cleanup-cache", tags=["admin"])
async def cleanup_cache_endpoint():
    """
    Manually trigger cache cleanup.
    Removes all expired cache entries.
    """
    from app.services.cache import cleanup_expired_cache
    from app.database import SessionLocal
    
    db = SessionLocal()
    try:
        count = cleanup_expired_cache(db)
        return {
            "status": "success",
            "entries_deleted": count
        }
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
