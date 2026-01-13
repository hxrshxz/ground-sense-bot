
import groundwaterData from '../data/groundwater_dataset.json';

export interface BlockData {
  name: string;
  state?: string;
  district?: string;
  extractable_ham: number;
  extraction_ham: number;
  stage: number;
  category: string;
  rainfall: number;
  year?: string;
}

export class GroundwaterDataService {
  private static masterData = groundwaterData as Record<string, BlockData[]>;

  /**
   * Search for a location in the dataset.
   * Matches against block name, district, or state.
   */
  public static searchLocation(query: string, year: string = "2024-2025"): BlockData[] {
    const yearData = this.masterData[year];
    if (!yearData) return [];

    const normalizedQuery = query.toLowerCase().trim();
    
    // 1. Exact match (High Priority)
    const matches = yearData.filter(block => 
      block.name.toLowerCase() === normalizedQuery ||
      (block.district && block.district.toLowerCase() === normalizedQuery)
    );
    if (matches.length > 0) return matches;

    // Helper: Remove vowels and repeated chars for "skeleton" matching
    // e.g. "ferozepur" -> "frzpr", "firozpur" -> "frzpr"
    const getSkeleton = (str: string) => str.replace(/[aeiouy]/g, '').replace(/(.)\1+/g, '$1');

    const STOP_WORDS = new Set(['give', 'data', 'ground', 'water', 'groundwater', 'status', 'of', 'for', 'in', 'the', 'is', 'me', 'tell', 'about']);

    // 2. Keyword match with Word Boundaries & Phonetic Check
    const validMatches = yearData.filter(block => {
      const name = block.name.toLowerCase();
      const district = block.district?.toLowerCase();
      
      // Escape special characters for regex
      const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const nameRegex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
      const distRegex = district ? new RegExp(`\\b${escapeRegExp(district)}\\b`, 'i') : null;
      
      const isWordMatch = name.length > 3 && nameRegex.test(normalizedQuery);
      const isDistMatch = district && district.length > 3 && distRegex!.test(normalizedQuery);
      
      if (isWordMatch || isDistMatch) return true;

      if (name.length > 4) { 
         const queryWords = normalizedQuery.split(/\s+/);
         const nameSkeleton = getSkeleton(name);
         
         for (const w of queryWords) {
            if (STOP_WORDS.has(w) || w.length < 4) continue; // Skip common words
            if (!w.startsWith(name[0])) continue;
            
            if (Math.abs(w.length - name.length) <= 2) {
                if (getSkeleton(w) === nameSkeleton) return true;
            }
         }
      }
      return false;
    });

    if (validMatches.length > 0) {
        return validMatches.sort((a, b) => b.name.length - a.name.length).slice(0, 10);
    }

    return yearData.filter(block => 
      block.name.toLowerCase().includes(normalizedQuery) ||
      (block.district && block.district.toLowerCase().includes(normalizedQuery))
    ).slice(0, 10);
  }

  /**
   * Handle analytical queries like "Top 5 over exploited blocks in Punjab"
   */
  public static getAnalyticsContext(query: string, year: string = "2024-2025"): string {
      const normalizedQuery = query.toLowerCase();
      const yearData = this.masterData[year] || this.masterData["2023-2024"]; // Fallback if year missing
      if (!yearData) return "";

      // 1. Detect Intent
      const isTop = normalizedQuery.includes("top") || normalizedQuery.includes("highest") || normalizedQuery.includes("worst");
      const isSafe = normalizedQuery.includes("safe") || normalizedQuery.includes("best");
      
      if (!isTop && !isSafe) return ""; // Not an analytic query we handle

      // 2. Extract Context (State?)
      // Simple heuristic: check if any known State name is in query
      // (For now, just checking common ones or rely on broader filter)
      // Actually, let's filter by the query string itself matching state names in data?
      // Too slow to check all states. 
      // Let's assume user mentions state name.
      // We can use the yearData to find unique states and check? 
      // Optimization: Just check if normalizedQuery contains state name.
      
      const uniqueStates = Array.from(new Set(yearData.map(b => b.state).filter(Boolean))) as string[];
      const targetState = uniqueStates.find(s => normalizedQuery.includes(s.toLowerCase()));

      const filtered = targetState 
         ? yearData.filter(b => b.state?.toLowerCase() === targetState.toLowerCase())
         : yearData; // If no state mentioned, search all India (careful with size)

      // 3. Sort
      // "Worst/Top" usually means High Stage of Extraction
      // "Safe/Best" usually means Low Stage
      
      filtered.sort((a, b) => isSafe ? a.stage - b.stage : b.stage - a.stage);

      // 4. Limit
      const limit = 5;
      const topItems = filtered.slice(0, limit);

      let context = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      context += `ANALYTICS DATA: ${isSafe ? 'LOWEST' : 'HIGHEST'} EXTRACTION ${targetState ? 'IN ' + targetState.toUpperCase() : 'ACROSS INDIA'}\n`;
      context += `(Source: CGWB ${year})\n`;
      context += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      
      topItems.forEach((m, i) => {
        context += `${i+1}. ${m.name} (${m.district}, ${m.state}): ${m.stage.toFixed(1)}% Stage (${m.category})\n`;
      });
      context += "\n";
      return context;
  }

  /**
   * Get a summarized context string for the AI prompt
   */
  public static getContextForPrompt(query: string, preferredYear: string = "2024-2025"): string {
    // 1. Try preferred year first
    let matches = this.searchLocation(query, preferredYear);
    let yearUsed = preferredYear;

    // 2. If no matches, try fallback year (2023-2024)
    if (matches.length === 0 && preferredYear !== "2023-2024") {
        matches = this.searchLocation(query, "2023-2024");
        yearUsed = "2023-2024";
    }

    const finalMatches = matches;

    if (finalMatches.length === 0) return "";

    let context = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    context += `VERIFIED GROUND TRUTH DATA (CGWB ${yearUsed})\n`;
    context += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

    finalMatches.slice(0, 3).forEach(m => {
      context += `LOCATION: ${m.name}${m.district ? ', ' + m.district : ''}${m.state ? ', ' + m.state : ''}\n`;
      context += `- Annual Extractable Resources: ${m.extractable_ham.toLocaleString()} ham\n`;
      context += `- Groundwater Extraction: ${m.extraction_ham.toLocaleString()} ham\n`;
      context += `- Stage of Extraction: ${m.stage.toFixed(1)}%\n`;
      context += `- Category: ${m.category}\n`;
      context += `- Rainfall: ${m.rainfall.toFixed(1)} mm/year\n\n`;
    });

    return context;
  }
}
