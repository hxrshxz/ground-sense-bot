"""
Hybrid RAG Data Ingestion Script
=================================
This script processes groundwater assessment JSON files and populates the PostgreSQL
database with vector embeddings for semantic search and full-text search capabilities.

Features:
- Processes ~27K JSON files from Data/data directory
- Generates OpenAI embeddings (text-embedding-3-small)
- Supports batch processing to handle rate limits
- Creates text representations of assessment data
- Populates vector columns for hybrid search

Requirements:
- OpenAI API key
- PostgreSQL with pgvector extension
- Python packages: psycopg2, openai, tqdm
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values
from tqdm import tqdm
import logging
import google.generativeai as genai

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RAGIngestionPipeline:
    """Pipeline for ingesting groundwater data into PostgreSQL with RAG support"""
    
    def __init__(
        self,
        db_host: str = "localhost",
        db_port: str = "5433",
        db_name: str = "ground_sense_bot",
        db_user: str = "admin",
        db_password: str = "admin",
        gemini_api_key: Optional[str] = None,
        embedding_model: str = "models/text-embedding-004",
        batch_size: int = 100
    ):
        self.db_params = {
            "host": db_host,
            "port": db_port,
            "dbname": db_name,
            "user": db_user,
            "password": db_password
        }
        # Configure Gemini
        api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        genai.configure(api_key=api_key)
        self.embedding_model = embedding_model
        self.batch_size = batch_size
        self.conn = None
        
    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**self.db_params)
            logger.info("✅ Database connection established")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
    
    def load_master_index(self, master_index_path: str) -> Dict:
        """Load the master index containing UUID mappings"""
        with open(master_index_path, 'r') as f:
            return json.load(f)
    
    def create_text_representation(self, assessment: Dict) -> str:
        """
        Create a rich text representation of an assessment for embedding generation.
        This includes all relevant contextual information.
        """
        parts = []
        
        # Location information
        if "locationName" in assessment:
            parts.append(f"Location: {assessment['locationName']}")
        
        # Category and stage information
        category = assessment.get("category", {})
        if category:
            total_category = category.get("total", "unknown")
            parts.append(f"Groundwater Status: {total_category}")
            
            if "command" in category:
                parts.append(f"Command Area Status: {category['command']}")
        
        # Numerical metrics
        if "totalGWAvailability" in assessment:
            availability = assessment["totalGWAvailability"].get("total", 0)
            parts.append(f"Total Groundwater Availability: {availability:.2f} ham")
        
        if "loss" in assessment:
            total_extraction = assessment["loss"].get("total", 0)
            parts.append(f"Groundwater Extraction: {total_extraction:.2f} ham")
        
        # Rainfall data
        if "rainfall" in assessment:
            rainfall_data = assessment["rainfall"]
            if "total" in rainfall_data:
                total_rf = rainfall_data["total"].get("total", 0)
                parts.append(f"Total Rainfall: {total_rf:.2f} mm")
        
        # Stage of extraction
        if "stage" in assessment:
            stage = assessment["stage"].get("total", 0)
            parts.append(f"Extraction Stage: {stage:.2f}%")
        
        # Area information
        if "area" in assessment:
            area_data = assessment["area"]
            if "total" in area_data:
                total_area = area_data["total"].get("totalArea", 0)
                parts.append(f"Total Area: {total_area:.2f} hectares")
        
        # Recharge data
        if "totalRecharge" in assessment:
            recharge = assessment["totalRecharge"].get("total", 0)
            parts.append(f"Total Recharge: {recharge:.2f} ham")
        
        # Natural discharge
        if "totalNaturalDischarge" in assessment:
            discharge = assessment["totalNaturalDischarge"].get("total", 0)
            parts.append(f"Natural Discharge: {discharge:.2f} ham")
        
        # Water quality issues
        if "area" in assessment and "recharge_worthy" in assessment["area"]:
            poor_quality = assessment["area"]["recharge_worthy"].get("poorQualityArea", 0)
            if poor_quality > 0:
                parts.append(f"Poor Quality Area: {poor_quality:.2f} hectares")
        
        return " | ".join(parts)
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a batch of texts using Gemini API.
        Includes retry logic for rate limiting.
        """
        max_retries = 3
        retry_delay = 5
        embeddings = []
        
        for text in texts:
            for attempt in range(max_retries):
                try:
                    # Gemini embedding API
                    result = genai.embed_content(
                        model=self.embedding_model,
                        content=text,
                        task_type="retrieval_document"
                    )
                    embeddings.append(result['embedding'])
                    break
                except Exception as e:
                    if "quota" in str(e).lower() and attempt < max_retries - 1:
                        logger.warning(f"Rate limit hit, retrying in {retry_delay}s...")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        logger.error(f"Embedding generation failed: {e}")
                        raise
        
        return embeddings
    
    def process_json_files(self, data_dir: str, master_index: Dict):
        """
        Process all JSON files and insert data with embeddings into database.
        """
        data_path = Path(data_dir)
        json_files = list(data_path.rglob("*.json"))
        
        logger.info(f"📁 Found {len(json_files)} JSON files to process")
        
        batch_data = []
        processed_count = 0
        error_count = 0
        
        with tqdm(total=len(json_files), desc="Processing files") as pbar:
            for json_file in json_files:
                try:
                    # Extract year from path (e.g., 2023-2024)
                    year = json_file.parent.parent.name
                    state_name = json_file.parent.name
                    
                    # Load JSON data
                    with open(json_file, 'r') as f:
                        assessments = json.load(f)
                    
                    # Process each assessment in the file
                    for assessment in assessments:
                        location_name = assessment.get("locationName", "")
                        
                        # Find matching block UUID from master index
                        block_uuid = self.find_block_uuid(
                            master_index, state_name, location_name
                        )
                        
                        if not block_uuid:
                            logger.warning(f"⚠️ No UUID found for {state_name}/{location_name}")
                            continue
                        
                        # Create text representation
                        text_rep = self.create_text_representation(assessment)
                        
                        # Prepare data for batch insertion
                        batch_data.append({
                            "block_uuid": block_uuid,
                            "year": year,
                            "text_representation": text_rep,
                            "rainfall": assessment.get("rainfall", {}).get("total", {}).get("total", 0),
                            "total_recharge": assessment.get("totalRecharge", {}).get("total", 0),
                            "total_discharge": assessment.get("totalNaturalDischarge", {}).get("total", 0),
                            "total_extractable": assessment.get("totalGWAvailability", {}).get("total", 0),
                            "total_extraction": assessment.get("loss", {}).get("total", 0),
                            "category": assessment.get("category", {}).get("total", "unknown"),
                            "stage": assessment.get("stage", {}).get("total", 0),
                            "availability": assessment.get("totalGWAvailability", {}).get("total", 0),
                            "raw": json.dumps(assessment)
                        })
                        
                        # Process batch when it reaches batch_size
                        if len(batch_data) >= self.batch_size:
                            success = self.insert_batch(batch_data)
                            if success:
                                processed_count += len(batch_data)
                            else:
                                error_count += len(batch_data)
                            batch_data = []
                    
                    pbar.update(1)
                    
                except Exception as e:
                    logger.error(f"❌ Error processing {json_file}: {e}")
                    error_count += 1
                    pbar.update(1)
        
        # Process remaining batch
        if batch_data:
            success = self.insert_batch(batch_data)
            if success:
                processed_count += len(batch_data)
            else:
                error_count += len(batch_data)
        
        logger.info(f"\n✅ Processing complete!")
        logger.info(f"   Processed: {processed_count} records")
        logger.info(f"   Errors: {error_count} records")
    
    def find_block_uuid(self, master_index: Dict, state_name: str, location_name: str) -> Optional[str]:
        """Find block UUID from master index"""
        states = master_index.get("states", {})
        
        # Find state UUID
        state_uuid = None
        for uuid, state_data in states.items():
            if state_data["name"].upper() == state_name.upper():
                state_uuid = uuid
                break
        
        if not state_uuid:
            return None
        
        # Find block UUID
        blocks = master_index.get("blocks", {})
        for uuid, block_data in blocks.items():
            if (block_data.get("stateUuid") == state_uuid and 
                block_data["name"].upper() == location_name.upper()):
                return uuid
        
        return None
    
    def insert_batch(self, batch_data: List[Dict]) -> bool:
        """Insert a batch of assessments with embeddings"""
        try:
            # Extract text representations for embedding generation
            texts = [item["text_representation"] for item in batch_data]
            
            # Generate embeddings for the batch
            logger.info(f"🔄 Generating embeddings for {len(texts)} records...")
            embeddings = self.generate_embeddings(texts)
            
            if len(embeddings) != len(batch_data):
                logger.error("❌ Embedding count mismatch")
                return False
            
            # Prepare data for insertion
            cursor = self.conn.cursor()
            
            insert_query = """
                INSERT INTO assessments_summary (
                    block_uuid, year, text_representation, embedding,
                    rainfall, total_recharge, total_discharge, 
                    total_extractable, total_extraction, category, 
                    stage, availability, raw, created_at
                ) VALUES %s
                ON CONFLICT (block_uuid, year) 
                DO UPDATE SET
                    text_representation = EXCLUDED.text_representation,
                    embedding = EXCLUDED.embedding,
                    rainfall = EXCLUDED.rainfall,
                    total_recharge = EXCLUDED.total_recharge,
                    total_discharge = EXCLUDED.total_discharge,
                    total_extractable = EXCLUDED.total_extractable,
                    total_extraction = EXCLUDED.total_extraction,
                    category = EXCLUDED.category,
                    stage = EXCLUDED.stage,
                    availability = EXCLUDED.availability,
                    raw = EXCLUDED.raw
            """
            
            values = [
                (
                    item["block_uuid"],
                    item["year"],
                    item["text_representation"],
                    embeddings[i],
                    item["rainfall"],
                    item["total_recharge"],
                    item["total_discharge"],
                    item["total_extractable"],
                    item["total_extraction"],
                    item["category"],
                    item["stage"],
                    item["availability"],
                    item["raw"],
                    datetime.now()
                )
                for i, item in enumerate(batch_data)
            ]
            
            execute_values(cursor, insert_query, values)
            self.conn.commit()
            cursor.close()
            
            logger.info(f"✅ Inserted {len(batch_data)} records")
            return True
            
        except Exception as e:
            logger.error(f"❌ Batch insertion failed: {e}")
            self.conn.rollback()
            return False


def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Ingest groundwater data with RAG support")
    parser.add_argument("--data-dir", default="../Data/data", help="Path to data directory")
    parser.add_argument("--master-index", default="../Data/master_index.json", help="Path to master index")
    parser.add_argument("--batch-size", type=int, default=50, help="Batch size for processing")
    parser.add_argument("--db-host", default="localhost", help="Database host")
    parser.add_argument("--db-port", default="5433", help="Database port")
    parser.add_argument("--db-name", default="ground_sense_bot", help="Database name")
    parser.add_argument("--db-user", default="admin", help="Database user")
    parser.add_argument("--db-password", default="admin", help="Database password")
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = RAGIngestionPipeline(
        db_host=args.db_host,
        db_port=args.db_port,
        db_name=args.db_name,
        db_user=args.db_user,
        db_password=args.db_password,
        batch_size=args.batch_size
    )
    
    try:
        # Connect to database
        pipeline.connect()
        
        # Load master index
        logger.info(f"📖 Loading master index from {args.master_index}")
        master_index = pipeline.load_master_index(args.master_index)
        
        # Process JSON files
        logger.info(f"🚀 Starting data ingestion from {args.data_dir}")
        pipeline.process_json_files(args.data_dir, master_index)
        
    except KeyboardInterrupt:
        logger.info("\n⚠️ Process interrupted by user")
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}")
    finally:
        pipeline.close()


if __name__ == "__main__":
    main()
