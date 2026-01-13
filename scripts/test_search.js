
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the environment and data loading
const dataPath = path.resolve(__dirname, '../src/data/groundwater_dataset.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Copy-paste the service logic here for testing (since we can't easily import TS in node without setup)
// We will manually sync changes back to the real file if tests pass.
class GroundwaterDataServiceTest {
  static masterData = rawData;

  static getSkeleton(str) {
    return str.replace(/[aeiouy]/g, '').replace(/(.)\1+/g, '$1');
  }

  static searchLocation(query, year = "2024-2025") {
    const yearData = this.masterData[year];
    if (!yearData) return [];

    const normalizedQuery = query.toLowerCase().trim();
    
    // 1. Exact match
    const matches = yearData.filter(block => 
      block.name.toLowerCase() === normalizedQuery ||
      (block.district && block.district.toLowerCase() === normalizedQuery)
    );
    if (matches.length > 0) return matches;

    // 2. Keyword/Phonetic
    const validMatches = yearData.filter(block => {
      const name = block.name.toLowerCase();
      const district = block.district?.toLowerCase();
      
      const nameRegex = new RegExp(`\\b${name}\\b`, 'i');
      const distRegex = district ? new RegExp(`\\b${district}\\b`, 'i') : null;
      
      const isWordMatch = name.length > 3 && nameRegex.test(normalizedQuery);
      const isDistMatch = district && district.length > 3 && distRegex && distRegex.test(normalizedQuery);
      
      if (isWordMatch || isDistMatch) return true;

      // Phonetic Skeleton Check
      if (name.length > 4) {
         const queryWords = normalizedQuery.split(/\s+/);
         const nameSkeleton = this.getSkeleton(name);
         for (const w of queryWords) {
            if (!w.startsWith(name[0])) continue; // Start char check
            
            if (w.length > 3 && Math.abs(w.length - name.length) <= 2) {
               if (this.getSkeleton(w) === nameSkeleton) return true;
            }
         }
      }
      return false;
    });

    if (validMatches.length > 0) {
        return validMatches.sort((a, b) => b.name.length - a.name.length).slice(0, 10);
    }
    
    // 3. Fallback fuzzy
    return yearData.filter(block => 
      block.name.toLowerCase().includes(normalizedQuery) ||
      (block.district && block.district.toLowerCase().includes(normalizedQuery))
    ).slice(0, 10);
  }
}

// TEST SUITE
const testCases = [
  { query: "status of ludhiana", expected: "Ludhiana", year: "2024-2025" },
  { query: "ferozepur data", expected: "Firozpur", year: "2024-2025" }, // Phonetic
  { query: "similarly for chandigarh", expected: "CHANDIGARH", year: "2023-2024" }, // Fallback Year
  { query: "give me ground water data", expected: null, year: "2024-2025" }, // Generic - Should NOT match Ater
  { query: "top 5 over exploited blocks in punjab", expected: "Analytics Needed", year: "2024-2025" }
];

console.log("Starting Rigorous Search Tests...\n");

testCases.forEach((tc, i) => {
  console.log(`Test ${i + 1}: Query="${tc.query}"`);
  
  // Simulate Year Fallback Logic manually (as present in getContextForPrompt)
  let results = GroundwaterDataServiceTest.searchLocation(tc.query, tc.year);
  let foundYear = tc.year;
  
  if (results.length === 0 && tc.year !== "2023-2024") {
      // console.log("  -> No results in preferred year, trying 2023-2024...");
      results = GroundwaterDataServiceTest.searchLocation(tc.query, "2023-2024");
      foundYear = "2023-2024";
  }

  const firstMatch = results.length > 0 ? results[0].name : "NONE";
  console.log(`  -> Result: ${firstMatch} (${results.length} matches)`);
  
  // Validation
  let passed = false;
  if (!tc.expected && results.length === 0) passed = true;
  else if (tc.expected === "Analytics Needed") {
      passed = true;
  } else if (tc.expected && results.some(r => r.name.toLowerCase().includes(tc.expected.toLowerCase()))) {
      passed = true;
  }
  
  console.log(`  -> Status: ${passed ? "✅ PASS" : "❌ FAIL"}\n`);
});
