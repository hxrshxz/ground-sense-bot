# 🚀 QUICK START GUIDE

## Run Data Collection NOW

```bash
cd /home/hxrshxz/Desktop/Projects/sih/Data
./run_collector.sh
```

That's it! The script will:

- Fetch all states, districts, and blocks across India
- Save JSON files to `data/` directory
- Create master index at `master_index.json`
- Log everything to `collection.log` and `errors.log`

---

## Watch Progress

Open a new terminal:

```bash
# Watch collection progress
tail -f /home/hxrshxz/Desktop/Projects/sih/Data/collection.log

# Watch errors (if any)
tail -f /home/hxrshxz/Desktop/Projects/sih/Data/errors.log
```

---

## Stop/Resume Collection

- **Stop**: Press `Ctrl+C` (progress will be saved)
- **Resume**: Just run `./run_collector.sh` again

---

## Check Results

```bash
# Count collected JSON files
find data/ -name "*.json" | wc -l

# View master index
cat master_index.json | python3 -m json.tool | less

# Check a sample file
cat data/INDIA.json | python3 -m json.tool | less
```

---

## Expected Duration

⏱️ **2-4 hours** for complete India collection

- ~37 states
- ~700 districts
- ~6,000 blocks

---

## After Collection Completes

You'll have:

- ✅ All groundwater data in JSON format
- ✅ Master index with all UUIDs and relationships
- ✅ Complete activity logs
- ✅ Ready for Phase B (PostgreSQL loading)

---

## Troubleshooting

| Issue                | Solution                                     |
| -------------------- | -------------------------------------------- |
| Permission denied    | `chmod +x run_collector.sh`                  |
| No module 'requests' | `./venv/bin/pip install -r requirements.txt` |
| Disk space           | Ensure at least 5GB free space               |
| API errors           | Check `errors.log` for details               |

---

## Files Created

```
Data/
├── collection.log          ← Activity log
├── errors.log             ← Error log (if any)
├── master_index.json      ← UUID index
└── data/
    ├── INDIA.json
    ├── <STATE>.json
    └── <STATE>/
        ├── <DISTRICT>.json
        └── <DISTRICT>/
            └── <BLOCK>.json
```

---

## Need Help?

Read full documentation:

```bash
cat README.md | less
cat PROJECT_SUMMARY.md | less
```
