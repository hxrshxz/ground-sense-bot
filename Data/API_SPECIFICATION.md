# InGRES GEC API Technical Specification

## API Endpoint

```
POST https://ingres.iith.ac.in/api/gec/getBusinessDataForUserOpen
```

## Request Structure

### Headers

```http
Accept: application/json, text/plain, */*
Accept-Language: en-US,en;q=0.9
Connection: keep-alive
Content-Type: application/json
Origin: https://ingres.iith.ac.in
Referer: https://ingres.iith.ac.in/gecdataonline/
```

### Payload Structure

The API uses a single endpoint with varying payload parameters based on hierarchy level:

```json
{
  "parentLocName": "INDIA",
  "locname": "<LOCATION_NAME>",
  "loctype": "<COUNTRY|STATE|DISTRICT|BLOCK>",
  "view": "admin",
  "locuuid": "<LOCATION_UUID>",
  "year": "2024-2025",
  "computationType": "normal",
  "component": "recharge",
  "period": "annual",
  "category": "safe",
  "mapOnClickParams": "true",
  "stateuuid": null,
  "verificationStatus": 1,
  "approvalLevel": 1,
  "parentuuid": "<PARENT_UUID>"
}
```

### Hierarchy Levels

| Level | loctype  | Purpose                                     |
| ----- | -------- | ------------------------------------------- |
| 0     | COUNTRY  | Root (INDIA) - returns states               |
| 1     | STATE    | State level - returns districts             |
| 2     | DISTRICT | District level - returns blocks             |
| 3     | BLOCK    | Block level - returns full groundwater data |

## Response Structure

### Top-Level Format

The API returns an array of location objects:

```json
[
  {
    "locationName": "STRING",
    "locationUUID": "UUID",
    "area": {...},
    "loss": {...},
    "category": "STRING|null",
    "reportSummary": {...},
    "recharge": {...},
    "discharge": {...},
    "utilizableGroundWater": {...},
    "actualGroundWaterDraft": {...},
    "netGroundWaterAvailability": {...},
    "stageGroundWaterExtraction": {...},
    "waterLevel": {...},
    "spatialdata": {...}
  }
]
```

### Key Fields

#### Location Information

- `locationName`: Name of the location (state/district/block)
- `locationUUID`: Unique identifier for the location
- (Note: Some responses use `locname` and `locuuid` variations)

#### Area Metrics (`area`)

```json
{
  "non_recharge_worthy": {
    "commandArea": FLOAT,
    "nonCommandArea": FLOAT,
    "poorQualityArea": FLOAT,
    "hillyArea": FLOAT,
    "forestArea": FLOAT,
    "totalArea": FLOAT,
    "pavedArea": FLOAT,
    "unpavedArea": FLOAT
  },
  "total": {...},
  "recharge_worthy": {...}
}
```

#### Loss Metrics (`loss`)

```json
{
  "poor_quality": FLOAT,
  "total": FLOAT,
  "non_command": FLOAT,
  "command": FLOAT
}
```

#### Report Summary (`reportSummary`)

Nested structure with district/block UUIDs as keys:

```json
{
  "UUID": {
    "BLOCK": {
      "over_exploited": INT,
      "critical": INT,
      "semi_critical": INT,
      "safe": INT
    }
  }
}
```

#### Recharge Data (`recharge`)

```json
{
  "monsoon": FLOAT,
  "post_monsoon": FLOAT,
  "total": FLOAT,
  "from_rainfall": {...},
  "from_other_sources": {...}
}
```

#### Discharge Data (`discharge`)

```json
{
  "monsoon": {
    "irrigation": FLOAT,
    "domestic_industrial": FLOAT,
    "total": FLOAT
  },
  "non_monsoon": {...},
  "total": {...}
}
```

#### Water Availability Metrics

- `utilizableGroundWater`: Available groundwater resources
- `actualGroundWaterDraft`: Current extraction rates
- `netGroundWaterAvailability`: Net available after draft
- `stageGroundWaterExtraction`: Extraction stage percentage

#### Water Level Data (`waterLevel`)

```json
{
  "data": {
    "pre_monsoon": [...],
    "post_monsoon": [...]
  }
}
```

#### Spatial Data (`spatialdata`)

```json
{
  "centroids": "GEOMETRYCOLLECTION(...)",
  "geometries": "MULTIPOLYGON(...)"
}
```

## UUID Relationships

### India Root

- UUID: `ffce954d-24e1-494b-ba7e-0931d8ad6085`
- Name: `INDIA`
- Type: `COUNTRY`

### Hierarchy Structure

```
INDIA (UUID: ffce954d...)
├── STATE_1 (UUID: state_uuid_1, parentuuid: ffce954d...)
│   ├── DISTRICT_1 (UUID: dist_uuid_1, parent: state_uuid_1)
│   │   ├── BLOCK_1 (UUID: block_uuid_1, parent: dist_uuid_1)
│   │   └── BLOCK_2 (UUID: block_uuid_2, parent: dist_uuid_1)
│   └── DISTRICT_2 (UUID: dist_uuid_2, parent: state_uuid_1)
│       ├── BLOCK_3 (UUID: block_uuid_3, parent: dist_uuid_2)
│       └── BLOCK_4 (UUID: block_uuid_4, parent: dist_uuid_2)
└── STATE_2 (UUID: state_uuid_2, parentuuid: ffce954d...)
    └── ...
```

## Data Collection Strategy

### Algorithm

```
1. Query INDIA → Extract states (locationName + locationUUID)
2. For each STATE:
   a. Query with STATE loctype → Extract districts
   b. For each DISTRICT:
      i. Query with DISTRICT loctype → Extract blocks
      ii. For each BLOCK:
          - Query with BLOCK loctype → Get full dataset
          - Save complete JSON response
```

### UUID Extraction Pattern

From API responses, extract child locations:

```python
for item in response_json:
    child_name = item.get('locationName') or item.get('locname')
    child_uuid = item.get('locationUUID') or item.get('locuuid')
```

## Field Type Reference

| Field Category  | Type           | Example                                |
| --------------- | -------------- | -------------------------------------- |
| locationName    | String         | "MADHYA PRADESH"                       |
| locationUUID    | UUID String    | "f38e6de8-396e-47b4-af18-32c333eddccc" |
| area.\*         | Float          | 30823788.0                             |
| loss.\*         | Float          | 191729.38                              |
| category        | String/Null    | "safe" or null                         |
| recharge.\*     | Float          | 2500.5                                 |
| discharge.\*    | Float          | 1800.3                                 |
| waterLevel.data | Array          | [[lat, lon, depth], ...]               |
| spatialdata.\*  | GeoJSON String | "MULTIPOLYGON(...)"                    |

## API Behavior Notes

### Rate Limiting

- No documented rate limits observed
- Recommended delays:
  - 0.5s between blocks
  - 1s between districts
  - 2s between states

### Error Responses

- Returns empty array `[]` if no child locations
- May return null for missing data fields
- Network errors: Standard HTTP error codes

### Data Completeness

- Not all blocks may have complete data
- Some fields may be null or 0
- Spatial data may be missing for some locations

## Example Requests

### Get All States

```bash
curl -X POST 'https://ingres.iith.ac.in/api/gec/getBusinessDataForUserOpen' \
  -H 'Content-Type: application/json' \
  -d '{
    "parentLocName": "",
    "locname": "INDIA",
    "loctype": "COUNTRY",
    "view": "admin",
    "locuuid": "ffce954d-24e1-494b-ba7e-0931d8ad6085",
    "parentuuid": ""
  }'
```

### Get Districts in a State

```bash
curl -X POST 'https://ingres.iith.ac.in/api/gec/getBusinessDataForUserOpen' \
  -H 'Content-Type: application/json' \
  -d '{
    "parentLocName": "INDIA",
    "locname": "MADHYA PRADESH",
    "loctype": "STATE",
    "view": "admin",
    "locuuid": "f38e6de8-396e-47b4-af18-32c333eddccc",
    "parentuuid": "ffce954d-24e1-494b-ba7e-0931d8ad6085"
  }'
```

### Get Blocks in a District

```bash
curl -X POST 'https://ingres.iith.ac.in/api/gec/getBusinessDataForUserOpen' \
  -H 'Content-Type: application/json' \
  -d '{
    "parentLocName": "INDIA",
    "locname": "AGAR MALWA",
    "loctype": "DISTRICT",
    "view": "admin",
    "locuuid": "6200386e-6421-4496-96f6-3b70745ef6fe"
  }'
```

### Get Block Data

```bash
curl -X POST 'https://ingres.iith.ac.in/api/gec/getBusinessDataForUserOpen' \
  -H 'Content-Type: application/json' \
  -d '{
    "parentLocName": "INDIA",
    "locname": "BADOD",
    "loctype": "BLOCK",
    "view": "admin",
    "locuuid": "116cdf9a-d7de-4352-9188-daa431eae8dd"
  }'
```

## Phase B: PostgreSQL Schema Design Recommendations

### Tables Structure

#### 1. locations

```sql
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- COUNTRY, STATE, DISTRICT, BLOCK
    parent_uuid UUID REFERENCES locations(uuid),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. area_metrics

```sql
CREATE TABLE area_metrics (
    id SERIAL PRIMARY KEY,
    location_uuid UUID REFERENCES locations(uuid),
    category VARCHAR(50), -- recharge_worthy, non_recharge_worthy, total
    command_area FLOAT,
    non_command_area FLOAT,
    poor_quality_area FLOAT,
    hilly_area FLOAT,
    forest_area FLOAT,
    total_area FLOAT,
    paved_area FLOAT,
    unpaved_area FLOAT
);
```

#### 3. recharge_data

```sql
CREATE TABLE recharge_data (
    id SERIAL PRIMARY KEY,
    location_uuid UUID REFERENCES locations(uuid),
    monsoon FLOAT,
    post_monsoon FLOAT,
    total FLOAT,
    from_rainfall JSONB,
    from_other_sources JSONB
);
```

#### 4. discharge_data

```sql
CREATE TABLE discharge_data (
    id SERIAL PRIMARY KEY,
    location_uuid UUID REFERENCES locations(uuid),
    period VARCHAR(50), -- monsoon, non_monsoon, total
    irrigation FLOAT,
    domestic_industrial FLOAT,
    total FLOAT
);
```

#### 5. water_level_measurements

```sql
CREATE TABLE water_level_measurements (
    id SERIAL PRIMARY KEY,
    location_uuid UUID REFERENCES locations(uuid),
    season VARCHAR(50), -- pre_monsoon, post_monsoon
    latitude FLOAT,
    longitude FLOAT,
    depth FLOAT,
    measurement_date DATE
);
```

#### 6. spatial_data

```sql
CREATE TABLE spatial_data (
    id SERIAL PRIMARY KEY,
    location_uuid UUID REFERENCES locations(uuid),
    centroids GEOMETRY(POINT),
    geometries GEOMETRY(MULTIPOLYGON)
);
```

### Indexes

```sql
CREATE INDEX idx_locations_uuid ON locations(uuid);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_parent ON locations(parent_uuid);
CREATE INDEX idx_area_metrics_location ON area_metrics(location_uuid);
CREATE INDEX idx_recharge_location ON recharge_data(location_uuid);
CREATE INDEX idx_discharge_location ON discharge_data(location_uuid);
CREATE INDEX idx_water_level_location ON water_level_measurements(location_uuid);
CREATE INDEX idx_spatial_location ON spatial_data(location_uuid);
```

## ETL Pipeline Pseudocode

```python
def load_json_to_postgres():
    # 1. Load all JSON files
    for json_file in find_all_json_files():
        data = json.load(json_file)

        # 2. Extract location info
        location = extract_location(data)
        insert_location(location)

        # 3. Extract and insert area metrics
        if 'area' in data:
            insert_area_metrics(data['area'], location['uuid'])

        # 4. Extract and insert recharge data
        if 'recharge' in data:
            insert_recharge_data(data['recharge'], location['uuid'])

        # 5. Extract and insert discharge data
        if 'discharge' in data:
            insert_discharge_data(data['discharge'], location['uuid'])

        # 6. Extract and insert water level data
        if 'waterLevel' in data:
            insert_water_level_data(data['waterLevel'], location['uuid'])

        # 7. Extract and insert spatial data
        if 'spatialdata' in data:
            insert_spatial_data(data['spatialdata'], location['uuid'])
```

---

**Document Version**: 1.0  
**Last Updated**: December 3, 2025  
**API Version**: 2024-2025
