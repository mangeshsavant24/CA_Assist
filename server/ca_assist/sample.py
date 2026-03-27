# test_llm.py
import requests
import json

API_URL = "http://127.0.0.1:8000"

# Test different query types to see LLM in action
test_queries = [
    {
        "name": "TAX_QUERY",
        "query": "What are Section 80C limits?",
        "user_id": "test_user"
    },
    {
        "name": "GST_QUERY", 
        "query": "What is the GST rate on mobile phones?",
        "user_id": "test_user"
    },
    {
        "name": "ADVISORY",
        "query": "I have ₹5 lakhs to invest. What should I do for tax saving?",
        "user_id": "test_user"
    },
    {
        "name": "REGIME_COMPARE",
        "query": "Should I choose old or new tax regime?",
        "user_id": "test_user"
    }
]

print("=" * 80)
print("CA-ASSIST LLM OUTPUT TEST")
print("=" * 80)

for test in test_queries:
    print(f"\n📝 Test: {test['name']}")
    print(f"Query: {test['query']}")
    print("-" * 80)
    
    try:
        response = requests.post(
            f"{API_URL}/query",
            json={"query": test['query'], "user_id": test['user_id']}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Status: {response.status_code}")
            print(f"\n📌 ANSWER:\n{data.get('answer', 'No answer')[:500]}...")
            print(f"\n📚 CITATIONS ({len(data.get('citations', []))}):")
            for cite in data.get('citations', [])[:3]:
                print(f"   - {cite.get('source')}")
        else:
            print(f"✗ Status: {response.status_code}")
            print(f"Error: {response.text[:300]}")
            
    except Exception as e:
        print(f"✗ Exception: {str(e)[:200]}")
    
    print()

print("\n" + "=" * 80)
print("✓ Test complete!")