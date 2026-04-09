"""
One-time ETL script: rebuild FAISS vector index using OpenAI Embeddings API.

Run from the project root:
    python -m app.etl.rebuild_vector_db

Requires OPENAI_API_KEY to be set in .env or environment.
Reads:  data/food_vector_db/food_recipes_1000.json
Writes: data/food_vector_db/index.faiss
        data/food_vector_db/index.pkl  (overwrites existing files)
"""

import json
import logging
import os

from app.load_env import ensure_dotenv_loaded
from app.services.embedding_provider import get_embeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

SOURCE_JSON = "data/food_vector_db/food_recipes_1000.json"
VECTOR_DB_PATH = "data/food_vector_db"


def build_document(record: dict) -> Document:
    name = record.get("name", "")
    ingredients = record.get("ingredients", "")
    instructions = record.get("instructions", "")
    nutrition = record.get("nutrition", "")

    page_content = (
        f"Name: {name}\n"
        f"Ingredients: {ingredients}\n"
        f"Instructions: {instructions}\n"
        f"Nutrition: {nutrition}"
    ).strip()

    return Document(page_content=page_content, metadata={"name": name})


def main():
    ensure_dotenv_loaded()

    if not os.getenv("OPENAI_API_KEY"):
        raise EnvironmentError("OPENAI_API_KEY is not set.")

    logger.info("Loading source data from %s ...", SOURCE_JSON)
    with open(SOURCE_JSON, "r", encoding="utf-8") as f:
        records = json.load(f)
    logger.info("Loaded %d records.", len(records))

    docs = [build_document(r) for r in records]

    logger.info("Initialising OpenAI embedding model ...")
    embeddings = get_embeddings()

    logger.info("Building FAISS index (this will call the OpenAI API) ...")
    vectorstore = FAISS.from_documents(docs, embeddings)

    logger.info("Saving FAISS index to %s ...", VECTOR_DB_PATH)
    vectorstore.save_local(VECTOR_DB_PATH)

    logger.info("Done. Files written: index.faiss, index.pkl")


if __name__ == "__main__":
    main()
