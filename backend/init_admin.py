import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assessment.models import CustomUser

def create_admin():
    username = 'admin'
    password = 'admin123'
    
    # Use find or create logic
    user, created = CustomUser.objects.get_or_create(
        username=username,
        defaults={
            'email': 'admin@example.com',
            'first_name': 'System',
            'last_name': 'Admin',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    if created:
        user.set_password(password)
        user.save()
        print(f"✅ Successfully created default admin: {username}")
    else:
        # Update existing user to be admin if needed
        user.role = 'admin'
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password) # Ensure password is reset to admin123
        user.save()
        print(f"ℹ️ Admin '{username}' already exists. Password reset to '{password}'.")

if __name__ == '__main__':
    create_admin()
