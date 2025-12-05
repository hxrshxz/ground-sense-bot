# InGRES GEC Data Collector

Automated Python script to fetch and store groundwater assessment data from the InGRES GEC API for all states, districts, and blocks in India.

## Overview

This tool systematically collects data from the InGRES (Integrated National Geophysical Research portal) GEC (Groundwater Estimation Committee) API by traversing the complete administrative hierarchy of India.

## Features

✅ **Hierarchical Data Collection**: Automatically traverses STATE → DISTRICT → BLOCK hierarchy  
✅ **Retry Logic**: Built-in retry mechanism with exponential backoff  
✅ **Error Handling**: Comprehensive error logging and recovery  
✅ **Progress Tracking**: Real-time logging of collection progress  
✅ **Master Index**: Generates hierarchical index mapping UUIDs to location names  
✅ **Raw Data Storage**: Saves untouched JSON responses from API  
✅ **Rate Limiting**: Respects API with configurable delays

## Requirements

- Python 3.7+
- requests==2.31.0
- urllib3==2.1.0

## Installation

```bash
# Navigate to project directory
cd /home/hxrshxz/Desktop/Projects/sih/Data

# Create virtual environment (if not already created)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Usage

### Quick Start

```bash
# Using the run script
chmod +x run_collector.sh
./run_collector.sh
```

### Manual Execution

```bash
# Activate virtual environment
source venv/bin/activate

# Run the collector
python3 ingres_gec_data_collector.py
```

## Output Structure

### Directory Structure

```
data/
├── INDIA.json                          # Root level data
├── <STATE_NAME>/
│   ├── <STATE_NAME>.json               # State level data
│   ├── <DISTRICT_NAME>.json            # District level data
│   └── <DISTRICT_NAME>/
│       └── <BLOCK_NAME>.json           # Block level data (full dataset)
```

### Master Index

The script generates `master_index.json` with the following structure:

```json
{
  "states": {
    "uuid": {
      "name": "STATE_NAME",
      "uuid": "state_uuid"
    }
  },
  "districts": {
    "uuid": {
      "name": "DISTRICT_NAME",
      "uuid": "district_uuid",
      "parent_state_uuid": "state_uuid"
    }
  },
  "blocks": {
    "uuid": {
      "name": "BLOCK_NAME",
      "uuid": "block_uuid",
      "parent_district_uuid": "district_uuid"
    }
  },
  "metadata": {
    "total_states": 36,
    "total_districts": 700,
    "total_blocks": 6000,
    "collection_timestamp": "2025-12-03 12:00:00"
  }
}
```

## Logs

- **collection.log**: Main activity log with progress updates
- **errors.log**: Dedicated error log for failed requests

## API Endpoint

All requests use the single endpoint:

```
POST https://ingres.iith.ac.in/api/gec/getBusinessDataForUserOpen
```

## Configuration

You can modify the following constants in `ingres_gec_data_collector.py`:

- `BASE_URL`: API endpoint (do not change)
- `DATA_DIR`: Output directory for JSON files
- `INDEX_FILE`: Path to master index file
- `LOG_FILE`: Path to main log file
- `ERROR_LOG_FILE`: Path to error log file

### Rate Limiting

Adjust delays in the `collect_all_data()` method:

- Block delay: `time.sleep(0.5)` (between blocks)
- District delay: `time.sleep(1)` (between districts)
- State delay: `time.sleep(2)` (between states)

## How It Works

1. **Fetch States**: Query India root to get all states
2. **Fetch Districts**: For each state, query to get districts
3. **Fetch Blocks**: For each district, query to get blocks
4. **Fetch Block Data**: For each block, fetch complete dataset
5. **Save Data**: Store each response as JSON in appropriate directory
6. **Build Index**: Maintain master index of all locations and relationships

## Error Handling

- **Automatic Retries**: Up to 5 retries with exponential backoff
- **Timeout Protection**: 30-second timeout per request
- **Error Logging**: All failures logged to `errors.log`
- **Graceful Interruption**: Saves partial index on Ctrl+C

## Statistics

The script tracks and reports:

- Total states processed
- Total districts processed
- Total blocks processed
- Total API requests made
- Failed requests count
- Success rate percentage
- Execution time

## Next Steps (Phase B)

After collecting all JSON data:

1. Parse and normalize JSON data
2. Design PostgreSQL schema
3. Create data transformation pipeline
4. Load data into PostgreSQL database

## Troubleshooting

### Connection Issues

- Check internet connectivity
- Verify API endpoint is accessible
- Review error logs for specific failures

### Rate Limiting

- Increase delays if experiencing 429 errors
- Monitor API response times

### Storage Issues

- Ensure sufficient disk space
- Check directory permissions

## License

This tool is for research and educational purposes. Respect the InGRES API terms of service.

## Support

For issues or questions, check logs at:

- `collection.log` for activity
- `errors.log` for failures
