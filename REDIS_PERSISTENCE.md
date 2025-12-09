# 🔄 REDIS CACHING - HOW IT WORKS

## ✅ YES - Cache Survives Docker Restarts!

---

## 🎯 Quick Answer

**Q: If Docker is stopped and started again, will cache still work?**  
**A: YES! ✅** Redis data is **permanently stored on disk** in a Docker volume.

**Q: Do we need to turn on Docker for Redis to work?**  
**A: YES** - Redis runs inside Docker. Start with `docker-compose up -d redis`

**Q: What happens to cached data when Docker restarts?**  
**A: NOTHING** - All cached data persists and loads automatically on restart.

---

## 🏗️ How Redis Persistence Works

### Storage Location
```
Docker Volume: redis_data
Physical Location: /var/lib/docker/volumes/backend_redis_data/_data/
Files Stored:
  ├── appendonly.aof (Write-ahead log - all operations)
  └── dump.rdb (Snapshot backup)
```

### Persistence Mechanism

**AOF (Append Only File)** - Enabled in our setup
```yaml
command: redis-server --appendonly yes --appendfsync everysec
```

**What this means**:
- Every write operation (SET, DEL, etc.) is logged to disk
- Writes are flushed to disk **every second**
- On restart, Redis replays the log to restore all data
- **Zero data loss** (max 1 second in worst case)

---

## 🔄 Docker Lifecycle & Cache

### Scenario 1: Docker Stop & Start
```bash
# Stop Docker containers
docker-compose down

# ❓ What happens to Redis data?
# ✅ NOTHING - Data stays in redis_data volume

# Start Docker again
docker-compose up -d

# ❓ Is cache still there?
# ✅ YES - Redis loads appendonly.aof and restores ALL data
```

**Result**: Cache instantly available with all previous data intact.

---

### Scenario 2: System Reboot
```bash
# System reboots/shuts down
sudo reboot

# After reboot
docker-compose up -d

# ❓ Is cache still there?
# ✅ YES - Volume persists across reboots
```

**Result**: Cache survives system restarts.

---

### Scenario 3: Docker Container Removal
```bash
# Remove containers (but keep volumes)
docker-compose down

# Remove and recreate containers
docker-compose up -d --force-recreate

# ❓ Is cache still there?
# ✅ YES - Data in volume is untouched
```

**Result**: Cache persists even if container is recreated.

---

### Scenario 4: Volume Deletion (ONLY Way to Lose Cache)
```bash
# ⚠️ THIS DELETES CACHE
docker-compose down -v  # -v flag removes volumes

# OR manually
docker volume rm backend_redis_data

# ❓ Is cache still there?
# ❌ NO - Cache is permanently deleted
```

**Result**: Cache is gone. Need to rebuild from scratch.

---

## 🚀 How to Use Redis Caching

### 1. Start Redis (First Time)
```bash
cd backend
docker-compose up -d redis

# Check if running
docker ps | grep redis
# Should show: ground-sense-redis ... Up ... 6379/tcp
```

### 2. Verify Persistence Enabled
```bash
# Connect to Redis CLI
docker exec -it ground-sense-redis redis-cli

# Check AOF is enabled
CONFIG GET appendonly
# Should return: 1) "appendonly" 2) "yes"

# Check data directory
CONFIG GET dir
# Should return: 1) "dir" 2) "/data"

# Exit
exit
```

### 3. Start Backend (Connects to Redis)
```bash
cd backend
go run cmd/server/main.go

# Look for log:
# ✅ Redis connected successfully at localhost:6379
```

### 4. Test Caching
```bash
# First request - cache miss (slow)
curl -X POST http://localhost:8081/api/debug/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show critical blocks in Punjab", "username": "test"}'

# Backend logs should show:
# 🔄 CACHE MISS: Generating SQL with LLM...
# ✅ LLM Query CACHED PERMANENTLY

# Second request - cache hit (instant)
curl -X POST http://localhost:8081/api/debug/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show critical blocks in Punjab", "username": "test"}'

# Backend logs should show:
# ⚡ CACHE HIT: Using cached SQL (saved 5-10s LLM time!)
```

### 5. Stop Docker & Restart (Test Persistence)
```bash
# Stop everything
docker-compose down

# Start again
docker-compose up -d redis

# Run backend
go run cmd/server/main.go

# Make SAME request again
curl -X POST http://localhost:8081/api/debug/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show critical blocks in Punjab", "username": "test"}'

# Should STILL show cache hit:
# ⚡ CACHE HIT: Using cached SQL (saved 5-10s LLM time!)
```

**Proof**: Cache survived Docker restart! 🎉

---

## 📊 Redis Data Persistence Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER HOST MACHINE                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        Docker Volume (redis_data)                      │ │
│  │        Location: /var/lib/docker/volumes/              │ │
│  │                                                        │ │
│  │   ┌─────────────────────────────────────────────┐    │ │
│  │   │  appendonly.aof (Write-Ahead Log)           │    │ │
│  │   │  - Every SET command logged                 │    │ │
│  │   │  - Synced to disk every 1 second            │    │ │
│  │   │  - Replayed on Redis startup                │    │ │
│  │   └─────────────────────────────────────────────┘    │ │
│  │                                                        │ │
│  │   ┌─────────────────────────────────────────────┐    │ │
│  │   │  dump.rdb (Snapshot Backup)                 │    │ │
│  │   │  - Full database snapshot                   │    │ │
│  │   │  - Created periodically                     │    │ │
│  │   │  - Faster restore than AOF                  │    │ │
│  │   └─────────────────────────────────────────────┘    │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     Docker Container: ground-sense-redis              │ │
│  │                                                        │ │
│  │   Redis Server (Port 6379)                            │ │
│  │   - Loads data from /data on startup                  │ │
│  │   - Writes all operations to appendonly.aof           │ │
│  │   - Syncs to disk every second                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     Backend Application (Go)                          │ │
│  │                                                        │ │
│  │   cache_service.go                                    │ │
│  │   - Connects to localhost:6379                        │ │
│  │   - SET key value (no TTL = permanent)                │ │
│  │   - GET key (instant retrieval)                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Points

### ✅ What Persists
- All cached LLM queries (permanent, NO TTL)
- All cached database results
- All cached comparison/trend data
- Redis writes to disk every second

### ❌ What Doesn't Persist
- In-memory only if AOF is disabled (not our case)
- Data older than last successful disk sync (max 1 second loss)

### 🔒 Data Safety
- **AOF enabled**: ✅ (appendonly yes)
- **Sync frequency**: Every 1 second (appendfsync everysec)
- **Volume mount**: ✅ (redis_data:/data)
- **Restart policy**: ✅ (unless-stopped)

---

## 🧪 Testing Cache Persistence

### Step-by-Step Test

```bash
# 1. Start Redis
cd backend
docker-compose up -d redis

# 2. Add test data
docker exec -it ground-sense-redis redis-cli
SET test_key "Hello World"
SET llm:query:test "SELECT * FROM blocks"
GET test_key
# Should return: "Hello World"
exit

# 3. Stop Docker
docker-compose down

# 4. Start Docker again
docker-compose up -d redis

# 5. Check if data is still there
docker exec -it ground-sense-redis redis-cli
GET test_key
# Should STILL return: "Hello World" ✅
GET llm:query:test
# Should STILL return: "SELECT * FROM blocks" ✅
exit
```

**If data is still there = Persistence working! 🎉**

---

## 📈 Real-World Cache Growth

### Example: After 1 Week of Use

```bash
# Check number of cached queries
docker exec -it ground-sense-redis redis-cli
DBSIZE
# Example output: 1247 (1,247 unique queries cached)

# Check memory usage
INFO memory
# Example output:
# used_memory_human: 24.31M
# used_memory_peak_human: 25.12M

# Check persistence file size
docker exec -it ground-sense-redis ls -lh /data
# Example output:
# -rw-r--r-- 1 redis redis 12M Dec 9 10:30 appendonly.aof
# -rw-r--r-- 1 redis redis 8.2M Dec 9 09:00 dump.rdb
```

**Interpretation**:
- 1,247 queries cached permanently
- 24 MB RAM usage (tiny!)
- 12 MB disk usage (negligible)
- All queries instant on next request

---

## ⚠️ Important Notes

### 1. Always Use Volume Mount
```yaml
volumes:
  - redis_data:/data  # ✅ CRITICAL - enables persistence
```
Without this, data is stored **inside** container = lost on restart.

### 2. Enable AOF
```yaml
command: redis-server --appendonly yes --appendfsync everysec
```
Without this, only RDB snapshots = potential data loss.

### 3. Never Use `docker-compose down -v`
```bash
docker-compose down     # ✅ Safe - keeps volume
docker-compose down -v  # ❌ DANGER - deletes volume!
```

### 4. Backup Redis Data (Optional)
```bash
# Create backup
docker exec ground-sense-redis redis-cli BGSAVE

# Copy backup file
docker cp ground-sense-redis:/data/dump.rdb ./redis_backup.rdb

# Restore (if needed)
docker cp ./redis_backup.rdb ground-sense-redis:/data/dump.rdb
docker restart ground-sense-redis
```

---

## 🎤 For Judge Demo

**Say**:
> "Our Redis cache is **permanently persistent**. We use Docker volumes with AOF (Append Only File) logging. Every write is synced to disk every second. When Docker restarts, Redis automatically loads all cached data from disk. This means our LLM-generated queries are cached **forever** - the first user waits 5 seconds, but every user after that gets an instant response, even after system reboots."

**Demonstrate**:
1. Show first query taking 5 seconds
2. Show second query instant (<10ms)
3. Stop Docker: `docker-compose down`
4. Start Docker: `docker-compose up -d`
5. Show same query still instant (cache survived!)

---

## 📝 Summary

| Question | Answer |
|----------|--------|
| Does cache survive Docker restart? | ✅ YES |
| Does cache survive system reboot? | ✅ YES |
| Does cache survive container recreation? | ✅ YES |
| How long is data cached? | ♾️ FOREVER (no TTL) |
| Where is data stored? | Disk (Docker volume) |
| What persistence mechanism? | AOF + RDB snapshots |
| Max data loss on crash? | 1 second |
| Need special setup? | NO - already configured! |

---

**TL;DR**: 
- Redis runs in Docker with **permanent disk storage**
- Cache **survives all restarts** (Docker, system, container)
- Data stored in **redis_data volume** on host machine
- **Zero data loss** with AOF enabled
- **Just works** - no special action needed! ✅
