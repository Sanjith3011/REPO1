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

print("--- Login as Admin ---")
status, login_data = req(f'{BASE_URL}/auth/login/', {'username': 'admin', 'password': 'admin123'})
token = login_data['access']

print("\n--- Create Teacher ---")
teacher_data = {
    'username': 'deleteme',
    'first_name': 'Delete',
    'last_name': 'Me',
    'password': 'pass',
    'role': 'teacher'
}
s, d = req(f'{BASE_URL}/teachers/create/', teacher_data, {'Authorization': f'Bearer {token}'})
print("Create status:", s)
teacher_id = d['id']
print("Teacher ID:", teacher_id)

print("\n--- Delete Teacher ---")
s, d = req(f'{BASE_URL}/teachers/{teacher_id}/delete/', headers={'Authorization': f'Bearer {token}'}, method='DELETE')
print("Delete status:", s)
print("Delete response:", d)

print("\n--- Verify Deletion via Teachers List ---")
s, d = req(f'{BASE_URL}/teachers/', headers={'Authorization': f'Bearer {token}'}, method='GET')
exists = any(t['username'] == 'deleteme' for t in d)
print("Still in list:", exists)
