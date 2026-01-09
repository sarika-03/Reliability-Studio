#!/usr/bin/env python3
"""
Comprehensive test suite for Reliability Studio
Generates fake logs, metrics, and tests all endpoints
"""

import requests
import json
import time
from datetime import datetime, timedelta
import random
from typing import Dict, List, Any

class ReliabilityStudioTester:
    def __init__(self, backend_url="http://localhost:9000", loki_url="http://localhost:3100"):
        self.backend_url = backend_url
        self.loki_url = loki_url
        self.session = requests.Session()
        
    def test_health(self) -> bool:
        """Test backend health endpoint"""
        try:
            print("🏥 Testing Backend Health...")
            resp = self.session.get(f"{self.backend_url}/health", timeout=5)
            if resp.status_code == 200:
                print("✅ Backend is healthy")
                return True
            else:
                print(f"⚠️ Backend health check returned {resp.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False

    def generate_fake_logs(self, service_name: str, count: int = 10) -> List[Dict[str, Any]]:
        """Generate fake log entries"""
        log_levels = ["INFO", "WARNING", "ERROR", "CRITICAL"]
        messages = [
            f"{service_name}: Request processed successfully",
            f"{service_name}: Connection timeout detected",
            f"{service_name}: Memory usage high: 85%",
            f"{service_name}: Database query slow: 2500ms",
            f"{service_name}: Failed to connect to dependency",
            f"{service_name}: Circuit breaker opened",
            f"{service_name}: Retry attempt successful",
            f"{service_name}: Rate limit exceeded",
            f"{service_name}: Invalid input received",
            f"{service_name}: Cache miss",
        ]
        
        logs = []
        for i in range(count):
            timestamp = (datetime.utcnow() - timedelta(seconds=count-i)).isoformat() + "Z"
            log = {
                "timestamp": timestamp,
                "service": service_name,
                "level": random.choice(log_levels),
                "message": random.choice(messages),
                "trace_id": f"trace-{random.randint(1000, 9999)}",
                "span_id": f"span-{random.randint(1000, 9999)}",
            }
            logs.append(log)
        return logs

    def send_logs_to_loki(self, service_name: str, logs: List[Dict]) -> bool:
        """Send logs to Loki"""
        try:
            print(f"📤 Sending {len(logs)} logs to Loki for {service_name}...")
            
            # Convert logs to Loki format
            streams = []
            for log in logs:
                timestamp_ns = int(datetime.fromisoformat(log["timestamp"].replace("Z", "+00:00")).timestamp() * 1e9)
                streams.append({
                    "stream": {
                        "job": "reliability-studio",
                        "service": service_name,
                        "level": log["level"],
                    },
                    "values": [
                        [str(timestamp_ns), json.dumps(log)]
                    ]
                })
            
            payload = {"streams": streams}
            resp = self.session.post(
                f"{self.loki_url}/loki/api/v1/push",
                json=payload,
                timeout=10
            )
            
            if resp.status_code == 204 or resp.status_code == 200:
                print(f"✅ Logs sent successfully to Loki")
                return True
            else:
                print(f"⚠️ Loki returned {resp.status_code}: {resp.text}")
                return False
        except Exception as e:
            print(f"❌ Failed to send logs to Loki: {e}")
            return False

    def create_incident(self, service_name: str) -> bool:
        """Create a test incident"""
        try:
            print(f"🚨 Creating incident for {service_name}...")
            
            now = datetime.utcnow().isoformat() + "Z"
            incident = {
                "title": f"Service Degradation: {service_name}",
                "description": f"{service_name} is experiencing high error rates",
                "severity": random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
                "status": "ACTIVE",
                "services": [service_name],
                "root_cause": "Under investigation",
                "impact_score": round(random.uniform(1, 10), 2),
                "start_time": now,
                "timeline_events": [
                    {
                        "timestamp": now,
                        "event_type": "DETECTION",
                        "message": f"Alert triggered for {service_name}"
                    }
                ]
            }
            
            resp = self.session.post(
                f"{self.backend_url}/api/incidents",
                json=incident,
                timeout=10
            )
            
            if resp.status_code in [200, 201]:
                print(f"✅ Incident created: {resp.json().get('id', 'unknown')}")
                return True
            else:
                print(f"⚠️ Failed to create incident: {resp.status_code}")
                return False
        except Exception as e:
            print(f"❌ Incident creation failed: {e}")
            return False

    def test_api_endpoints(self) -> bool:
        """Test API endpoints"""
        try:
            print("\n📡 Testing API Endpoints...")
            
            endpoints = [
                ("/api/services", "Services"),
                ("/api/slos", "SLOs"),
                ("/api/incidents", "Incidents"),
                ("/api/timeline", "Timeline"),
            ]
            
            all_passed = True
            for endpoint, name in endpoints:
                try:
                    resp = self.session.get(f"{self.backend_url}{endpoint}", timeout=5)
                    if resp.status_code == 200:
                        print(f"✅ {name} endpoint working")
                    elif resp.status_code == 401:
                        print(f"⚠️ {name} endpoint requires authentication")
                    else:
                        print(f"❌ {name} endpoint returned {resp.status_code}")
                        all_passed = False
                except Exception as e:
                    print(f"❌ {name} endpoint error: {e}")
                    all_passed = False
            
            return all_passed
        except Exception as e:
            print(f"❌ API test failed: {e}")
            return False

    def run_full_test_suite(self):
        """Run complete test suite"""
        print("\n" + "="*60)
        print("🧪 RELIABILITY STUDIO TEST SUITE")
        print("="*60)
        
        # Test health
        if not self.test_health():
            print("❌ Backend is not healthy. Aborting tests.")
            return
        
        # Test API endpoints
        self.test_api_endpoints()
        
        # Generate and send fake logs
        services = ["payment-service", "api-gateway", "user-service", "database", "cache"]
        
        print("\n📝 Generating and sending fake logs...")
        print("-" * 60)
        for service in services:
            logs = self.generate_fake_logs(service, count=5)
            self.send_logs_to_loki(service, logs)
            time.sleep(0.5)  # Rate limiting
        
        # Create incidents
        print("\n🚨 Creating test incidents...")
        print("-" * 60)
        for service in services[:2]:  # Create incidents for first 2 services
            self.create_incident(service)
            time.sleep(0.5)
        
        # Print summary
        print("\n" + "="*60)
        print("✅ TEST SUITE COMPLETED")
        print("="*60)
        print("\n📊 What's now available:")
        print("  • Grafana Dashboard: http://localhost:3000")
        print("  • Backend API: http://localhost:9000")
        print("  • Loki Logs: http://localhost:3100")
        print("  • Prometheus Metrics: http://localhost:9090")
        print("  • Tempo Traces: http://localhost:3200")
        print("\n💡 Next steps:")
        print("  1. Open Grafana and create datasources for Prometheus/Loki")
        print("  2. Check Backend API for incidents and services")
        print("  3. Verify logs are flowing to Loki")
        print("  4. Set up alerts in Prometheus")
        print("\n" + "="*60)

if __name__ == "__main__":
    tester = ReliabilityStudioTester()
    tester.run_full_test_suite()
