"""
Embedding provider: uses Qwen (DashScope) text-embedding-v3 via OpenAI-compatible API.
"""

from __future__ import annotations

import logging
import os

from app.load_env import ensure_dotenv_loaded
from app.config.vision_llm import get_dashscope_settings
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings

logger = logging.getLogger(__name__)


def get_embeddings() -> Embeddings:
    ensure_dotenv_loaded()
    s = get_dashscope_settings()
    model_name = os.getenv("QWEN_EMBEDDING_MODEL", s.qwen_embedding_model).strip()
    logger.info("Using Qwen embedding model: %s", model_name)
    return OpenAIEmbeddings(
        model=model_name,
        api_key=s.dashscope_api_key.strip(),
        base_url=s.dashscope_base_url,
        chunk_size=25,
        check_embedding_ctx_length=False,
    )
