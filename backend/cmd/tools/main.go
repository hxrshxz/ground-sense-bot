// Package main provides CLI tools for ground-sense-bot data operations.
// This replaces the Python scripts with Go for lower latency.
//
// Usage:
//
//	tools <command> [flags]
//
// Commands:
//
//	load-data      Load data from JSON files into PostgreSQL
//	load-markdown  Load data from markdown files
package main

import (
	"flag"
	"fmt"
	"os"
)

const version = "1.0.0"

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "load-data":
		runLoadData(os.Args[2:])
	case "load-markdown":
		runLoadMarkdown(os.Args[2:])
	case "version", "--version", "-v":
		fmt.Printf("ground-sense-bot tools v%s\n", version)
	case "help", "--help", "-h":
		printUsage()
	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\n\n", command)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println(`Ground Sense Bot Tools - Go CLI for data operations

Usage:
  tools <command> [flags]

Commands:
  load-data       Load data from JSON files into PostgreSQL
  load-markdown   Load data from markdown files

Global Flags:
  --help, -h      Show help for a command
  --version, -v   Show version information

Examples:
  tools load-data --data-dir ../Data/data --index ../Data/master_index.json
  tools load-markdown --file ../Data/2024-2025.md --year 2024-2025

Environment Variables:
  POSTGRES_HOST      Database host (default: localhost)
  POSTGRES_PORT      Database port (default: 5433)
  POSTGRES_DB        Database name (default: ground_sense_bot)
  POSTGRES_USER      Database user (default: admin)
  POSTGRES_PASSWORD  Database password (default: admin)`)
}

// Common database configuration
type DBConfig struct {
	Host     string
	Port     string
	Database string
	User     string
	Password string
}

func getDBConfig() DBConfig {
	return DBConfig{
		Host:     getEnv("POSTGRES_HOST", "localhost"),
		Port:     getEnv("POSTGRES_PORT", "5433"),
		Database: getEnv("POSTGRES_DB", "ground_sense_bot"),
		User:     getEnv("POSTGRES_USER", "admin"),
		Password: getEnv("POSTGRES_PASSWORD", "admin"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func runLoadData(args []string) {
	fs := flag.NewFlagSet("load-data", flag.ExitOnError)
	dataDir := fs.String("data-dir", "Data/data", "Path to data directory")
	indexFile := fs.String("index", "Data/master_index.json", "Path to master index file")
	fs.Parse(args)

	fmt.Println("🚀 Starting data loading...")
	loadData(*dataDir, *indexFile)
}

func runLoadMarkdown(args []string) {
	fs := flag.NewFlagSet("load-markdown", flag.ExitOnError)
	file := fs.String("file", "", "Markdown file to load (or 'all' for both 2023-2024 and 2024-2025)")
	year := fs.String("year", "", "Year for the data (e.g., 2024-2025)")
	dataDir := fs.String("data-dir", "Data", "Data directory containing markdown files")
	fs.Parse(args)

	fmt.Println("🚀 Starting markdown loading...")

	if *file == "all" || *file == "" {
		// Load both markdown files
		loadMarkdown(*dataDir+"/2023-2024.md", "2023-2024")
		loadMarkdown(*dataDir+"/2024-2025.md", "2024-2025")
	} else {
		if *year == "" {
			fmt.Fprintln(os.Stderr, "Error: --year is required when specifying a file")
			fs.Usage()
			os.Exit(1)
		}
		loadMarkdown(*file, *year)
	}
}
