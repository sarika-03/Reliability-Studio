#!/usr/bin/env python3
import requests
import time
import sys

def verify_ara():
    backend_url = "http://localhost:9000"
    
    print("🚀 Starting ARA Verification Test...")
    
    # 1. Create a dummy incident
    print("\n1️⃣ Creating test incident...")
    incident_payload = {
        "title": "ARA Test Incident - DB Timeout",
        "description": "Simulating a database timeout to trigger ARA",
        "severity": "high",
        "service": "payment-service"
    }
    
    try:
        resp = requests.post(f"{backend_url}/api/incidents", json=incident_payload, timeout=5)
        resp.raise_for_status()
        incident = resp.json()
        incident_id = incident['id']
        print(f"✅ Incident created: {incident_id}")
    except Exception as e:
        print(f"❌ Failed to create incident: {e}")
        return

    # 2. Poll for ARA logs
    print("\n2️⃣ Polling for ARA 'Thinking' logs...")
    
    max_attempts = 10
    attempts = 0
    logs_found = []
    
    while attempts < max_attempts:
        try:
            resp = requests.get(f"{backend_url}/api/ara/logs/{incident_id}", timeout=5)
            resp.raise_for_status()
            logs = resp.json()
            
            # Print new logs
            for log in logs:
                if log['id'] not in [l.get('id') for l in logs_found]:
                    print(f"  🤖 [{log['created_at'][11:19]}] {log['message']}")
                    logs_found.append(log)
            
            if any("✅ Hypothesis generated" in l['message'] for l in logs):
                print("\n✅ Success! ARA completed the investigation workflow.")
                break
                
        except Exception as e:
            print(f"⚠️ Error polling logs: {e}")
            
        time.sleep(2)
        attempts += 1
        print(f"   (Polling attempt {attempts}/{max_attempts}...)", end="\r")

    # 3. Verify Hypothesis creation
    print("\n3️⃣ Verifying Hypothesis in DB...")
    try:
        resp = requests.get(f"{backend_url}/api/incidents/{incident_id}/investigation/hypotheses", timeout=5)
        resp.raise_for_status()
        hypotheses = resp.json()
        
        auto_hypotheses = [h for h in hypotheses if h.get('is_auto_generated')]
        if len(auto_hypotheses) > 0:
            print(f"✅ Found {len(auto_hypotheses)} auto-generated hypotheses.")
            for h in auto_hypotheses:
                print(f"   • Title: {h['title']}")
                print(f"   • Confidence: {h['confidence']}")
        else:
            print("❌ No auto-generated hypotheses found.")
    except Exception as e:
        print(f"❌ Error verifying hypotheses: {e}")

    print("\n🏁 ARA Verification Complete.")

if __name__ == "__main__":
    verify_ara()
