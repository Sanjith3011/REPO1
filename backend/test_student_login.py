import urllib.request
import json
import urllib.error

BASE_URL = 'http://localhost:8000/api'

def req(url, data=None, headers=None, method=None):
    headers = headers or {}
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8') if data else None, headers=headers)
    if method: req.method = method
    elif data: req.method = 'POST'
    if data: req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

print("\n--- Test Student dual login ---")
student_data = {
    'role': 'student',
    'username': '24CS301',
    'name': 'DEVAKI U'
}
s, d = req(f'{BASE_URL}/auth/login/', student_data)
print("Student login status:", s)
if s == 200:
    print("Success! Token received for student", d.get('username'))
else:
    print("Failed payload:", d)
