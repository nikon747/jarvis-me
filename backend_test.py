import requests
import sys
import json
from datetime import datetime

class JarvisAPITester:
    def __init__(self, base_url="https://personal-ai-151.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.conversation_id = None
        self.task_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_create_conversation(self):
        """Test creating a new conversation"""
        success, response = self.run_test(
            "Create Conversation",
            "POST",
            "conversations",
            200,
            data={"title": "Test Conversation"}
        )
        if success and 'id' in response:
            self.conversation_id = response['id']
            print(f"   Created conversation ID: {self.conversation_id}")
        return success

    def test_get_conversations(self):
        """Test getting all conversations"""
        success, response = self.run_test(
            "Get Conversations",
            "GET",
            "conversations",
            200
        )
        return success

    def test_get_conversation(self):
        """Test getting a specific conversation"""
        if not self.conversation_id:
            print("❌ Skipped - No conversation ID available")
            return False
        
        success, response = self.run_test(
            "Get Specific Conversation",
            "GET",
            f"conversations/{self.conversation_id}",
            200
        )
        return success

    def test_send_chat_message(self):
        """Test sending a chat message"""
        if not self.conversation_id:
            print("❌ Skipped - No conversation ID available")
            return False
        
        success, response = self.run_test(
            "Send Chat Message",
            "POST",
            "chat",
            200,
            data={
                "conversation_id": self.conversation_id,
                "message": "Hello JARVIS, this is a test message. Please respond briefly."
            }
        )
        if success:
            print(f"   AI Response: {response.get('response', 'No response')[:100]}...")
            if response.get('audio_base64'):
                print("   ✅ Audio response included")
        return success

    def test_create_task(self):
        """Test creating a new task"""
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            data={
                "title": "Test Task",
                "description": "This is a test task",
                "priority": "high",
                "due_date": "2024-12-31"
            }
        )
        if success and 'id' in response:
            self.task_id = response['id']
            print(f"   Created task ID: {self.task_id}")
        return success

    def test_get_tasks(self):
        """Test getting all tasks"""
        success, response = self.run_test(
            "Get Tasks",
            "GET",
            "tasks",
            200
        )
        return success

    def test_get_task(self):
        """Test getting a specific task"""
        if not self.task_id:
            print("❌ Skipped - No task ID available")
            return False
        
        success, response = self.run_test(
            "Get Specific Task",
            "GET",
            f"tasks/{self.task_id}",
            200
        )
        return success

    def test_update_task(self):
        """Test updating a task (toggle complete)"""
        if not self.task_id:
            print("❌ Skipped - No task ID available")
            return False
        
        success, response = self.run_test(
            "Update Task (Toggle Complete)",
            "PATCH",
            f"tasks/{self.task_id}",
            200,
            data={"completed": True}
        )
        return success

    def test_delete_task(self):
        """Test deleting a task"""
        if not self.task_id:
            print("❌ Skipped - No task ID available")
            return False
        
        success, response = self.run_test(
            "Delete Task",
            "DELETE",
            f"tasks/{self.task_id}",
            200
        )
        return success

    def test_get_stats(self):
        """Test getting system stats"""
        success, response = self.run_test(
            "Get System Stats",
            "GET",
            "stats",
            200
        )
        if success:
            stats = response
            print(f"   Stats: {stats.get('total_conversations', 0)} conversations, {stats.get('total_tasks', 0)} tasks")
        return success

    def test_delete_conversation(self):
        """Test deleting a conversation"""
        if not self.conversation_id:
            print("❌ Skipped - No conversation ID available")
            return False
        
        success, response = self.run_test(
            "Delete Conversation",
            "DELETE",
            f"conversations/{self.conversation_id}",
            200
        )
        return success

def main():
    print("🤖 JARVIS API Testing Suite")
    print("=" * 50)
    
    tester = JarvisAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Create Conversation", tester.test_create_conversation),
        ("Get Conversations", tester.test_get_conversations),
        ("Get Specific Conversation", tester.test_get_conversation),
        ("Send Chat Message", tester.test_send_chat_message),
        ("Create Task", tester.test_create_task),
        ("Get Tasks", tester.test_get_tasks),
        ("Get Specific Task", tester.test_get_task),
        ("Update Task", tester.test_update_task),
        ("Get System Stats", tester.test_get_stats),
        ("Delete Task", tester.test_delete_task),
        ("Delete Conversation", tester.test_delete_conversation),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())