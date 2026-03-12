import os
import django
import json

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import call_command

def import_data():
    file_path = 'data.json'
    if os.path.exists(file_path):
        print(f"📦 Found {file_path}. Starting data import...")
        try:
            # Loaddata into the database
            call_command('loaddata', file_path)
            
            from assessment.models import Student, CustomUser, Subject
            print(f"✅ Data imported successfully!")
            print(f"📊 Live counts now: {CustomUser.objects.count()} Users, {Student.objects.count()} Students, {Subject.objects.count()} Subjects.")
        except Exception as e:
            print(f"❌ Error during import: {e}")
    else:
        print("ℹ️ No data.json found. Skipping import.")

if __name__ == '__main__':
    import_data()
