from rest_framework import serializers
from .models import CustomUser, Department, Batch, Subject, Student, Mark


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    student_roll_no = serializers.CharField(source='student_profile.roll_no', read_only=True)
    student_id = serializers.IntegerField(source='student_profile.id', read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'department', 'department_name', 'student_roll_no', 'student_id']


class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'first_name', 'last_name', 'role']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class BatchSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    label = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = ['id', 'year_start', 'year_end', 'department', 'department_name', 'label']

    def get_label(self, obj):
        return f"{obj.year_start}–{obj.year_end}"


class SubjectSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField(read_only=True)
    assigned_students = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = '__all__'

    def get_teacher_name(self, obj):
        if obj.teacher:
            return f"{obj.teacher.first_name} {obj.teacher.last_name}".strip() or obj.teacher.username
        return None


class StudentSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    batch_label = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ['id', 'name', 'roll_no', 'batch', 'batch_label', 'department', 'department_name', 'year']

    def get_batch_label(self, obj):
        return f"{obj.batch.year_start}–{obj.batch.year_end}"


class MarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mark
        fields = ['id', 'student', 'subject', 'assessment_type', 'marks', 'is_absent']


class MarkWriteSerializer(serializers.Serializer):
    """Used for bulk mark entry by teacher"""
    student_id = serializers.IntegerField()
    subject_id = serializers.IntegerField()
    assessment_type = serializers.CharField()
    marks = serializers.FloatField(allow_null=True, required=False)
    is_absent = serializers.BooleanField(default=False)
