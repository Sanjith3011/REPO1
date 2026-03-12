from django.contrib import admin
from .models import CustomUser, Department, Batch, Subject, Student, Mark

from django.contrib.auth.admin import UserAdmin

class CustomUserAdmin(UserAdmin):
    # Specify the fields that should be displayed in the admin panel
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role', 'department', 'student_profile')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'department', 'student_profile')}),
    )

class SubjectAdmin(admin.ModelAdmin):
    filter_horizontal = ('assigned_students',)
    list_display = ('code', 'name', 'department', 'semester', 'teacher')
    list_filter = ('department', 'semester')


admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Department)
admin.site.register(Batch)
admin.site.register(Subject, SubjectAdmin)
admin.site.register(Student)
admin.site.register(Mark)
