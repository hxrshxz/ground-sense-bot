#!/usr/bin/env python3
"""
Quick test script to verify Gemini API connectivity and embedding generation
"""

import os
import sys

def test_gemini():
    print("🧪 Testing Gemini API Connection")
    print("=" * 50)
    
    # Check API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment")
        print("\nPlease set it:")
        print("  export GEMINI_API_KEY='your-api-key-here'")
        print("\nGet your key from: https://makersuite.google.com/app/apikey")
        return False
    
    print(f"✅ API key found: {api_key[:10]}...")
    
    # Try importing library
    try:
        import google.generativeai as genai
        print("✅ google-generativeai library installed")
    except ImportError:
        print("❌ google-generativeai not installed")
        print("\nInstall it:")
        print("  pip install google-generativeai")
        return False
    
    # Configure Gemini
    try:
        genai.configure(api_key=api_key)
        print("✅ Gemini configured")
    except Exception as e:
        print(f"❌ Failed to configure Gemini: {e}")
        return False
    
    # Test embedding generation
    try:
        print("\n🔄 Testing embedding generation...")
        test_text = "Groundwater levels are declining in Punjab"
        
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=test_text,
            task_type="retrieval_document"
        )
        
        embedding = result['embedding']
        print(f"✅ Embedding generated successfully!")
        print(f"   Dimensions: {len(embedding)}")
        print(f"   Sample values: {embedding[:5]}")
        
    except Exception as e:
        print(f"❌ Embedding generation failed: {e}")
        return False
    
    # Test query embedding
    try:
        print("\n🔄 Testing query embedding...")
        query_text = "water stressed regions"
        
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=query_text,
            task_type="retrieval_query"
        )
        
        query_embedding = result['embedding']
        print(f"✅ Query embedding generated successfully!")
        print(f"   Dimensions: {len(query_embedding)}")
        
    except Exception as e:
        print(f"❌ Query embedding failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All tests passed! Gemini is ready to use!")
    print("\nYou can now run:")
    print("  ./setup_rag.sh")
    return True

if __name__ == "__main__":
    success = test_gemini()
    sys.exit(0 if success else 1)
