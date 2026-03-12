import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assessment.models import CustomUser

def create_admin():
    username = 'admin'
    password = 'admin123'
    
    if not CustomUser.objects.filter(username=username).exists():
        print(f"Creating default admin: {username}")
        CustomUser.objects.create_superuser(
            username=username,
            password=password,
            email='admin@example.com',
            first_name='System',
            last_name='Admin',
            role='admin'
        )
        print("Admin created successfully!")
    else:
        print("Admin already exists. Skipping creation.")

if __name__ == '__main__':
    create_admin()
