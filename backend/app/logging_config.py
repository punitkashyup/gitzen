"""
Structured Logging Configuration for Gitzen API

Provides JSON-formatted logging for production and plain text for development.
Automatically redacts secrets from all log messages.
"""
import logging
import sys
from pythonjsonlogger import jsonlogger
from app.config import settings


class PrivacyFilter(logging.Filter):
    """
    Logging filter that redacts secrets from log messages.
    
    This is the LAST line of defense against accidentally logging secrets.
    It scans every log message and redacts any sensitive patterns found.
    """
    
    def filter(self, record: logging.LogRecord) -> bool:
        """
        Filter log record to redact secrets.
        
        Args:
            record: Log record to filter
            
        Returns:
            bool: Always True (we don't block logs, just modify them)
        """
        # Lazy import to avoid circular dependency
        from app.security import redact_secrets, sanitize_log_data
        
        # Redact secrets from message
        if hasattr(record, "msg"):
            record.msg = redact_secrets(str(record.msg))
        
        # Redact secrets from args
        if hasattr(record, "args") and record.args:
            if isinstance(record.args, dict):
                record.args = sanitize_log_data(record.args)
            elif isinstance(record.args, tuple):
                record.args = tuple(
                    redact_secrets(str(arg)) if isinstance(arg, str) else arg
                    for arg in record.args
                )
        
        # Redact from exception info
        if hasattr(record, "exc_info") and record.exc_info:
            exc_type, exc_value, exc_tb = record.exc_info
            if exc_value:
                exc_value.args = tuple(
                    redact_secrets(str(arg)) if isinstance(arg, str) else arg
                    for arg in exc_value.args
                )
        
        return True


def setup_logging():
    """
    Configure structured logging for the application.
    
    - In production (LOG_FORMAT=json): JSON-formatted logs
    - In development (LOG_FORMAT=plain): Plain text logs
    - Always includes privacy filter to redact secrets
    """
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
    
    # Remove existing handlers
    logger.handlers = []
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
    
    # Add privacy filter to EVERY log
    privacy_filter = PrivacyFilter()
    console_handler.addFilter(privacy_filter)
    
    # Configure formatter based on environment
    if settings.LOG_FORMAT == "json":
        # JSON formatter for production
        formatter = jsonlogger.JsonFormatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s %(pathname)s %(lineno)d"
        )
    else:
        # Plain formatter for development
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    return logger


# Initialize logging
logger = setup_logging()


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module.
    
    Args:
        name: Module name (typically __name__)
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)
