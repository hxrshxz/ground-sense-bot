#!/usr/bin/env python3
"""
Load Ground Water Assessment Data from Markdown Files
Reads the official 2023-2024.md and 2024-2025.md files and loads into PostgreSQL
"""

import os
import psycopg2
import psycopg2.extensions
from pathlib import Path
from tqdm import tqdm
import uuid
import json
from typing import Dict, Any

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'ground_sense_bot',
    'user': 'admin',
    'password': 'admin'
}

# Markdown files
MD_FILES = {
    '2023-2024': Path(__file__).parent / '2023-2024.md',
    '2024-2025': Path(__file__).parent / '2024-2025.md'
}

def get_db_connection():
    """Create database connection with autocommit"""
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    return conn

def safe_float(value):
    """Convert value to float safely"""
    if value is None or value == '':
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def parse_markdown_line(line: str) -> Dict[str, Any]:
    """Parse a single tab-separated line from markdown file"""
    fields = line.strip().split('\t')
    
    if len(fields) < 22:
        return None
    
    try:
        data = {
            'sl_no': int(fields[0]) if fields[0] else None,
            'state': fields[1].strip(),
            'district': fields[2].strip(),
            'assessment_unit_name': fields[3].strip(),
            'assessment_unit_type': fields[4].strip(),
            'total_area': safe_float(fields[5]),
            'recharge_worthy_area': safe_float(fields[6]),
            'recharge_rainfall_monsoon': safe_float(fields[7]),
            'recharge_other_monsoon': safe_float(fields[8]),
            'recharge_rainfall_non_monsoon': safe_float(fields[9]),
            'recharge_other_non_monsoon': safe_float(fields[10]),
            'total_annual_recharge': safe_float(fields[11]),
            'total_natural_discharge': safe_float(fields[12]),
            'annual_extractable': safe_float(fields[13]),
            'extraction_irrigation': safe_float(fields[14]),
            'extraction_industrial': safe_float(fields[15]),
            'extraction_domestic': safe_float(fields[16]),
            'total_extraction': safe_float(fields[17]),
            'annual_gw_allocation_domestic': safe_float(fields[18]),
            'net_availability_future': safe_float(fields[19]),
            'stage_extraction': safe_float(fields[20]),
            'category': fields[21].strip().lower() if fields[21] else 'safe',
            'urban_au': fields[22].strip() if len(fields) > 22 else ''
        }
        return data
    except Exception as e:
        print(f"Error parsing line: {e}")
        return None

def get_or_create_state(conn, state_name: str) -> str:
    """Get state UUID or create if not exists"""
    with conn.cursor() as cur:
        # Check if state exists
        cur.execute("SELECT state_uuid FROM states WHERE state_name = %s", (state_name,))
        result = cur.fetchone()
        
        if result:
            return str(result[0])
        
        # Create new state
        state_uuid = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO states (state_uuid, state_name) VALUES (%s, %s)",
            (state_uuid, state_name)
        )
        return state_uuid

def get_or_create_district(conn, district_name: str, state_uuid: str) -> str:
    """Get district UUID or create if not exists"""
    with conn.cursor() as cur:
        # Check if district exists
        cur.execute(
            "SELECT district_uuid FROM districts WHERE district_name = %s AND state_uuid = %s",
            (district_name, state_uuid)
        )
        result = cur.fetchone()
        
        if result:
            return str(result[0])
        
        # Create new district
        district_uuid = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO districts (district_uuid, district_name, state_uuid) VALUES (%s, %s, %s)",
            (district_uuid, district_name, state_uuid)
        )
        return district_uuid

def get_or_create_block(conn, block_name: str, district_uuid: str, state_uuid: str) -> str:
    """Get block UUID or create if not exists"""
    with conn.cursor() as cur:
        # Check if block exists
        cur.execute(
            "SELECT block_uuid FROM blocks WHERE block_name = %s AND district_uuid = %s",
            (block_name, district_uuid)
        )
        result = cur.fetchone()
        
        if result:
            return str(result[0])
        
        # Create new block
        block_uuid = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO blocks (block_uuid, block_name, district_uuid, state_uuid) VALUES (%s, %s, %s, %s)",
            (block_uuid, block_name, district_uuid, state_uuid)
        )
        return block_uuid

def insert_assessment(conn, block_uuid: str, year: str, data: Dict[str, Any]):
    """Insert or update assessment data"""
    
    # Create raw JSON data
    raw_data = {
        'stateName': data['state'],
        'districtName': data['district'],
        'name': data['assessment_unit_name'],
        'assessmentUnitType': data['assessment_unit_type'],
        'totalArea': data['total_area'],
        'rechargeWorthyArea': data['recharge_worthy_area'],
        'year': year,
        'rainfall': (data['recharge_rainfall_monsoon'] or 0) + (data['recharge_rainfall_non_monsoon'] or 0),
        'totalNaturalRecharge': data['total_annual_recharge'],
        'totalNaturalDischarge': data['total_natural_discharge'],
        'totalExtractable': data['annual_extractable'],
        'totalExtraction': data['total_extraction'],
        'category': data['category'],
        'stage': data['stage_extraction'],
        'availability': data['net_availability_future'],
        'recharge': {
            'rainfallMonsoon': data['recharge_rainfall_monsoon'],
            'otherMonsoon': data['recharge_other_monsoon'],
            'rainfallNonMonsoon': data['recharge_rainfall_non_monsoon'],
            'otherNonMonsoon': data['recharge_other_non_monsoon'],
            'total': data['total_annual_recharge']
        },
        'extraction': {
            'irrigation': data['extraction_irrigation'],
            'industrial': data['extraction_industrial'],
            'domestic': data['extraction_domestic'],
            'total': data['total_extraction']
        },
        'discharge': {
            'total': data['total_natural_discharge']
        }
    }
    
    with conn.cursor() as cur:
        # Insert or update assessment summary
        cur.execute("""
            INSERT INTO assessments_summary (
                block_uuid, year, rainfall, total_recharge, total_discharge,
                total_extractable, total_extraction, category, stage, availability, raw
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (block_uuid, year) DO UPDATE SET
                rainfall = EXCLUDED.rainfall,
                total_recharge = EXCLUDED.total_recharge,
                total_discharge = EXCLUDED.total_discharge,
                total_extractable = EXCLUDED.total_extractable,
                total_extraction = EXCLUDED.total_extraction,
                category = EXCLUDED.category,
                stage = EXCLUDED.stage,
                availability = EXCLUDED.availability,
                raw = EXCLUDED.raw
            RETURNING assessment_id
        """, (
            block_uuid, year,
            raw_data['rainfall'],
            raw_data['totalNaturalRecharge'],
            raw_data['totalNaturalDischarge'],
            raw_data['totalExtractable'],
            raw_data['totalExtraction'],
            raw_data['category'],
            raw_data['stage'],
            raw_data['availability'],
            json.dumps(raw_data)
        ))
        
        assessment_id = cur.fetchone()[0]
        
        # Delete existing breakdowns first
        cur.execute("DELETE FROM assessments_recharge_breakdown WHERE assessment_id = %s", (assessment_id,))
        cur.execute("DELETE FROM assessments_extraction_breakdown WHERE assessment_id = %s", (assessment_id,))
        cur.execute("DELETE FROM assessments_discharge_breakdown WHERE assessment_id = %s", (assessment_id,))
        
        # Insert recharge breakdown - Rainfall
        if data['recharge_rainfall_monsoon'] is not None or data['recharge_rainfall_non_monsoon'] is not None:
            cur.execute("""
                INSERT INTO assessments_recharge_breakdown (
                    assessment_id, source, command, non_command, total
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                assessment_id,
                'Rainfall',
                data['recharge_rainfall_monsoon'] or 0,
                data['recharge_rainfall_non_monsoon'] or 0,
                (data['recharge_rainfall_monsoon'] or 0) + (data['recharge_rainfall_non_monsoon'] or 0)
            ))
        
        # Insert recharge breakdown - Other Sources
        if data['recharge_other_monsoon'] is not None or data['recharge_other_non_monsoon'] is not None:
            cur.execute("""
                INSERT INTO assessments_recharge_breakdown (
                    assessment_id, source, command, non_command, total
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                assessment_id,
                'Other Sources',
                data['recharge_other_monsoon'] or 0,
                data['recharge_other_non_monsoon'] or 0,
                (data['recharge_other_monsoon'] or 0) + (data['recharge_other_non_monsoon'] or 0)
            ))
        
        # Insert extraction breakdown - Irrigation
        if data['extraction_irrigation'] is not None:
            cur.execute("""
                INSERT INTO assessments_extraction_breakdown (
                    assessment_id, source, command, non_command, total
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                assessment_id,
                'Irrigation',
                0,
                0,
                data['extraction_irrigation'] or 0
            ))
        
        # Insert extraction breakdown - Industrial
        if data['extraction_industrial'] is not None:
            cur.execute("""
                INSERT INTO assessments_extraction_breakdown (
                    assessment_id, source, command, non_command, total
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                assessment_id,
                'Industrial',
                0,
                0,
                data['extraction_industrial'] or 0
            ))
        
        # Insert extraction breakdown - Domestic
        if data['extraction_domestic'] is not None:
            cur.execute("""
                INSERT INTO assessments_extraction_breakdown (
                    assessment_id, source, command, non_command, total
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                assessment_id,
                'Domestic',
                0,
                0,
                data['extraction_domestic'] or 0
            ))
        
        # Insert discharge breakdown
        if data['total_natural_discharge'] is not None:
            cur.execute("""
                INSERT INTO assessments_discharge_breakdown (
                    assessment_id, source, command, non_command, total
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                assessment_id,
                'Natural Discharge',
                0,
                0,
                data['total_natural_discharge'] or 0
            ))

def load_markdown_file(conn, filepath: Path, year: str):
    """Load data from a markdown file"""
    print(f"\n{'='*70}")
    print(f"Processing: {filepath.name} (Year: {year})")
    print(f"{'='*70}")
    
    if not filepath.exists():
        print(f"❌ File not found: {filepath}")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Skip header line
    data_lines = lines[1:]
    
    processed = 0
    skipped = 0
    errors = 0
    
    for line in tqdm(data_lines, desc=f"Loading {year}"):
        if not line.strip():
            skipped += 1
            continue
        
        data = parse_markdown_line(line)
        if not data:
            skipped += 1
            continue
        
        try:
            # Get or create state
            state_uuid = get_or_create_state(conn, data['state'])
            
            # Get or create district
            district_uuid = get_or_create_district(conn, data['district'], state_uuid)
            
            # Get or create block
            block_uuid = get_or_create_block(
                conn,
                data['assessment_unit_name'],
                district_uuid,
                state_uuid
            )
            
            # Insert assessment data
            insert_assessment(conn, block_uuid, year, data)
            
            processed += 1
            
        except Exception as e:
            print(f"\n❌ Error processing record: {e}")
            print(f"   Data: {data['state']} - {data['district']} - {data['assessment_unit_name']}")
            errors += 1
            continue
    
    print(f"\n✅ Processed: {processed} records")
    print(f"⚠️  Skipped: {skipped} records")
    if errors > 0:
        print(f"❌ Errors: {errors} records")

def main():
    """Main execution"""
    print("\n" + "="*70)
    print("LOADING GROUNDWATER DATA FROM MARKDOWN FILES")
    print("="*70)
    
    conn = get_db_connection()
    
    try:
        # Load each markdown file
        for year, filepath in MD_FILES.items():
            load_markdown_file(conn, filepath, year)
        
        # Show final statistics
        with conn.cursor() as cur:
            cur.execute("""
                SELECT year, COUNT(*) as count
                FROM assessments_summary
                GROUP BY year
                ORDER BY year
            """)
            results = cur.fetchall()
            
            print("\n" + "="*70)
            print("DATABASE STATISTICS")
            print("="*70)
            for year, count in results:
                print(f"{year}: {count} records")
        
        print("\n✅ Data loading completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
