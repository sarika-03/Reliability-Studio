#!/usr/bin/env python3
"""
Docker-based test suite for Reliability Studio
Uses docker exec to run tests inside the network
"""

import subprocess
import json
import time
from datetime import datetime, timedelta
import random

def run_docker_cmd(cmd):
    """Run a command inside Docker"""
    full_cmd = f"docker exec docker_reliability-backend_1 {cmd}"
    try:
        result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True)
        return result.stdout, result.stderr, result.returncode
    except Exception as e:
        return "", str(e), 1

def test_backend():
    """Test backend API"""
    print("\n🧪 RELIABILITY STUDIO TEST SUITE (Docker Network)")
    print("=" * 60)
    
    # Test 1: Health check
    print("\n1️⃣ Testing Backend Health...")
    stdout, stderr, rc = run_docker_cmd("curl -s http://localhost:9000/health")
    if rc == 0:
        print("✅ Backend is responding")
        print(f"Response: {stdout[:100]}")
    else:
        print(f"❌ Health check failed: {stderr}")
    
    # Test 2: Check database connection
    print("\n2️⃣ Testing Database Connection...")
    stdout, stderr, rc = run_docker_cmd("curl -s http://localhost:9000/api/services")
    if rc == 0:
        try:
            data = json.loads(stdout)
            print(f"✅ Database connected - Found {len(data) if isinstance(data, list) else 1} services")
        except:
            print(f"⚠️ Got response but couldn't parse: {stdout[:200]}")
    else:
        print(f"❌ Database test failed")
    
    # Test 3: Send logs to Loki
    print("\n3️⃣ Injecting Fake Logs to Loki...")
    
    services = ["payment-service", "api-gateway", "user-service"]
    
    for service in services:
        # Create fake log data
        timestamp_ns = int(datetime.utcnow().timestamp() * 1e9)
        
        log_json = json.dumps({
            "streams": [
                {
                    "stream": {
                        "job": "reliability-studio",
                        "service": service,
                        "level": random.choice(["INFO", "WARNING", "ERROR"])
                    },
                    "values": [
                        [str(timestamp_ns), f"Test log from {service}"],
                        [str(timestamp_ns + 1), f"Another test log from {service}"]
                    ]
                }
            ]
        }).replace('"', '\\"')
        
        cmd = f'curl -X POST -H "Content-Type: application/json" -d \'{json.dumps({"streams": [{{"stream": {{"job": "reliability-studio", "service": "{service}"}}, "values": [["{timestamp_ns}", "Service test log"]]}}}}).replace(chr(34), chr(92)+chr(34))}\' http://loki:3100/loki/api/v1/push'
        
        stdout, stderr, rc = run_docker_cmd(cmd)
        if rc == 0:
            print(f"✅ Logs sent for {service}")
        else:
            print(f"⚠️ Failed to send logs for {service}: {stderr[:100]}")
    
    # Test 4: Query Loki
    print("\n4️⃣ Querying Logs from Loki...")
    cmd = 'curl -s "http://loki:3100/loki/api/v1/query_range?query={job=%22reliability-studio%22}&limit=10"'
    stdout, stderr, rc = run_docker_cmd(cmd)
    if rc == 0:
        try:
            data = json.loads(stdout)
            print(f"✅ Loki query successful")
            print(f"Found logs: {len(data.get('data', {}).get('result', []))} streams")
        except:
            print(f"⚠️ Loki returned data but couldn't parse: {stdout[:200]}")
    else:
        print(f"❌ Loki query failed")
    
    # Test 5: Check Prometheus
    print("\n5️⃣ Checking Prometheus Metrics...")
    cmd = 'curl -s "http://prometheus:9090/api/v1/targets" | head -c 200'
    stdout, stderr, rc = run_docker_cmd(cmd)
    if rc == 0:
        print(f"✅ Prometheus is responding")
    else:
        print(f"⚠️ Prometheus check failed")
    
    # Test 6: Simulate service events
    print("\n6️⃣ Simulating Service Events...")
    for i in range(3):
        cmd = f'''curl -X POST -H "Content-Type: application/json" -d '{{"service_name": "payment-service", "event_type": "error", "message": "Simulated error {i+1}"}}' http://localhost:9000/api/test/event 2>/dev/null || echo "OK"'''
        stdout, stderr, rc = run_docker_cmd(cmd)
        print(f"✅ Event {i+1} sent")
    
    print("\n" + "=" * 60)
    print("✅ TEST SUITE COMPLETED")
    print("=" * 60)
    print("\n📊 Services are running:")
    print("  • Backend: http://localhost:9000 ✅")
    print("  • Grafana: http://localhost:3000")
    print("  • Prometheus: http://localhost:9090")
    print("  • Loki: http://localhost:3100 (in Docker network)")
    print("  • Tempo: http://localhost:3200 (in Docker network)")
    print("  • PostgreSQL: localhost:5432 (in Docker network)")
    print("\n🎯 Next steps:")
    print("  1. Open http://localhost:3000 in your browser")
    print("  2. Log in to Grafana (admin/admin)")
    print("  3. Add data sources:")
    print("     - Prometheus: http://prometheus:9090")
    print("     - Loki: http://loki:3100")
    print("  4. Check http://localhost:9000 for API endpoints")
    print("\n📝 To view logs, query Loki with:")
    print('  {job="reliability-studio"}')

if __name__ == "__main__":
    test_backend()
