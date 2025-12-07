#!/usr/bin/env python3
"""
Generate Gemini Embeddings for Existing Database Records
Reads assessments from PostgreSQL and generates embeddings
"""

import os
import psycopg2
import google.generativeai as genai
from tqdm import tqdm
import time

# Configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'ground_sense_bot',
    'user': 'admin',
    'password': 'admin'
}

# Get API key from backend/.env
with open('backend/.env', 'r') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY='):
            api_key = line.strip().split('=', 1)[1]
            break

genai.configure(api_key=api_key)

def create_text_representation(row):
    """Create rich text from assessment data"""
    parts = []
    
    # Block info
    parts.append(f"Block UUID: {row[1]}")
    parts.append(f"Year: {row[2]}")
    
    # Metrics
    if row[3]: parts.append(f"Rainfall: {row[3]} mm")
    if row[4]: parts.append(f"Total Recharge: {row[4]} MCM")
    if row[5]: parts.append(f"Total Discharge: {row[5]} MCM")
    if row[6]: parts.append(f"Total Extractable: {row[6]} MCM")
    if row[7]: parts.append(f"Total Extraction: {row[7]} MCM")
    if row[8]: parts.append(f"Category: {row[8]}")
    if row[9]: parts.append(f"Stage of Extraction: {row[9]}%")
    
    return " | ".join(parts)

def generate_embedding(text):
    """Generate Gemini embedding"""
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        time.sleep(2)  # Rate limit backoff
        return None

def main():
    print("🚀 Generating Gemini Embeddings for Database Records")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Get all assessments without embeddings
    print("📊 Fetching assessments...")
    cur.execute("""
        SELECT assessment_id, block_uuid, year, rainfall, total_recharge,
               total_discharge, total_extractable, total_extraction,
               category, stage
        FROM assessments_summary
        WHERE embedding IS NULL OR text_representation IS NULL
        ORDER BY assessment_id
    """)
    
    rows = cur.fetchall()
    print(f"Found {len(rows)} assessments to process")
    
    if len(rows) == 0:
        print("✅ All assessments already have embeddings!")
        return
    
    batch_size = 50
    processed = 0
    errors = 0
    
    for row in tqdm(rows, desc="Generating embeddings"):
        assessment_id = row[0]
        
        # Create text representation
        text = create_text_representation(row)
        
        # Generate embedding
        embedding = generate_embedding(text)
        
        if embedding:
            # Update database
            try:
                cur.execute("""
                    UPDATE assessments_summary
                    SET embedding = %s, text_representation = %s
                    WHERE assessment_id = %s
                """, (embedding, text, assessment_id))
                processed += 1
                
                # Commit in batches
                if processed % batch_size == 0:
                    conn.commit()
                    
            except Exception as e:
                print(f"Error updating assessment {assessment_id}: {e}")
                errors += 1
        else:
            errors += 1
        
        # Rate limiting
        if processed % 10 == 0:
            time.sleep(0.5)
    
    # Final commit
    conn.commit()
    
    print(f"\n✅ Complete!")
    print(f"   ✓ Processed: {processed}")
    print(f"   ✗ Errors: {errors}")
    
    conn.close()

if __name__ == '__main__':
    main()
