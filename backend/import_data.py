import os
import django
import sys

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import call_command
from assessment.models import CustomUser, Student, Subject, Department

def log_message(msg):
    log_file = os.path.join(os.path.dirname(__file__), 'migration.log')
    print(msg)
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(msg + '\n')

def import_data():
    # Try multiple possible paths for the data file
    possible_paths = [
        'data.json',
        'backend/data.json',
        os.path.join(os.path.dirname(__file__), 'data.json')
    ]
    
    file_path = None
    for p in possible_paths:
        if os.path.exists(p):
            file_path = p
            break
            
    if file_path:
        log_message(f"📦 Found data file at: {file_path}. Starting import...")
        try:
            # Delete the temporary admin to avoid unique constraint conflicts
            # loaddata will import the real admin from the JSON file
            CustomUser.objects.filter(username='admin').delete()
            log_message("🧹 Removed temporary admin to prevent conflicts.")
            
            # Loaddata into the database
            call_command('loaddata', file_path)
            
            log_message(f"✅ Data imported successfully from {file_path}!")
            log_message(f"📊 Live counts now:")
            log_message(f"   - Users: {CustomUser.objects.count()}")
            log_message(f"   - Students: {Student.objects.count()}")
            log_message(f"   - Teachers: {CustomUser.objects.filter(role='teacher').count()}")
            log_message(f"   - Subjects: {Subject.objects.count()}")
            log_message(f"   - Departments: {Department.objects.count()}")
            
        except Exception as e:
            log_message(f"❌ ERROR while importing data: {str(e)}")
            # Re-create admin if it was deleted and import failed
            if not CustomUser.objects.filter(username='admin').exists():
                 CustomUser.objects.create_superuser('admin', 'admin@example.com', 'admin123', role='admin')
                 log_message("⚠️ Re-created emergency admin.")
    else:
        log_message(f"ℹ️ No data.json found. Checked paths: {possible_paths}")

if __name__ == '__main__':
    # Clear log on start
    log_file = os.path.join(os.path.dirname(__file__), 'migration.log')
    if os.path.exists(log_file):
        os.remove(log_file)
    import_data()
