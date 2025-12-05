#!/bin/bash
# InGRES GEC Data Collector - Run Script

echo "=============================================="
echo "  InGRES GEC Data Collector"
echo "=============================================="
echo ""

# Navigate to script directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Creating virtual environment..."
    python3 -m venv venv
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
    
    echo "✅ Virtual environment created"
    echo "Installing dependencies..."
    ./venv/bin/pip install -r requirements.txt
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    
    echo "✅ Dependencies installed"
fi

# Activate virtual environment and run collector
echo ""
echo "Starting data collection..."
echo "Logs will be saved to collection.log"
echo "Press Ctrl+C to stop (progress will be saved)"
echo ""
echo "=============================================="
echo ""

./venv/bin/python ingres_gec_data_collector.py

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo "=============================================="
    echo "✅ Data collection completed successfully!"
    echo "=============================================="
    echo ""
    echo "Output locations:"
    echo "  📁 Data files: ./data/"
    echo "  📋 Master index: ./master_index.json"
    echo "  📝 Activity log: ./collection.log"
    echo "  ❌ Error log: ./errors.log"
    echo ""
else
    echo ""
    echo "=============================================="
    echo "❌ Data collection encountered errors"
    echo "=============================================="
    echo ""
    echo "Check logs for details:"
    echo "  📝 Activity log: ./collection.log"
    echo "  ❌ Error log: ./errors.log"
    echo ""
    exit 1
fi
