#!/usr/bin/env python3
"""
Simple WebSocket test client for debugging the chat bot.
"""

import asyncio
import websockets
import json

async def test_chat():
    uri = "ws://localhost:8081/ws"
    
    async with websockets.connect(uri) as ws:
        print("Connected to WebSocket")
        
        # Test queries
        test_queries = [
            "Trend for Ludhiana",
            "List all blocks where rainfall is less than 500 mm",
            "Show me groundwater data for Jaisinagar",
            "Compare Ludhiana and Bathinda"
        ]
        
        for query in test_queries:
            print(f"\n{'='*60}")
            print(f"SENDING: {query}")
            print('='*60)
            
            # Send message
            message = {
                "username": "TestUser",
                "type": "text",
                "content": query
            }
            await ws.send(json.dumps(message))
            
            # Read responses (user message echo + bot response)
            for _ in range(2):  # Expecting echo + bot response
                try:
                    response = await asyncio.wait_for(ws.recv(), timeout=30)
                    data = json.loads(response)
                    
                    if data.get("username") == "Bot":
                        print("\n🤖 BOT RESPONSE:")
                        print(f"Type: {data.get('type')}")
                        print(f"Content: {data.get('content')}")
                        if data.get('payload'):
                            payload = data['payload']
                            print(f"Intent: {payload.get('intent')}")
                            print(f"Text: {payload.get('text')}")
                            if payload.get('chart'):
                                print(f"Chart Type: {payload['chart'].get('type')}")
                                print(f"Chart Title: {payload['chart'].get('title')}")
                            if payload.get('data'):
                                print(f"Data rows: {len(payload['data']) if isinstance(payload['data'], list) else 'N/A'}")
                    else:
                        print(f"[Echo] {data.get('username')}: {data.get('content')}")
                        
                except asyncio.TimeoutError:
                    print("Timeout waiting for response")
                    break
            
            await asyncio.sleep(1)  # Small delay between queries

if __name__ == "__main__":
    asyncio.run(test_chat())
