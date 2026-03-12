import os, django
import urllib.request
import json
import urllib.error

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assessment.models import Student, CustomUser

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

with open('student_login_results.txt', 'w') as f:
    f.write("--- Testing all students ---\n")
    for s in Student.objects.all():
        f.write(f"\nStudent: {s.name} | Reg: {s.roll_no}\n")
        users = CustomUser.objects.filter(username=s.roll_no, role='student')
        if not users.exists():
            f.write("  WARNING: No CustomUser account exists for this student! They cannot log in.\n")
            continue
        
        payload = {
            'role': 'student',
            'username': s.roll_no,
            'name': s.name
        }
        status, d = req(f'{BASE_URL}/auth/login/', payload)
        if status == 200:
            f.write(f"  Login SUCCESS! Token ends with: ...{d['access'][-20:]}\n")
        else:
            f.write(f"  Login FAILED! Return payload: {d}\n")
