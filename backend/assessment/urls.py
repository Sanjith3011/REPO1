from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.current_user, name='current_user'),
    path('auth/change-password/', views.change_own_password, name='change_own_password'),


    # Reference data
    path('departments/', views.department_list, name='departments'),
    path('batches/', views.batch_list, name='batches'),
    path('batches/create/', views.batch_create, name='batch_create'),
    
    # Teachers
    path('teachers/', views.teacher_list, name='teachers'),
    path('teachers/create/', views.teacher_create, name='teacher_create'),
    path('teachers/<int:teacher_id>/delete/', views.teacher_delete, name='teacher_delete'),
    path('teachers/<int:teacher_id>/update/', views.teacher_update, name='teacher_update'),
    path('teachers/<int:teacher_id>/change-password/', views.teacher_change_password, name='teacher_change_password'),

    # Subjects
    path('subjects/', views.subject_list, name='subjects'),
    path('subjects/create/', views.subject_create, name='subject_create'),
    path('subjects/<int:subject_id>/delete/', views.subject_delete, name='subject_delete'),
    path('subjects/<int:subject_id>/update/', views.subject_update, name='subject_update'),
    path('subjects/<int:subject_id>/assign/', views.subject_assign, name='subject_assign'),
    path('subjects/<int:subject_id>/assign_students/', views.subject_assign_students, name='subject_assign_students'),
    
    # Students
    path('students/', views.student_list, name='students'),
    path('students/create/', views.student_create, name='student_create'),
    path('students/bulk-delete/', views.student_bulk_delete, name='student_bulk_delete'),
    path('students/<int:student_id>/delete/', views.student_delete, name='student_delete'),

    # Marks
    path('marks/', views.marks_list, name='marks_list'),
    path('marks/save/', views.marks_save, name='marks_save'),
    path('marks/summary/', views.marks_summary, name='marks_summary'),
    path('marks/export-pdf/', views.export_pdf, name='export_pdf'),
    path('marks/export-csv/', views.export_csv, name='export_csv'),

    # Student portal
    path('student/marks/', views.student_own_marks, name='student_own_marks'),
]
