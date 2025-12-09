# 🚀 INGRES Data Ingestion CI/CD Pipeline

Automated pipeline for fetching, processing, and loading groundwater assessment data from INGRES API into PostgreSQL database.

## 📋 Overview

This CI/CD pipeline automates the entire data ingestion workflow:

1. **Fetch Data** → Downloads assessment data from INGRES API for all states, districts, and blocks
2. **Store as JSON** → Saves raw data in structured JSON format with master index
3. **Load to Database** → Processes JSON files and loads into PostgreSQL tables
4. **Generate Embeddings** → Creates RAG embeddings for semantic search (optional)
5. **Notify** → Generates reports and notifications

## 🎯 Workflow Triggers

### 1. Manual Dispatch (Recommended for New Years)

```yaml
Trigger: GitHub Actions → Actions tab → "INGRES Data Ingestion Pipeline" → Run workflow
Inputs:
  - year: "2025-2026" (or any year you want to collect)
  - force_full_refresh: true/false (regenerate embeddings)
```

### 2. Scheduled Run

```yaml
Runs automatically: 1st of every month at 2:00 AM UTC
Purpose: Refresh data with latest updates
```

### 3. Push Trigger

```yaml
Triggers on changes to:
  - Data/ingres_gec_data_collector.py
  - load_data.py
  - .github/workflows/data-ingestion-pipeline.yml
```

## 🏗️ Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INGRES Data Pipeline                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Job 1: FETCH    │
│  📡 INGRES API   │
│                  │
│  • Fetch states  │
│  • Fetch dist... │
│  • Fetch blocks  │
│  • Store JSON    │
│  • Create index  │
└────────┬─────────┘
         │ artifacts
         ▼
┌──────────────────┐
│  Job 2: LOAD     │
│  🗄️ PostgreSQL   │
│                  │
│  • Setup DB      │
│  • Load states   │
│  • Load dist...  │
│  • Load blocks   │
│  • Load assess.. │
│  • Verify data   │
│  • Create backup │
└────────┬─────────┘
         │ backup
         ▼
┌──────────────────┐
│  Job 3: EMBED    │
│  🧠 RAG/Gemini   │
│                  │
│  • Restore DB    │
│  • Generate vec..│
│  • Store embed.. │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Job 4: NOTIFY   │
│  📢 Reports      │
│                  │
│  • Collect logs  │
│  • Gen. summary  │
│  • Create issue  │
└──────────────────┘
```

## 📦 Job Breakdown

### Job 1: Fetch INGRES Data 📡

**Purpose:** Download raw assessment data from INGRES API

**Steps:**

1. Checkout repository
2. Setup Python 3.11 environment
3. Install dependencies (`requests`, `urllib3`)
4. Run `ingres_gec_data_collector.py`
5. Generate master index file
6. Upload artifacts (JSON files + index)

**Outputs:**

- `Data/data/{year}/**/*.json` - Raw assessment data
- `Data/master_index.json` - State/District/Block hierarchy

**Artifacts:**

- `ingres-raw-data-{year}` (30 days retention)
- `data-collection-report` (90 days retention)

---

### Job 2: Load to PostgreSQL 🗄️

**Purpose:** Process JSON data and load into database

**Services:**

- PostgreSQL 15 container (port 5433)

**Steps:**

1. Setup PostgreSQL service
2. Download raw data artifacts
3. Create database schema
4. Run `load_data.py` to process and insert data
5. Verify data integrity
6. Generate statistics
7. Create database backup

**Database Tables:**

- `states` - State entities
- `districts` - District entities (linked to states)
- `blocks` - Block entities (linked to districts)
- `assessments_summary` - Main assessment data
- `assessments_recharge_breakdown` - Recharge source details
- `assessments_extraction_breakdown` - Extraction source details
- `assessments_discharge_breakdown` - Discharge details

**Outputs:**

- Populated PostgreSQL database
- Database backup (.dump file)

**Artifacts:**

- `database-load-statistics` (90 days)
- `database-backup-{year}` (90 days)

---

### Job 3: Generate RAG Embeddings 🧠

**Purpose:** Create vector embeddings for semantic search

**Trigger:** Only runs if:

- `force_full_refresh == true`, OR
- Scheduled run (monthly)

**Steps:**

1. Download database backup
2. Restore to PostgreSQL
3. Run `ingest_rag_data.py`
4. Generate embeddings using Gemini API
5. Store in `assessment_embeddings` table

**Requirements:**

- `GEMINI_API_KEY` secret must be set

**Artifacts:**

- `embedding-statistics` (90 days)

---

### Job 4: Notify & Cleanup 📢

**Purpose:** Generate reports and notify stakeholders

**Steps:**

1. Download all previous artifacts
2. Combine reports into final summary
3. Create GitHub issue with results (if manual trigger)

**Artifacts:**

- `pipeline-final-summary` (365 days retention)

## 🔐 Required Secrets

Set these in GitHub repository settings → Secrets and variables → Actions:

| Secret Name      | Description                          | Required       |
| ---------------- | ------------------------------------ | -------------- |
| `GEMINI_API_KEY` | Google Gemini API key for embeddings | Only for Job 3 |

## 📊 Data Structure

### Directory Structure After Collection

```
Data/
├── data/
│   ├── 2024-2025/
│   │   ├── PUNJAB/
│   │   │   ├── LUDHIANA/
│   │   │   │   ├── BLOCK_1.json
│   │   │   │   └── BLOCK_2.json
│   │   │   └── AMRITSAR/
│   │   └── HARYANA/
│   ├── 2025-2026/  ← New year data
│   │   └── ...
├── master_index.json
└── collection.log
```

### Master Index Format

```json
{
  "states": {
    "uuid-1": {
      "name": "PUNJAB",
      "parent_country_uuid": "india-uuid"
    }
  },
  "districts": {
    "uuid-2": {
      "name": "LUDHIANA",
      "parent_state_uuid": "uuid-1"
    }
  },
  "blocks": {
    "uuid-3": {
      "name": "BLOCK_NAME",
      "parent_district_uuid": "uuid-2"
    }
  }
}
```

## 🚀 Usage Instructions

### For New Year Data (e.g., 2025-2026)

1. **Update Collector Script** (if needed):

   ```bash
   # Edit Data/ingres_gec_data_collector.py
   # Add 2025-2026 to YEARS list if not automatic
   ```

2. **Trigger Pipeline Manually**:

   - Go to GitHub Actions
   - Select "INGRES Data Ingestion Pipeline"
   - Click "Run workflow"
   - Enter year: `2025-2026`
   - Check `force_full_refresh` if you want new embeddings
   - Click "Run workflow"

3. **Monitor Progress**:

   - Check workflow logs in real-time
   - Review artifacts after completion

4. **Verify Results**:
   - Download `pipeline-final-summary` artifact
   - Check database statistics
   - Review any error logs

### For Data Refresh (Existing Year)

1. **Automatic** (Monthly):

   - Pipeline runs automatically on the 1st
   - Updates existing year data

2. **Manual**:
   - Run workflow with existing year
   - Set `force_full_refresh: false`

## 📝 Environment Variables

Pipeline uses these environment variables:

| Variable            | Default            | Description             |
| ------------------- | ------------------ | ----------------------- |
| `DATA_YEAR`         | `2024-2025`        | Year to collect/process |
| `POSTGRES_HOST`     | `localhost`        | Database host           |
| `POSTGRES_PORT`     | `5433`             | Database port           |
| `POSTGRES_DB`       | `ground_sense_bot` | Database name           |
| `POSTGRES_USER`     | `admin`            | Database user           |
| `POSTGRES_PASSWORD` | `admin`            | Database password       |

## 🐛 Troubleshooting

### Pipeline Fails at Job 1 (Fetch)

**Symptoms:** API rate limiting, connection errors

**Solutions:**

- Check INGRES API availability
- Review `collection.log` artifact
- Retry workflow after delay

### Pipeline Fails at Job 2 (Load)

**Symptoms:** Database connection errors, data parsing errors

**Solutions:**

- Verify PostgreSQL service started successfully
- Check data format in JSON files
- Review database schema migrations

### Pipeline Fails at Job 3 (Embeddings)

**Symptoms:** Gemini API errors, missing secret

**Solutions:**

- Verify `GEMINI_API_KEY` secret is set
- Check API quota/rate limits
- Review embedding generation logs

### No Data for Specific State/District

**Possible Causes:**

- Data not available in INGRES for that year
- API endpoint changed
- Network issues during collection

**Check:**

1. Review `data-collection-report` artifact
2. Check `errors.log` in artifacts
3. Verify INGRES API manually

## 📈 Performance

### Typical Run Times

| Job                 | Duration   | Notes                         |
| ------------------- | ---------- | ----------------------------- |
| Fetch Data          | 2-4 hours  | Depends on API response time  |
| Load Database       | 5-15 mins  | Depends on data volume        |
| Generate Embeddings | 30-60 mins | Only when force_full_refresh  |
| Total               | ~3-5 hours | Full pipeline with embeddings |

### Data Volume

| Entity             | Approximate Count     |
| ------------------ | --------------------- |
| States             | 38                    |
| Districts          | 800+                  |
| Blocks             | 6,750+                |
| Assessment Records | 21,000+ (total, 6 years) |

## 🔄 Maintenance

### Monthly Tasks

- ✅ Automatic (scheduled run handles it)

### Yearly Tasks

1. Add new year to collection script
2. Run manual pipeline with new year
3. Verify data quality
4. Update frontend to show new year

### As Needed

- Monitor artifact storage (cleanup old artifacts)
- Review and optimize SQL queries
- Update API endpoints if changed

## 📚 Related Files

| File                                            | Purpose                  |
| ----------------------------------------------- | ------------------------ |
| `.github/workflows/data-ingestion-pipeline.yml` | Main CI/CD workflow      |
| `Data/ingres_gec_data_collector.py`             | API data fetching script |
| `load_data.py`                                  | Database loading script  |
| `Data/ingest_rag_data.py`                       | RAG embedding generation |
| `backend/migrations/001_create_tables.sql`      | Database schema          |

## 🎓 Best Practices

1. **Always use manual trigger for new years** - Don't rely on scheduled runs for new data
2. **Review artifacts after each run** - Check for errors or incomplete data
3. **Keep database backups** - Artifacts are retained for 90 days
4. **Monitor API rate limits** - INGRES may have usage restrictions
5. **Test in dev first** - Run pipeline in test environment before production

## 🤝 Contributing

To modify the pipeline:

1. Edit workflow file: `.github/workflows/data-ingestion-pipeline.yml`
2. Update scripts in `Data/` directory
3. Test locally before pushing
4. Pipeline will trigger on push to main branch

## 📞 Support

For issues:

1. Check workflow logs in GitHub Actions
2. Review artifact reports
3. Check error logs in artifacts
4. Create GitHub issue with logs attached

---

**Last Updated:** December 8, 2025
**Version:** 1.0.0
**Maintained by:** Mercury Team
