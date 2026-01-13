
import os
import json
import glob

def extract_block_data(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            if not data or not isinstance(data, list) or len(data) == 0:
                return None
            
            block = data[0]
            if not block or not isinstance(block, dict):
                return None
            
            # Extract key metrics
            # Note: The JSON structure is complex, we need to find the specific fields the user cares about
            
            # Total Extractable Resource
            extractable = block.get('totalGWAvailability', {}).get('total', 0)
            
            # Extraction - need to sum agriculture, domestic, industry
            extraction_agg = 0
            comp_summary = block.get('computationSummary', {}) or {}
            annual_data = comp_summary.get('annual', {}) or {}
            draft = annual_data.get('draft', {}) or {}
            
            # Simple sum of draft totals if they exist
            for sector in ['agriculture', 'domestic', 'industry']:
                sector_dec = (draft.get(sector, {}) or {}).get('decision', {}) or {}
                sector_data = sector_dec.get('non_command', {}) or {}
                extraction_agg += float(sector_data.get('u_dr', 0) or 0)
            
            # Category
            category = block.get('category', {}).get('total', 'unknown')
            
            # Rainfall
            rainfall = block.get('rainfall', {}).get('total', 0)
            
            # Stage
            stage = 0
            if extractable > 0:
                stage = (extraction_agg / extractable) * 100

            return {
                "name": block.get('locationName', 'Unknown'),
                "uuid": block.get('locationUUID', ''),
                "extractable_ham": extractable,
                "extraction_ham": extraction_agg,
                "stage": stage,
                "category": category,
                "rainfall": rainfall
            }
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

def build_master_dataset():
    data_root = "Data/data"
    years = ["2023-2024", "2024-2025"]
    
    master_data = {}
    
    for year in years:
        year_path = os.path.join(data_root, year)
        if not os.path.exists(year_path):
            continue
            
        print(f"Processing Year: {year}")
        master_data[year] = []
        
        # Use glob to find all files recursively
        pattern = os.path.join(year_path, "**/*.json")
        files = glob.glob(pattern, recursive=True)
        
        for file_path in files:
            # Skip summary files
            filename = os.path.basename(file_path).lower()
            if filename in ["total.json", "summary.json"] or filename == os.path.basename(os.path.dirname(file_path)).lower() + ".json":
                continue
                
            block_data = extract_block_data(file_path)
            if block_data:
                # Add location context from path
                path_parts = file_path.split(os.sep)
                # Data/data/YEAR/STATE/DISTRICT/BLOCK.json
                if len(path_parts) >= 5:
                    block_data["state"] = path_parts[3]
                    block_data["district"] = path_parts[4]
                
                master_data[year].append(block_data)
        
        print(f"  Extracted {len(master_data[year])} blocks for {year}")

    # Save to frontend directory
    output_path = "src/data/groundwater_dataset.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(master_data, f, indent=2)
    
    print(f"Successfully saved master dataset to {output_path}")

if __name__ == "__main__":
    build_master_dataset()
