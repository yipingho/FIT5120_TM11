"""
Embedding provider: uses OpenAI Embeddings API (no local model loaded).
"""

from __future__ import annotations

import logging
import os

from app.load_env import ensure_dotenv_loaded
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "text-embedding-3-small"


def get_embeddings() -> Embeddings:
    ensure_dotenv_loaded()
    model_name = os.getenv("OPENAI_EMBEDDING_MODEL", DEFAULT_MODEL).strip()
    logger.info("Using OpenAI embedding model: %s", model_name)
    return OpenAIEmbeddings(model=model_name)
