#!/usr/bin/env python3
"""
InGRES GEC Data Collector
Automatically fetches groundwater assessment data for all states, districts, and blocks in India.
"""

import os
import json
import time
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configuration
BASE_URL = "https://ingres.iith.ac.in/api/gec/getBusinessDataForUserOpen"
DATA_DIR = Path("/home/hxrshxz/Desktop/Projects/sih/Data/data")
INDEX_FILE = Path("/home/hxrshxz/Desktop/Projects/sih/Data/master_index.json")
LOG_FILE = Path("/home/hxrshxz/Desktop/Projects/sih/Data/collection.log")
ERROR_LOG_FILE = Path("/home/hxrshxz/Desktop/Projects/sih/Data/errors.log")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Setup error logging
error_logger = logging.getLogger('error_logger')
error_logger.setLevel(logging.ERROR)
error_handler = logging.FileHandler(ERROR_LOG_FILE)
error_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
error_logger.addHandler(error_handler)

# India root UUID (from example)
INDIA_UUID = "ffce954d-24e1-494b-ba7e-0931d8ad6085"
INDIA_NAME = "INDIA"

# Headers for API requests
HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Content-Type': 'application/json',
    'Origin': 'https://ingres.iith.ac.in',
    'Referer': 'https://ingres.iith.ac.in/gecdataonline/'
}

# Cookies from example
COOKIES = {
    '_gid': 'GA1.3.2052393157.1764687506',
    '_ga': 'GA1.1.655895987.1763932451',
    '_ga_KZY8WEL504': 'GS2.1.s1764699696$o15$g1$t1764701700$j60$l0$h0',
    '_gat_gtag_UA_206528865_1': '1'
}


class MasterIndex:
    """Maintains hierarchical index of all locations"""
    
    def __init__(self):
        self.states = {}
        self.districts = {}
        self.blocks = {}
        
    def add_state(self, uuid: str, name: str):
        self.states[uuid] = {
            "name": name,
            "uuid": uuid
        }
        
    def add_district(self, uuid: str, name: str, state_uuid: str):
        self.districts[uuid] = {
            "name": name,
            "uuid": uuid,
            "parent_state_uuid": state_uuid
        }
        
    def add_block(self, uuid: str, name: str, district_uuid: str):
        self.blocks[uuid] = {
            "name": name,
            "uuid": uuid,
            "parent_district_uuid": district_uuid
        }
    
    def save(self, filepath: Path):
        """Save master index to JSON file"""
        data = {
            "states": self.states,
            "districts": self.districts,
            "blocks": self.blocks,
            "metadata": {
                "total_states": len(self.states),
                "total_districts": len(self.districts),
                "total_blocks": len(self.blocks),
                "collection_timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }
        }
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"Master index saved: {len(self.states)} states, {len(self.districts)} districts, {len(self.blocks)} blocks")


class GECDataCollector:
    """Main collector class for InGRES GEC data"""
    
    def __init__(self):
        self.session = self._create_session()
        self.master_index = MasterIndex()
        self.stats = {
            "states_processed": 0,
            "districts_processed": 0,
            "blocks_processed": 0,
            "failed_requests": 0,
            "total_requests": 0
        }
        
    def _create_session(self) -> requests.Session:
        """Create requests session with retry logic"""
        session = requests.Session()
        
        # Retry strategy
        retry_strategy = Retry(
            total=5,
            backoff_factor=2,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST", "GET"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def _make_request(self, payload: Dict, max_retries: int = 3) -> Optional[Dict]:
        """Make API request with retry logic"""
        self.stats["total_requests"] += 1
        
        for attempt in range(max_retries):
            try:
                response = self.session.post(
                    BASE_URL,
                    json=payload,
                    headers=HEADERS,
                    cookies=COOKIES,
                    timeout=30
                )
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request failed (attempt {attempt + 1}/{max_retries}): {e}")
                error_logger.error(f"Request failed for {payload.get('locname', 'UNKNOWN')}: {e}")
                
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    self.stats["failed_requests"] += 1
                    error_logger.error(f"Max retries exceeded for payload: {json.dumps(payload)}")
                    return None
        
        return None
    
    def _sanitize_filename(self, name: str) -> str:
        """Sanitize location name for use in filesystem"""
        # Replace problematic characters
        sanitized = name.replace('/', '_').replace('\\', '_').replace(':', '_')
        sanitized = sanitized.replace('*', '_').replace('?', '_').replace('"', '_')
        sanitized = sanitized.replace('<', '_').replace('>', '_').replace('|', '_')
        return sanitized.strip()
    
    def _save_json(self, data: Dict, state_name: str, district_name: Optional[str] = None, 
                   block_name: Optional[str] = None):
        """Save API response to appropriate directory structure"""
        # Sanitize names
        state_name = self._sanitize_filename(state_name)
        
        if block_name:
            # Block level: /data/<state>/<district>/<block>.json
            district_name = self._sanitize_filename(district_name)
            block_name = self._sanitize_filename(block_name)
            
            dir_path = DATA_DIR / state_name / district_name
            dir_path.mkdir(parents=True, exist_ok=True)
            
            file_path = dir_path / f"{block_name}.json"
            
        elif district_name:
            # District level: /data/<state>/<district>.json
            district_name = self._sanitize_filename(district_name)
            
            dir_path = DATA_DIR / state_name
            dir_path.mkdir(parents=True, exist_ok=True)
            
            file_path = dir_path / f"{district_name}.json"
            
        else:
            # State level: /data/<state>.json
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            file_path = DATA_DIR / f"{state_name}.json"
        
        # Save data
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.debug(f"Saved: {file_path}")
    
    def _extract_children(self, response_data: Dict) -> List[Dict]:
        """Extract child locations from API response"""
        children = []
        
        # Response structure can vary, check common patterns
        if isinstance(response_data, dict):
            # Check for direct list of locations
            if 'data' in response_data and isinstance(response_data['data'], list):
                children = response_data['data']
            elif 'result' in response_data and isinstance(response_data['result'], list):
                children = response_data['result']
            elif 'locations' in response_data and isinstance(response_data['locations'], list):
                children = response_data['locations']
            elif isinstance(response_data, list):
                children = response_data
            else:
                # Sometimes the response itself is a list at the top level
                # or nested in various keys - we'll try to find location data
                for key, value in response_data.items():
                    if isinstance(value, list) and len(value) > 0:
                        # Check if list items have locationName/locationUUID
                        if any('locationName' in item or 'locationUUID' in item for item in value if isinstance(item, dict)):
                            children = value
                            break
        elif isinstance(response_data, list):
            children = response_data
        
        return children
    
    def fetch_states(self) -> List[Tuple[str, str]]:
        """Fetch all states from India root"""
        logger.info("=" * 70)
        logger.info("PHASE A: STARTING DATA COLLECTION")
        logger.info("=" * 70)
        logger.info("Fetching states from INDIA root...")
        
        # Request India level to get states
        payload = {
            "parentLocName": "",
            "locname": INDIA_NAME,
            "loctype": "COUNTRY",
            "view": "admin",
            "locuuid": INDIA_UUID,
            "year": "2024-2025",
            "computationType": "normal",
            "component": "recharge",
            "period": "annual",
            "category": "safe",
            "mapOnClickParams": "true",
            "stateuuid": None,
            "verificationStatus": 1,
            "approvalLevel": 1,
            "parentuuid": ""
        }
        
        response_data = self._make_request(payload)
        if not response_data:
            logger.error("Failed to fetch states from INDIA root")
            return []
        
        # Save India root response
        self._save_json(response_data, "INDIA")
        
        # Extract states
        children = self._extract_children(response_data)
        states = []
        
        for child in children:
            # Extract location info
            state_name = child.get('locationName') or child.get('locname') or child.get('name')
            state_uuid = child.get('locationUUID') or child.get('locuuid') or child.get('uuid')
            
            if state_name and state_uuid:
                states.append((state_name, state_uuid))
                self.master_index.add_state(state_uuid, state_name)
                logger.info(f"  Found state: {state_name}")
        
        logger.info(f"Total states found: {len(states)}")
        return states
    
    def fetch_districts(self, state_name: str, state_uuid: str) -> List[Tuple[str, str]]:
        """Fetch all districts for a given state"""
        logger.info(f"\n  Fetching districts for STATE: {state_name}")
        
        payload = {
            "parentLocName": INDIA_NAME,
            "locname": state_name,
            "loctype": "STATE",
            "view": "admin",
            "locuuid": state_uuid,
            "year": "2024-2025",
            "computationType": "normal",
            "component": "recharge",
            "period": "annual",
            "category": "safe",
            "mapOnClickParams": "true",
            "stateuuid": None,
            "verificationStatus": 1,
            "approvalLevel": 1,
            "parentuuid": INDIA_UUID
        }
        
        response_data = self._make_request(payload)
        if not response_data:
            logger.error(f"Failed to fetch districts for state: {state_name}")
            return []
        
        # Save state response
        self._save_json(response_data, state_name)
        
        # Extract districts
        children = self._extract_children(response_data)
        districts = []
        
        for child in children:
            district_name = child.get('locationName') or child.get('locname') or child.get('name')
            district_uuid = child.get('locationUUID') or child.get('locuuid') or child.get('uuid')
            
            if district_name and district_uuid:
                districts.append((district_name, district_uuid))
                self.master_index.add_district(district_uuid, district_name, state_uuid)
                logger.info(f"    Found district: {district_name}")
        
        self.stats["states_processed"] += 1
        logger.info(f"  Total districts in {state_name}: {len(districts)}")
        return districts
    
    def fetch_blocks(self, state_name: str, state_uuid: str, district_name: str, district_uuid: str) -> List[Tuple[str, str]]:
        """Extract block UUIDs from district's reportSummary - blocks are embedded in state JSON"""
        logger.info(f"      Extracting blocks from DISTRICT: {district_name}")
        
        # Read the state JSON file which contains all districts
        state_file = DATA_DIR / f"{state_name}.json"
        
        if not state_file.exists():
            logger.warning(f"State file not found: {state_file}")
            return []
        
        try:
            with open(state_file, 'r', encoding='utf-8') as f:
                state_data = json.load(f)
            
            blocks = []
            
            # State data is a list of districts
            if isinstance(state_data, list):
                # Find the matching district
                district_obj = None
                for d in state_data:
                    if d.get('locationName') == district_name or d.get('locationUUID') == district_uuid:
                        district_obj = d
                        break
                
                if not district_obj:
                    logger.warning(f"District {district_name} not found in {state_file}")
                    return []
                
                # Extract blocks from reportSummary
                if 'reportSummary' in district_obj:
                    report_summary = district_obj['reportSummary']
                    
                    # Block UUIDs are keys in reportSummary (except 'total')
                    for key in report_summary.keys():
                        if key != 'total' and len(key) > 20:  # UUIDs are long strings (36 chars with dashes)
                            # We have the UUID but not the block name yet - will fetch it
                            blocks.append((None, key))  # (name, uuid) - name will be fetched
                            self.master_index.add_block(key, f"BLOCK_{key[:8]}", district_uuid)
                
                logger.info(f"      Found {len(blocks)} block UUIDs in reportSummary")
                self.stats["districts_processed"] += 1
                return blocks
                
        except Exception as e:
            logger.error(f"Error reading state file: {e}")
            error_logger.error(f"Failed to extract blocks from {state_file}: {e}")
            return []
        
        return []
    
    def fetch_block_data(self, state_name: str, state_uuid: str, district_name: str, district_uuid: str, block_name: str, block_uuid: str):
        """Fetch full detailed dataset for a given block"""
        
        payload = {
            "parentLocName": INDIA_NAME,
            "locname": block_name or "UNKNOWN",
            "loctype": "BLOCK",
            "view": "admin",
            "locuuid": block_uuid,
            "year": "2024-2025",
            "computationType": "normal",
            "component": "recharge",
            "period": "annual",
            "category": "safe",
            "mapOnClickParams": "true",
            "stateuuid": None,  # CRITICAL: Must be None/null for blocks to return data!
            "verificationStatus": 1,
            "approvalLevel": 1,
            "parentuuid": state_uuid  # Use state UUID as parent for blocks
        }
        
        response_data = self._make_request(payload)
        if not response_data:
            logger.warning(f"Failed to fetch data for block UUID: {block_uuid[:16]}...")
            return
        
        # Extract the actual block name from response
        if isinstance(response_data, list) and len(response_data) > 0:
            actual_block_name = response_data[0].get('locationName') or block_name
        elif isinstance(response_data, dict):
            actual_block_name = response_data.get('locationName') or block_name
        else:
            actual_block_name = block_name or f"BLOCK_{block_uuid[:8]}"
        
        # Save block response
        self._save_json(response_data, state_name, district_name, actual_block_name)
        
        # Update master index with actual block name
        self.master_index.add_block(block_uuid, actual_block_name, district_uuid)
        
        self.stats["blocks_processed"] += 1
        logger.debug(f"          Fetched block: {actual_block_name}")
    
    def collect_all_data(self):
        """Main collection orchestrator - traverse entire hierarchy"""
        start_time = time.time()
        logger.info("Starting InGRES GEC Data Collection")
        logger.info(f"Output directory: {DATA_DIR}")
        
        # Create base directories
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        
        # Step 1: Fetch all states
        states = self.fetch_states()
        if not states:
            logger.error("No states found. Aborting.")
            return
        
        # Step 2: Iterate through each state
        for state_idx, (state_name, state_uuid) in enumerate(states, 1):
            logger.info(f"\n{'=' * 70}")
            logger.info(f"Processing STATE {state_idx}/{len(states)}: {state_name}")
            logger.info(f"{'=' * 70}")
            
            # Fetch districts for this state
            districts = self.fetch_districts(state_name, state_uuid)
            
            if not districts:
                logger.warning(f"No districts found for state: {state_name}")
                continue
            
            # Step 3: Iterate through each district
            for district_idx, (district_name, district_uuid) in enumerate(districts, 1):
                logger.info(f"\n  --- District {district_idx}/{len(districts)}: {district_name} ---")
                
                # Extract block UUIDs from district's reportSummary
                blocks = self.fetch_blocks(state_name, state_uuid, district_name, district_uuid)
                
                if not blocks:
                    logger.info(f"      No blocks in reportSummary")
                    continue
                
                # Step 4: Fetch detailed data for each block
                logger.info(f"      Fetching data for {len(blocks)} blocks...")
                for block_idx, (block_name, block_uuid) in enumerate(blocks, 1):
                    if block_idx % 20 == 0:  # Progress update every 20 blocks
                        logger.info(f"        Progress: {block_idx}/{len(blocks)} blocks")
                    
                    # Fetch full block data (stateuuid must be None!)
                    self.fetch_block_data(state_name, state_uuid, district_name, district_uuid, block_name, block_uuid)
                    
                    # Rate limiting - be respectful
                    time.sleep(0.3)
                
                # Small delay between districts
                time.sleep(1)
            
            # Save master index periodically (after each state)
            self.master_index.save(INDEX_FILE)
            
            # Small delay between states
            time.sleep(2)
        
        # Final save of master index
        self.master_index.save(INDEX_FILE)
        
        # Print final statistics
        elapsed_time = time.time() - start_time
        logger.info("\n" + "=" * 70)
        logger.info("DATA COLLECTION COMPLETE")
        logger.info("=" * 70)
        logger.info(f"Total time: {elapsed_time / 60:.2f} minutes")
        logger.info(f"States processed: {self.stats['states_processed']}")
        logger.info(f"Districts processed: {self.stats['districts_processed']}")
        logger.info(f"Blocks processed: {self.stats['blocks_processed']}")
        logger.info(f"Total API requests: {self.stats['total_requests']}")
        logger.info(f"Failed requests: {self.stats['failed_requests']}")
        logger.info(f"Success rate: {((self.stats['total_requests'] - self.stats['failed_requests']) / self.stats['total_requests'] * 100):.2f}%")
        logger.info(f"Data saved to: {DATA_DIR}")
        logger.info(f"Master index saved to: {INDEX_FILE}")
        logger.info(f"Logs saved to: {LOG_FILE}")
        logger.info(f"Error log saved to: {ERROR_LOG_FILE}")


def main():
    """Main entry point"""
    try:
        collector = GECDataCollector()
        collector.collect_all_data()
        
    except KeyboardInterrupt:
        logger.warning("\nCollection interrupted by user")
        collector.master_index.save(INDEX_FILE)
        logger.info(f"Partial master index saved to: {INDEX_FILE}")
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
