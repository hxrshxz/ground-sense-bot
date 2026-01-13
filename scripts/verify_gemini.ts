
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function verifyGemini() {
  console.log('🔍 Verifying Gemini API Configuration...');

  // Hardcoded key from .env.local check
  const apiKey = "AIzaSyA-VDfXvNRC5BZCejcLXAylwFNNbhV-8SU";

  if (!apiKey) {
    console.error('❌ NEXT_PUBLIC_GEMINI_API_KEY not found in .env.local');
    return;
  }
  console.log('✅ API Key found (starts with):', apiKey.substring(0, 8) + '...');

  // List available models
  console.log('\n📋 Listing available models for this key...');
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!resp.ok) {
      console.error(`❌ ListModels failed: ${resp.status} ${resp.statusText}`);
      const text = await resp.text();
      console.error(`   ${text}`);
    } else {
      const data = await resp.json();
      const models = data.models || [];
      console.log(`✅ Found ${models.length} models:`);
      models.forEach((m: any) => {
        if (m.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`   - ${m.name.replace('models/', '')}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error listing models:', error);
  }

  const modelsToTry = ["gemini-2.0-flash-exp", "gemini-1.5-flash"];
  
  console.log('\n🔄 Retrying generation with specific models...');
  for (const modelName of modelsToTry) {
     // ... (keep existing generation test logic) -> actually I need to rewrite the loop part as I replaced the whole block
     console.log(`\nTesting model: ${modelName}...`);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent("Hello! Are you online?");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ Success! Response from ${modelName}:`);
      console.log(`   "${text.trim()}"`);
      return; 
    } catch (error: any) {
      console.error(`❌ Failed with ${modelName}:`);
      console.error(`   Error: ${error.message}`);
    }
  }
  
  console.error('\n❌ All models failed.');
}

verifyGemini().catch(console.error);
