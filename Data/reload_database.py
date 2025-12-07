#!/usr/bin/env python3
"""
Quick Database Reloader
Loads existing JSON files back into PostgreSQL database
"""

import os
import json
import psycopg2
from pathlib import Path
from tqdm import tqdm
import uuid

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'ground_sense_bot',
    'user': 'admin',
    'password': 'admin'
}

# Data directory
DATA_DIR = Path(__file__).parent / 'data'

def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(**DB_CONFIG)

def load_json_files():
    """Find all JSON files in the data directory"""
    json_files = []
    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            if file.endswith('.json') and not file.startswith('.'):
                json_files.append(Path(root) / file)
    return json_files

def parse_assessment_data(data):
    """Parse assessment JSON data"""
    try:
        # Extract location info
        state_name = data.get('stateName', '')
        district_name = data.get('districtName', '')
        block_name = data.get('name', '')
        
        # Extract UUIDs
        state_uuid = data.get('stateUuid')
        district_uuid = data.get('districtUuid')
        block_uuid = data.get('uuid')
        
        # Extract year
        year = data.get('year', '')
        
        # Extract metrics
        rainfall = data.get('rainfall')
        total_recharge = data.get('totalNaturalRecharge')
        total_discharge = data.get('totalNaturalDischarge')
        total_extractable = data.get('totalExtractable')
        total_extraction = data.get('totalExtraction')
        category = data.get('category')
        stage = data.get('stage')
        availability = data.get('availability')
        
        return {
            'state_name': state_name,
            'state_uuid': state_uuid,
            'district_name': district_name,
            'district_uuid': district_uuid,
            'block_name': block_name,
            'block_uuid': block_uuid,
            'year': year,
            'rainfall': rainfall,
            'total_recharge': total_recharge,
            'total_discharge': total_discharge,
            'total_extractable': total_extractable,
            'total_extraction': total_extraction,
            'category': category,
            'stage': stage,
            'availability': availability,
            'raw': json.dumps(data)
        }
    except Exception as e:
        print(f"Error parsing data: {e}")
        return None

def insert_state(conn, state_uuid, state_name):
    """Insert or update state"""
    if not state_uuid:
        state_uuid = str(uuid.uuid4())
    
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO states (state_uuid, state_name)
            VALUES (%s, %s)
            ON CONFLICT (state_uuid) DO NOTHING
        """, (state_uuid, state_name))
    return state_uuid

def insert_district(conn, district_uuid, district_name, state_uuid):
    """Insert or update district"""
    if not district_uuid:
        district_uuid = str(uuid.uuid4())
    
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO districts (district_uuid, district_name, state_uuid)
            VALUES (%s, %s, %s)
            ON CONFLICT (district_uuid) DO NOTHING
        """, (district_uuid, district_name, state_uuid))
    return district_uuid

def insert_block(conn, block_uuid, block_name, district_uuid, state_uuid):
    """Insert or update block"""
    if not block_uuid:
        block_uuid = str(uuid.uuid4())
    
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO blocks (block_uuid, block_name, district_uuid, state_uuid)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (block_uuid) DO NOTHING
        """, (block_uuid, block_name, district_uuid, state_uuid))
    return block_uuid

def insert_assessment(conn, data):
    """Insert or update assessment"""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO assessments_summary (
                block_uuid, year, rainfall, total_recharge, total_discharge,
                total_extractable, total_extraction, category, stage,
                availability, raw
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (block_uuid, year) 
            DO UPDATE SET
                rainfall = EXCLUDED.rainfall,
                total_recharge = EXCLUDED.total_recharge,
                total_discharge = EXCLUDED.total_discharge,
                total_extractable = EXCLUDED.total_extractable,
                total_extraction = EXCLUDED.total_extraction,
                category = EXCLUDED.category,
                stage = EXCLUDED.stage,
                availability = EXCLUDED.availability,
                raw = EXCLUDED.raw
        """, (
            data['block_uuid'], data['year'], data['rainfall'],
            data['total_recharge'], data['total_discharge'],
            data['total_extractable'], data['total_extraction'],
            data['category'], data['stage'], data['availability'],
            data['raw']
        ))

def main():
    print("🔄 Reloading database from JSON files...")
    print(f"📁 Data directory: {DATA_DIR}")
    
    # Find all JSON files
    json_files = load_json_files()
    print(f"📊 Found {len(json_files)} JSON files")
    
    if not json_files:
        print("❌ No JSON files found!")
        return
    
    # Connect to database
    print("🔌 Connecting to database...")
    conn = get_db_connection()
    
    try:
        success_count = 0
        error_count = 0
        
        # Process each file
        for json_file in tqdm(json_files, desc="Loading data"):
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)
                
                # Parse the data
                parsed = parse_assessment_data(data)
                if not parsed:
                    error_count += 1
                    continue
                
                # Insert state
                if parsed['state_uuid'] and parsed['state_name']:
                    insert_state(conn, parsed['state_uuid'], parsed['state_name'])
                
                # Insert district
                if parsed['district_uuid'] and parsed['district_name']:
                    insert_district(conn, parsed['district_uuid'], 
                                  parsed['district_name'], parsed['state_uuid'])
                
                # Insert block
                if parsed['block_uuid'] and parsed['block_name']:
                    insert_block(conn, parsed['block_uuid'], parsed['block_name'],
                               parsed['district_uuid'], parsed['state_uuid'])
                
                # Insert assessment
                if parsed['block_uuid'] and parsed['year']:
                    insert_assessment(conn, parsed)
                
                success_count += 1
                
            except Exception as e:
                error_count += 1
                tqdm.write(f"❌ Error processing {json_file.name}: {e}")
        
        # Commit all changes
        conn.commit()
        
        print(f"\n✅ Database reload complete!")
        print(f"   ✓ Successfully loaded: {success_count}")
        print(f"   ✗ Errors: {error_count}")
        
        # Show summary stats
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM states")
            states_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM districts")
            districts_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM blocks")
            blocks_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM assessments_summary")
            assessments_count = cur.fetchone()[0]
        
        print(f"\n📊 Database Summary:")
        print(f"   States: {states_count}")
        print(f"   Districts: {districts_count}")
        print(f"   Blocks: {blocks_count}")
        print(f"   Assessments: {assessments_count}")
        
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    main()
