import os
import json
import psycopg2
from pathlib import Path
from tqdm import tqdm

# Configuration
DATA_DIR = Path("Data/data")
INDEX_FILE = Path("Data/master_index.json")
# All available years for trend analysis
YEARS = ["2012-2013", "2016-2017", "2019-2020", "2021-2022", "2022-2023", "2023-2024", "2024-2025"]

def get_db_connection():
    """Get database connection with environment variable support for CI/CD"""
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5433"),
        database=os.getenv("POSTGRES_DB", "ground_sense_bot"),
        user=os.getenv("POSTGRES_USER", "admin"),
        password=os.getenv("POSTGRES_PASSWORD", "admin")
    )

def safe_float(val):
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        try:
            return float(val)
        except ValueError:
            pass
    return 0.0

def safe_get_total(data_dict):
    if not isinstance(data_dict, dict):
        return 0.0
    return safe_float(data_dict.get('total', 0.0))

def load_data():
    conn = get_db_connection()
    cur = conn.cursor()
    
    print("--- Starting Offline Data Ingestion (Index Based) ---")

    # 0. Truncate Tables
    print("Truncating tables...")
    cur.execute("TRUNCATE TABLE assessments_summary, assessments_recharge_breakdown, assessments_extraction_breakdown, assessments_discharge_breakdown, blocks, districts, states CASCADE;")
    conn.commit()

    # 1. Load Master Index
    print(f"Loading Master Index from {INDEX_FILE}...")
    with open(INDEX_FILE, 'r') as f:
        master_index = json.load(f)
    
    states = master_index.get('states', {})
    districts = master_index.get('districts', {})
    blocks = master_index.get('blocks', {})
    
    print(f"Index contains: {len(states)} States, {len(districts)} Districts, {len(blocks)} Blocks.")

    # Lookup maps for path construction
    # UUID -> Name
    state_names = {}
    district_names = {}

    # 2. Ingest States
    print("Ingesting States...")
    for s_uuid, s_data in states.items():
        s_name = s_data['name']
        state_names[s_uuid] = s_name
        
        cur.execute("""
            INSERT INTO states (state_uuid, state_name) 
            VALUES (%s, %s) 
            ON CONFLICT (state_uuid) DO NOTHING
        """, (s_uuid, s_name))
    conn.commit()

    # 3. Ingest Districts
    print("Ingesting Districts...")
    for d_uuid, d_data in districts.items():
        d_name = d_data['name']
        s_uuid = d_data['parent_state_uuid']
        district_names[d_uuid] = d_name
        
        cur.execute("""
            INSERT INTO districts (district_uuid, district_name, state_uuid)
            VALUES (%s, %s, %s)
            ON CONFLICT (district_uuid) DO NOTHING
        """, (d_uuid, d_name, s_uuid))
    conn.commit()

    # 4. Ingest Blocks and Assessment Data for ALL YEARS
    print(f"Ingesting Blocks and Assessments for years: {', '.join(YEARS)}...")
    
    for year in YEARS:
        print(f"\n--- Processing Year: {year} ---")
        year_dir = DATA_DIR / year
        
        if not year_dir.exists():
            print(f"  Skipping {year} - directory not found")
            continue
        
        blocks_processed = 0
        blocks_skipped = 0
        
        for b_uuid, b_data in tqdm(blocks.items(), desc=f"Blocks ({year})"):
            b_name = b_data['name']
            d_uuid = b_data['parent_district_uuid']
            
            # Get Parent Names for Path
            d_name = district_names.get(d_uuid)
            d_entry = districts.get(d_uuid)
            if not d_entry:
                blocks_skipped += 1
                continue
                
            s_uuid = d_entry['parent_state_uuid']
            s_name = state_names.get(s_uuid)
            
            if not d_name or not s_name:
                blocks_skipped += 1
                continue

            # Construct File Path (include year folder)
            json_path = DATA_DIR / year / s_name / d_name / f"{b_name}.json"
            
            if not json_path.exists():
                # Skip block if file doesn't exist
                blocks_skipped += 1
                continue

            # Insert Block ONLY if file exists (only once, not per year)
            cur.execute("""
                INSERT INTO blocks (block_uuid, block_name, district_uuid, state_uuid)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (block_uuid) DO NOTHING
            """, (b_uuid, b_name, d_uuid, s_uuid))

            try:
                with open(json_path, 'r') as f:
                    b_data_list = json.load(f)
            except Exception as e:
                print(f"Error reading {json_path}: {e}")
                blocks_skipped += 1
                continue

            if isinstance(b_data_list, list) and len(b_data_list) > 0:
                item = b_data_list[0]
            elif isinstance(b_data_list, dict):
                item = b_data_list
            else:
                blocks_skipped += 1
                continue
            
            # Extract Assessment Data
            rainfall_data = item.get('rainfall', {})
            rainfall = safe_get_total(rainfall_data) if isinstance(rainfall_data, dict) else safe_float(rainfall_data)
            
            stage = item.get('stageOfExtraction')
            if isinstance(stage, dict): stage = safe_get_total(stage)
            else: stage = safe_float(stage)
            
            category_data = item.get('category')
            category = str(category_data.get('total', '')) if isinstance(category_data, dict) else str(category_data)
            
            recharge_data = item.get('rechargeData', {})
            draft_data = item.get('draftData', {})
            
            recharge_total = safe_get_total(recharge_data.get('total', {}))
            extraction_total = safe_get_total(draft_data.get('total', {}))
            extractable_total = safe_get_total(item.get('currentAvailabilityForAllPurposes', {}))
            
            # Insert Summary for THIS YEAR
            cur.execute("""
                INSERT INTO assessments_summary (
                    block_uuid, year, rainfall, total_recharge, total_discharge,
                    total_extractable, total_extraction, category, stage, raw
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (block_uuid, year) DO UPDATE SET
                    rainfall = EXCLUDED.rainfall,
                    total_recharge = EXCLUDED.total_recharge,
                    total_discharge = EXCLUDED.total_discharge,
                    total_extractable = EXCLUDED.total_extractable,
                    total_extraction = EXCLUDED.total_extraction,
                    category = EXCLUDED.category,
                    stage = EXCLUDED.stage,
                    raw = EXCLUDED.raw
                RETURNING assessment_id
            """, (
                b_uuid, year, rainfall, recharge_total, 0.0,
                extractable_total, extraction_total, category, stage, json.dumps(item)
            ))
            
            assessment_id = cur.fetchone()[0]
            
            # Helper to insert breakdown
            def insert_breakdown(table, source_data):
                if not source_data or not isinstance(source_data, dict): return
                cur.execute(f"DELETE FROM {table} WHERE assessment_id = %s", (assessment_id,))
                
                total_row = source_data.get('total', {})
                if isinstance(total_row, dict):
                    cur.execute(f"""
                        INSERT INTO {table} (assessment_id, source, command, non_command, total)
                        VALUES (%s, 'Total', %s, %s, %s)
                    """, (assessment_id, safe_float(total_row.get('command')), safe_float(total_row.get('non_command')), safe_float(total_row.get('total'))))
                
                for key, val in source_data.items():
                    if key == 'total' or not isinstance(val, dict): continue
                    cur.execute(f"""
                        INSERT INTO {table} (assessment_id, source, command, non_command, total)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (assessment_id, key, safe_float(val.get('command')), safe_float(val.get('non_command')), safe_float(val.get('total'))))

            insert_breakdown('assessments_recharge_breakdown', recharge_data)
            insert_breakdown('assessments_extraction_breakdown', draft_data)
            
            blocks_processed += 1
        
        # Commit after each year
        conn.commit()
        print(f"  Year {year}: Processed {blocks_processed} blocks, Skipped {blocks_skipped}")

    cur.close()
    conn.close()
    print("\n--- Offline Ingestion Complete for ALL YEARS ---")

if __name__ == "__main__":
    load_data()
