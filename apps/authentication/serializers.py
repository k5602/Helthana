from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import RegexValidator
from .models import User, SecurityAuditLog
import re
from datetime import date


class PasswordValidationMixin:
    """Mixin for password strength validation"""
    
    def validate_password_strength(self, password):
        """Enhanced password strength validation"""
        errors = []
        
        # Length check
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long.")
        
        # Uppercase letter check
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter.")
        
        # Lowercase letter check
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter.")
        
        # Number check
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one number.")
        
        # Special character check
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\;\'\/~`]', password):
            errors.append("Password must contain at least one special character.")
        
        # Common password patterns check
        common_patterns = [
            r'123456', r'password', r'qwerty', r'abc123', r'admin',
            r'letmein', r'welcome', r'monkey', r'dragon'
        ]
        
        for pattern in common_patterns:
            if re.search(pattern, password.lower()):
                errors.append("Password contains common patterns that are not secure.")
                break
        
        # Sequential characters check
        if re.search(r'(012|123|234|345|456|567|678|789|890)', password):
            errors.append("Password should not contain sequential numbers.")
        
        if re.search(r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', password.lower()):
            errors.append("Password should not contain sequential letters.")
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return password


class UserRegistrationSerializer(PasswordValidationMixin, serializers.ModelSerializer):
    """Enhanced user registration serializer with comprehensive validation"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    # Phone number validator
    phone_regex = RegexValidator(
        regex=r'^\+?[1-9]\d{1,14}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = serializers.CharField(validators=[phone_regex], required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 
                 'first_name', 'last_name', 'phone_number', 'date_of_birth',
                 'emergency_contact_name', 'emergency_contact_phone', 'medical_conditions')
        extra_kwargs = {
            'first_name': {'required': True, 'allow_blank': False},
            'last_name': {'required': True, 'allow_blank': False},
            'email': {'required': True},
        }

    def validate_email(self, value):
        """Enhanced email validation"""
        # Check uniqueness
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        # Additional email format validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
            raise serializers.ValidationError("Enter a valid email address.")
        
        # Check for disposable email domains (basic list)
        disposable_domains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'throwaway.email'
        ]
        domain = value.split('@')[1].lower()
        if domain in disposable_domains:
            raise serializers.ValidationError("Disposable email addresses are not allowed.")
        
        return value.lower()

    def validate_username(self, value):
        """Enhanced username validation"""
        # Check uniqueness
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        
        # Length validation
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        
        if len(value) > 30:
            raise serializers.ValidationError("Username must be no more than 30 characters long.")
        
        # Character validation
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise serializers.ValidationError("Username can only contain letters, numbers, underscores, and hyphens.")
        
        # Must start with letter or number
        if not re.match(r'^[a-zA-Z0-9]', value):
            raise serializers.ValidationError("Username must start with a letter or number.")
        
        # Reserved usernames
        reserved_usernames = [
            'admin', 'administrator', 'root', 'api', 'www', 'mail', 'ftp',
            'support', 'help', 'info', 'contact', 'about', 'privacy', 'terms'
        ]
        if value.lower() in reserved_usernames:
            raise serializers.ValidationError("This username is reserved and cannot be used.")
        
        return value

    def validate_password(self, value):
        """Enhanced password validation"""
        # Use Django's built-in validation
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        
        # Use our custom validation mixin
        return self.validate_password_strength(value)

    def validate_date_of_birth(self, value):
        """Validate date of birth"""
        if value:
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            
            if value > today:
                raise serializers.ValidationError("Date of birth cannot be in the future.")
            
            if age < 13:
                raise serializers.ValidationError("You must be at least 13 years old to register.")
            
            if age > 120:
                raise serializers.ValidationError("Please enter a valid date of birth.")
        
        return value

    def validate_emergency_contact_phone(self, value):
        """Validate emergency contact phone number"""
        if value and not re.match(r'^\+?[1-9]\d{1,14}$', value):
            raise serializers.ValidationError("Enter a valid emergency contact phone number.")
        return value

    def validate_first_name(self, value):
        """Validate first name"""
        if not value or not value.strip():
            raise serializers.ValidationError("First name is required.")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("First name must be at least 2 characters long.")
        
        if not re.match(r'^[a-zA-Z\s\u0600-\u06FF]+$', value):
            raise serializers.ValidationError("First name can only contain letters and spaces.")
        
        return value.strip().title()

    def validate_last_name(self, value):
        """Validate last name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Last name is required.")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Last name must be at least 2 characters long.")
        
        if not re.match(r'^[a-zA-Z\s\u0600-\u06FF]+$', value):
            raise serializers.ValidationError("Last name can only contain letters and spaces.")
        
        return value.strip().title()

    def validate(self, attrs):
        """Cross-field validation"""
        # Password confirmation
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        
        # Check if emergency contact phone is different from user phone
        if (attrs.get('phone_number') and attrs.get('emergency_contact_phone') and 
            attrs['phone_number'] == attrs['emergency_contact_phone']):
            raise serializers.ValidationError({
                "emergency_contact_phone": "Emergency contact phone should be different from your phone number."
            })
        
        return attrs

    def create(self, validated_data):
        """Create user with enhanced data handling"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Enhanced user profile serializer"""
    phone_regex = RegexValidator(
        regex=r'^\+?[1-9]\d{1,14}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = serializers.CharField(validators=[phone_regex], required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name',
                 'phone_number', 'date_of_birth', 'emergency_contact_name',
                 'emergency_contact_phone', 'medical_conditions', 'email_verified',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'username', 'email_verified', 'created_at', 'updated_at')

    def validate_emergency_contact_phone(self, value):
        """Validate emergency contact phone number"""
        if value and not re.match(r'^\+?[1-9]\d{1,14}$', value):
            raise serializers.ValidationError("Enter a valid emergency contact phone number.")
        return value

    def validate_date_of_birth(self, value):
        """Validate date of birth"""
        if value:
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            
            if value > today:
                raise serializers.ValidationError("Date of birth cannot be in the future.")
            
            if age < 13:
                raise serializers.ValidationError("You must be at least 13 years old.")
            
            if age > 120:
                raise serializers.ValidationError("Please enter a valid date of birth.")
        
        return value

    def validate_first_name(self, value):
        """Validate first name"""
        if value and len(value.strip()) < 2:
            raise serializers.ValidationError("First name must be at least 2 characters long.")
        
        if value and not re.match(r'^[a-zA-Z\s\u0600-\u06FF]+$', value):
            raise serializers.ValidationError("First name can only contain letters and spaces.")
        
        return value.strip().title() if value else value

    def validate_last_name(self, value):
        """Validate last name"""
        if value and len(value.strip()) < 2:
            raise serializers.ValidationError("Last name must be at least 2 characters long.")
        
        if value and not re.match(r'^[a-zA-Z\s\u0600-\u06FF]+$', value):
            raise serializers.ValidationError("Last name can only contain letters and spaces.")
        
        return value.strip().title() if value else value

    def validate(self, attrs):
        """Cross-field validation for profile updates"""
        # Check if emergency contact phone is different from user phone
        phone_number = attrs.get('phone_number', self.instance.phone_number if self.instance else None)
        emergency_phone = attrs.get('emergency_contact_phone')
        
        if phone_number and emergency_phone and phone_number == emergency_phone:
            raise serializers.ValidationError({
                "emergency_contact_phone": "Emergency contact phone should be different from your phone number."
            })
        
        return attrs


class EmailUpdateSerializer(serializers.Serializer):
    """Serializer for updating email address"""
    new_email = serializers.EmailField()
    password = serializers.CharField()

    def validate_new_email(self, value):
        """Validate new email address"""
        # Check if email is already in use
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email address is already in use.")
        
        # Additional email format validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
            raise serializers.ValidationError("Enter a valid email address.")
        
        return value.lower()

    def validate_password(self, value):
        """Validate current password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """Enhanced serializer for password reset request"""
    email = serializers.EmailField()

    def validate_email(self, value):
        """Validate that email exists and account is active"""
        try:
            user = User.objects.get(email=value)
            if not user.is_active:
                raise serializers.ValidationError("This account is disabled.")
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            pass
        
        return value.lower()


class PasswordResetConfirmSerializer(PasswordValidationMixin, serializers.Serializer):
    """Enhanced serializer for password reset confirmation"""
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)
    password_confirm = serializers.CharField()

    def validate_token(self, value):
        """Validate reset token format"""
        if not value or len(value) < 10:
            raise serializers.ValidationError("Invalid reset token.")
        return value

    def validate_password(self, value):
        """Enhanced password validation"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        
        return self.validate_password_strength(value)

    def validate(self, attrs):
        """Cross-field validation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    """Enhanced serializer for email verification"""
    token = serializers.CharField()

    def validate_token(self, value):
        """Validate verification token format"""
        if not value or len(value) < 10:
            raise serializers.ValidationError("Invalid verification token.")
        return value


class ChangePasswordSerializer(PasswordValidationMixin, serializers.Serializer):
    """Enhanced serializer for changing password"""
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField()

    def validate_current_password(self, value):
        """Validate current password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        """Enhanced new password validation"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        
        # Check if new password is same as current
        user = self.context['request'].user
        if user.check_password(value):
            raise serializers.ValidationError("New password must be different from current password.")
        
        return self.validate_password_strength(value)

    def validate(self, attrs):
        """Cross-field validation"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "Passwords don't match."})
        
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError({"new_password": "New password must be different from current password."})
        
        return attrs


class CustomLoginSerializer(serializers.Serializer):
    """Enhanced login serializer with comprehensive validation"""
    username = serializers.CharField()
    password = serializers.CharField()

    def validate_username(self, value):
        """Basic username format validation"""
        if not value or not value.strip():
            raise serializers.ValidationError("Username or email is required.")
        return value.strip()

    def validate_password(self, value):
        """Basic password validation"""
        if not value:
            raise serializers.ValidationError("Password is required.")
        return value

    def validate(self, attrs):
        """Enhanced authentication validation"""
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            # Try to get user by username or email
            user = None
            try:
                if '@' in username:
                    user = User.objects.get(email=username.lower())
                else:
                    user = User.objects.get(username=username)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials.")

            # Check if account is locked
            if user.is_account_locked():
                lock_time = user.account_locked_until
                raise serializers.ValidationError(
                    f"Account is temporarily locked until {lock_time.strftime('%H:%M')} due to multiple failed login attempts."
                )

            # Check if account is active
            if not user.is_active:
                raise serializers.ValidationError("This account has been disabled. Please contact support.")

            # Authenticate user
            authenticated_user = authenticate(username=user.username, password=password)
            if not authenticated_user:
                # Increment failed login attempts
                was_locked = user.increment_failed_login_attempts()
                if was_locked:
                    raise serializers.ValidationError("Account has been temporarily locked due to multiple failed login attempts.")
                else:
                    remaining_attempts = 7 - user.failed_login_attempts
                    raise serializers.ValidationError(
                        f"Invalid credentials. {remaining_attempts} attempts remaining before account lockout."
                    )

            # Reset failed attempts on successful login
            if user.failed_login_attempts > 0:
                user.reset_failed_login_attempts()

            attrs['user'] = authenticated_user
        else:
            raise serializers.ValidationError("Must include username and password.")

        return attrs


class SecurityAuditLogSerializer(serializers.ModelSerializer):
    """Enhanced serializer for security audit logs"""
    user_display = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    formatted_timestamp = serializers.SerializerMethodField()
    
    class Meta:
        model = SecurityAuditLog
        fields = ('id', 'user_display', 'user_email', 'action', 'action_display', 
                 'ip_address', 'user_agent', 'timestamp', 'formatted_timestamp',
                 'success', 'details')
        read_only_fields = ('id', 'user_display', 'user_email', 'action', 'action_display', 
                           'ip_address', 'user_agent', 'timestamp', 'formatted_timestamp',
                           'success', 'details')

    def get_formatted_timestamp(self, obj):
        """Format timestamp for display"""
        return obj.timestamp.strftime('%Y-%m-%d %H:%M:%S')


class AccountDeletionSerializer(serializers.Serializer):
    """Serializer for account deletion confirmation"""
    password = serializers.CharField()
    confirmation = serializers.CharField()

    def validate_password(self, value):
        """Validate current password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_confirmation(self, value):
        """Validate deletion confirmation"""
        if value.lower() != 'delete my account':
            raise serializers.ValidationError("Please type 'DELETE MY ACCOUNT' to confirm account deletion.")
        return value


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list (admin purposes)"""
    full_name = serializers.SerializerMethodField()
    account_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'email_verified',
                 'is_active', 'account_status', 'created_at', 'last_login')
        read_only_fields = ('id', 'username', 'email', 'full_name', 'email_verified',
                           'is_active', 'account_status', 'created_at', 'last_login')

    def get_full_name(self, obj):
        """Get user's full name"""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_account_status(self, obj):
        """Get account status"""
        if not obj.is_active:
            return "Disabled"
        elif obj.is_account_locked():
            return "Locked"
        elif not obj.email_verified:
            return "Unverified"
        else:
            return "Active"