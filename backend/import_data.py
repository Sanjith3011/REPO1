import os
import django
import sys

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import call_command
from assessment.models import CustomUser

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
        print(f"📦 Found data file at: {file_path}. Starting import...")
        try:
            # IMPORTANT: Delete the temporary admin to avoid unique constraint conflicts
            # loaddata will import the real admin from the JSON file
            CustomUser.objects.filter(username='admin').delete()
            print("🧹 Removed temporary admin to prevent conflicts.")
            
            # Loaddata into the database
            call_command('loaddata', file_path)
            
            from assessment.models import Student, CustomUser, Subject, Department
            print(f"✅ Data imported successfully from {file_path}!")
            print(f"📊 Live counts now:")
            print(f"   - Users: {CustomUser.objects.count()}")
            print(f"   - Students: {Student.objects.count()}")
            print(f"   - Teachers: {CustomUser.objects.filter(role='teacher').count()}")
            print(f"   - Subjects: {Subject.objects.count()}")
            print(f"   - Departments: {Department.objects.count()}")
            
        except Exception as e:
            print(f"❌ ERROR while importing data: {str(e)}")
            # Re-create admin if it was deleted and import failed
            if not CustomUser.objects.filter(username='admin').exists():
                 CustomUser.objects.create_superuser('admin', 'admin@example.com', 'admin123', role='admin')
                 print("⚠️ Re-created emergency admin after failed import.")
    else:
        print(f"ℹ️ No data.json found. Checked paths: {possible_paths}")

if __name__ == '__main__':
    import_data()
