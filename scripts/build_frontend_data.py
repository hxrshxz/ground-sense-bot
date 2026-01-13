
import os
import json
import glob

def extract_blocks_from_file(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            if not data or not isinstance(data, list):
                return []
            
            blocks = []
            for block in data:
                if not isinstance(block, dict): continue
                
                # Extract key metrics
                # Safety wrapper: (block.get(KEY) or {}).get(SUBKEY)
                
                # Total Extractable Resource
                extractable = (block.get('totalGWAvailability') or {}).get('total', 0)
                
                # Extraction
                extraction_agg = 0
                comp_summary = block.get('computationSummary') or {}
                annual_data = comp_summary.get('annual') or {}
                draft = annual_data.get('draft') or {}
                
                for sector in ['agriculture', 'domestic', 'industry']:
                    sector_dec = (draft.get(sector) or {}).get('decision') or {}
                    sector_data = sector_dec.get('non_command') or {}
                    extraction_agg += float(sector_data.get('u_dr') or 0)
                
                # Category
                category = (block.get('category') or {}).get('total', 'unknown')
                
                # Rainfall
                rainfall = (block.get('rainfall') or {}).get('total', 0)
                
                # Stage
                stage = 0
                if extractable > 0:
                    stage = (extraction_agg / extractable) * 100

                blocks.append({
                    "name": block.get('locationName', 'Unknown'),
                    "uuid": block.get('locationUUID', ''),
                    "extractable_ham": extractable,
                    "extraction_ham": extraction_agg,
                    "stage": stage,
                    "category": category,
                    "rainfall": rainfall
                })
            return blocks
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

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
            if filename in ["total.json", "summary.json"]:
                continue
                
            file_blocks = extract_blocks_from_file(file_path)
            
            if file_blocks:
                path_parts = file_path.split(os.sep)
                # Structure 1: Data/data/YEAR/STATE/DISTRICT/BLOCK.json (len >= 6 usually, or 5 if running from root)
                # path_parts: ['Data', 'data', '2024-2025', 'STATE', 'DISTRICT', 'BLOCK.json'] -> len 6
                
                state_name = "Unknown"
                district_name = "Unknown"

                # Logic to infer state/district from path
                if len(path_parts) >= 6:
                    state_name = path_parts[3]
                    district_name = path_parts[4]
                elif len(path_parts) == 4: 
                    # Data/data/YEAR/STATE.json (e.g. DELHI.json)
                    state_name = os.path.splitext(path_parts[3])[0] # DELHI
                    district_name = state_name # Use state as district for UTs/Cities if single file
                
                for b in file_blocks:
                    b["state"] = state_name
                    
                    # If district is not set or unknown, use inferred district
                    current_district = b.get("district", "Unknown")
                    if current_district == "Unknown":
                         b["district"] = district_name
                    else:
                         if district_name != "Unknown":
                             b["district"] = district_name
                             
                    master_data[year].append(b)
        
        print(f"  Extracted {len(master_data[year])} blocks for {year}")

    # Save to frontend directory
    output_path = "src/data/groundwater_dataset.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(master_data, f, indent=2)
    
    print(f"Successfully saved master dataset to {output_path}")

if __name__ == "__main__":
    build_master_dataset()
