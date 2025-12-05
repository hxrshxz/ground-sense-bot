#!/usr/bin/env python3
import asyncio
import websockets
import json
import sys

async def test_websocket(message):
    uri = "ws://localhost:8081/ws"
    
    try:
        async with websockets.connect(uri) as websocket:
            # Send message
            payload = {"message": message}
            print(f"Sending: {json.dumps(payload)}")
            await websocket.send(json.dumps(payload))
            
            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=30.0)
            print(f"\nResponse:\n{response}")
            
            # Try to parse and pretty print JSON
            try:
                data = json.loads(response)
                print(f"\nParsed Response:")
                print(json.dumps(data, indent=2))
            except json.JSONDecodeError:
                pass
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    message = sys.argv[1] if len(sys.argv) > 1 else "What is the groundwater status of Jaisinagar?"
    asyncio.run(test_websocket(message))
