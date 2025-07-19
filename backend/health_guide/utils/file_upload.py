"""
Secure file upload and media handling utilities
"""
import os
import hashlib
import mimetypes
from typing import Dict, Any, Optional, Tuple
from pathlib import Path
from PIL import Image, ImageOps
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
from django.core.files.storage import default_storage
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.text import get_valid_filename
import magic


class FileUploadValidator:
    """Comprehensive file upload validation"""
    
    # Security configurations
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp']
    }
    
    # Dangerous file extensions to block
    BLOCKED_EXTENSIONS = {
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
        '.jar', '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl',
        '.sh', '.bash', '.ps1', '.msi', '.deb', '.rpm'
    }
    
    # Magic number signatures for file type validation
    MAGIC_SIGNATURES = {
        'image/jpeg': [b'\xff\xd8\xff'],
        'image/png': [b'\x89PNG\r\n\x1a\n'],
        'image/webp': [b'RIFF', b'WEBP']
    }
    
    @classmethod
    def validate_file(cls, uploaded_file, file_type: str = 'image') -> Dict[str, Any]:
        """
        Comprehensive file validation with security checks
        
        Args:
            uploaded_file: Django uploaded file object
            file_type: Type of file being uploaded ('image', 'document', etc.)
            
        Returns:
            Dict with validation results
        """
        errors = []
        warnings = []
        
        try:
            # Basic file checks
            if not uploaded_file:
                errors.append("No file provided")
                return {'valid': False, 'errors': errors, 'warnings': warnings}
            
            # File size validation
            if uploaded_file.size > cls.MAX_FILE_SIZE:
                errors.append(f"File size ({cls._format_file_size(uploaded_file.size)}) exceeds maximum allowed size ({cls._format_file_size(cls.MAX_FILE_SIZE)})")
            
            # File name validation
            original_name = uploaded_file.name
            if not original_name:
                errors.append("File name is required")
                return {'valid': False, 'errors': errors, 'warnings': warnings}
            
            # Sanitize filename
            safe_filename = get_valid_filename(original_name)
            if safe_filename != original_name:
                warnings.append(f"Filename was sanitized from '{original_name}' to '{safe_filename}'")
            
            # Extension validation
            file_ext = Path(safe_filename).suffix.lower()
            if file_ext in cls.BLOCKED_EXTENSIONS:
                errors.append(f"File type '{file_ext}' is not allowed for security reasons")
            
            # MIME type validation
            content_type = uploaded_file.content_type
            if file_type == 'image':
                if content_type not in cls.ALLOWED_IMAGE_TYPES:
                    errors.append(f"Image type '{content_type}' is not allowed. Allowed types: {', '.join(cls.ALLOWED_IMAGE_TYPES.keys())}")
                
                # Validate file extension matches MIME type
                allowed_extensions = cls.ALLOWED_IMAGE_TYPES.get(content_type, [])
                if file_ext not in allowed_extensions:
                    errors.append(f"File extension '{file_ext}' doesn't match content type '{content_type}'")
            
            # Magic number validation (file signature)
            if file_type == 'image':
                magic_validation = cls._validate_magic_numbers(uploaded_file, content_type)
                if not magic_validation['valid']:
                    errors.extend(magic_validation['errors'])
            
            # Virus scanning placeholder (would integrate with actual antivirus in production)
            virus_scan = cls._scan_for_malware(uploaded_file)
            if not virus_scan['clean']:
                errors.append("File failed security scan")
            
            # Image-specific validation
            if file_type == 'image' and not errors:
                image_validation = cls._validate_image_content(uploaded_file)
                errors.extend(image_validation.get('errors', []))
                warnings.extend(image_validation.get('warnings', []))
            
        except Exception as e:
            errors.append(f"File validation error: {str(e)}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'safe_filename': safe_filename if 'safe_filename' in locals() else original_name,
            'file_size': uploaded_file.size,
            'content_type': content_type if 'content_type' in locals() else 'unknown'
        }
    
    @classmethod
    def _format_file_size(cls, size_bytes: int) -> str:
        """Format file size in human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"
    
    @classmethod
    def _validate_magic_numbers(cls, uploaded_file, content_type: str) -> Dict[str, Any]:
        """Validate file using magic numbers (file signatures)"""
        try:
            # Read first 32 bytes for magic number validation
            uploaded_file.seek(0)
            file_header = uploaded_file.read(32)
            uploaded_file.seek(0)  # Reset file pointer
            
            signatures = cls.MAGIC_SIGNATURES.get(content_type, [])
            if not signatures:
                return {'valid': True, 'errors': []}
            
            # Check if file header matches any expected signature
            for signature in signatures:
                if file_header.startswith(signature):
                    return {'valid': True, 'errors': []}
            
            return {
                'valid': False,
                'errors': [f"File signature doesn't match declared type '{content_type}'"]
            }
            
        except Exception as e:
            return {
                'valid': False,
                'errors': [f"Magic number validation failed: {str(e)}"]
            }
    
    @classmethod
    def _scan_for_malware(cls, uploaded_file) -> Dict[str, Any]:
        """
        Placeholder for malware scanning
        In production, this would integrate with ClamAV or similar
        """
        # Placeholder implementation
        # In production, you would:
        # 1. Save file temporarily
        # 2. Run antivirus scan
        # 3. Return results
        # 4. Clean up temporary file
        
        return {'clean': True, 'scan_result': 'No threats detected (placeholder)'}
    
    @classmethod
    def _validate_image_content(cls, uploaded_file) -> Dict[str, Any]:
        """Validate image content and properties"""
        errors = []
        warnings = []
        
        try:
            # Try to open and validate image
            uploaded_file.seek(0)
            with Image.open(uploaded_file) as img:
                # Check image dimensions
                width, height = img.size
                
                # Minimum dimensions for prescription images
                if width < 300 or height < 300:
                    warnings.append(f"Image resolution ({width}x{height}) is quite low. Higher resolution images provide better OCR results.")
                
                # Maximum dimensions
                if width > 4000 or height > 4000:
                    warnings.append(f"Image resolution ({width}x{height}) is very high. Image will be compressed to optimize storage.")
                
                # Check for corrupted image
                img.verify()
                
            uploaded_file.seek(0)  # Reset file pointer
            
        except Exception as e:
            errors.append(f"Invalid image file: {str(e)}")
        
        return {'errors': errors, 'warnings': warnings}


class ImageProcessor:
    """Image compression and optimization"""
    
    # Compression settings
    MAX_DIMENSION = 2048  # Maximum width or height
    JPEG_QUALITY = 85
    PNG_OPTIMIZE = True
    WEBP_QUALITY = 80
    
    @classmethod
    def process_image(cls, uploaded_file, target_format: str = 'JPEG') -> Tuple[bytes, str]:
        """
        Process and optimize uploaded image
        
        Args:
            uploaded_file: Django uploaded file object
            target_format: Target image format ('JPEG', 'PNG', 'WEBP')
            
        Returns:
            Tuple of (processed_image_bytes, content_type)
        """
        try:
            uploaded_file.seek(0)
            with Image.open(uploaded_file) as img:
                # Convert to RGB if necessary (for JPEG compatibility)
                if target_format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
                    # Create white background for transparent images
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # Auto-orient image based on EXIF data
                img = ImageOps.exif_transpose(img)
                
                # Resize if too large
                original_size = img.size
                if max(img.size) > cls.MAX_DIMENSION:
                    img.thumbnail((cls.MAX_DIMENSION, cls.MAX_DIMENSION), Image.Resampling.LANCZOS)
                
                # Prepare compression settings
                save_kwargs = {}
                content_type = 'image/jpeg'
                
                if target_format == 'JPEG':
                    save_kwargs = {
                        'format': 'JPEG',
                        'quality': cls.JPEG_QUALITY,
                        'optimize': True,
                        'progressive': True
                    }
                    content_type = 'image/jpeg'
                elif target_format == 'PNG':
                    save_kwargs = {
                        'format': 'PNG',
                        'optimize': cls.PNG_OPTIMIZE
                    }
                    content_type = 'image/png'
                elif target_format == 'WEBP':
                    save_kwargs = {
                        'format': 'WEBP',
                        'quality': cls.WEBP_QUALITY,
                        'optimize': True
                    }
                    content_type = 'image/webp'
                
                # Save processed image to bytes
                from io import BytesIO
                output = BytesIO()
                img.save(output, **save_kwargs)
                processed_bytes = output.getvalue()
                
                return processed_bytes, content_type
                
        except Exception as e:
            raise ValidationError(f"Image processing failed: {str(e)}")


class SecureFileStorage:
    """Secure file storage with user access control"""
    
    @classmethod
    def generate_secure_filename(cls, user_id: int, original_filename: str, file_type: str = 'prescription') -> str:
        """
        Generate secure filename with user isolation
        
        Args:
            user_id: User ID for access control
            original_filename: Original uploaded filename
            file_type: Type of file (prescription, report, etc.)
            
        Returns:
            Secure filename with path
        """
        # Create timestamp
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        
        # Generate hash from original filename and timestamp for uniqueness
        filename_hash = hashlib.md5(f"{original_filename}_{timestamp}".encode()).hexdigest()[:8]
        
        # Get file extension
        file_ext = Path(original_filename).suffix.lower()
        
        # Create secure filename
        secure_name = f"{timestamp}_{filename_hash}{file_ext}"
        
        # Create user-specific path
        user_folder = f"user_{user_id}"
        file_path = f"{file_type}s/{user_folder}/{secure_name}"
        
        return file_path
    
    @classmethod
    def save_file(cls, file_content: bytes, file_path: str, content_type: str) -> Dict[str, Any]:
        """
        Save file to secure storage
        
        Args:
            file_content: File content as bytes
            file_path: Secure file path
            content_type: MIME content type
            
        Returns:
            Dict with save results
        """
        try:
            # Ensure directory exists
            directory = os.path.dirname(file_path)
            full_directory = os.path.join(settings.MEDIA_ROOT, directory)
            os.makedirs(full_directory, exist_ok=True)
            
            # Save file
            full_path = default_storage.save(file_path, 
                                           ContentFile(file_content, name=os.path.basename(file_path)))
            
            # Get file info
            file_size = len(file_content)
            file_url = default_storage.url(full_path)
            
            return {
                'success': True,
                'file_path': full_path,
                'file_url': file_url,
                'file_size': file_size,
                'content_type': content_type
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"File save failed: {str(e)}"
            }
    
    @classmethod
    def delete_file(cls, file_path: str) -> Dict[str, Any]:
        """
        Securely delete file
        
        Args:
            file_path: Path to file to delete
            
        Returns:
            Dict with deletion results
        """
        try:
            if default_storage.exists(file_path):
                default_storage.delete(file_path)
                return {'success': True, 'message': 'File deleted successfully'}
            else:
                return {'success': False, 'error': 'File not found'}
                
        except Exception as e:
            return {'success': False, 'error': f"File deletion failed: {str(e)}"}
    
    @classmethod
    def check_user_access(cls, user_id: int, file_path: str) -> bool:
        """
        Check if user has access to file
        
        Args:
            user_id: User ID requesting access
            file_path: Path to file
            
        Returns:
            True if user has access, False otherwise
        """
        # Extract user folder from path
        path_parts = file_path.split('/')
        if len(path_parts) >= 2:
            user_folder = path_parts[-2]  # Second to last part should be user folder
            expected_folder = f"user_{user_id}"
            return user_folder == expected_folder
        
        return False


class FileCleanupManager:
    """File cleanup and storage management"""
    
    @classmethod
    def cleanup_orphaned_files(cls, days_old: int = 7) -> Dict[str, Any]:
        """
        Clean up orphaned files (files not referenced in database)
        
        Args:
            days_old: Delete files older than this many days
            
        Returns:
            Dict with cleanup results
        """
        from apps.prescriptions.models import Prescription
        from datetime import timedelta
        
        try:
            cleanup_date = timezone.now() - timedelta(days=days_old)
            deleted_files = []
            errors = []
            
            # Get all prescription files from database
            db_files = set(Prescription.objects.filter(
                is_active=True,
                image__isnull=False
            ).values_list('image', flat=True))
            
            # Scan prescription files directory
            prescriptions_dir = os.path.join(settings.MEDIA_ROOT, 'prescriptions')
            if os.path.exists(prescriptions_dir):
                for root, dirs, files in os.walk(prescriptions_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        relative_path = os.path.relpath(file_path, settings.MEDIA_ROOT)
                        
                        # Check if file is referenced in database
                        if relative_path not in db_files:
                            # Check file age
                            file_stat = os.stat(file_path)
                            file_date = timezone.datetime.fromtimestamp(file_stat.st_mtime, tz=timezone.get_current_timezone())
                            
                            if file_date < cleanup_date:
                                try:
                                    os.remove(file_path)
                                    deleted_files.append(relative_path)
                                except Exception as e:
                                    errors.append(f"Failed to delete {relative_path}: {str(e)}")
            
            return {
                'success': True,
                'deleted_files': deleted_files,
                'deleted_count': len(deleted_files),
                'errors': errors
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Cleanup failed: {str(e)}"
            }
    
    @classmethod
    def get_storage_usage(cls, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Get storage usage statistics
        
        Args:
            user_id: Optional user ID to get user-specific usage
            
        Returns:
            Dict with storage usage info
        """
        try:
            total_size = 0
            file_count = 0
            
            if user_id:
                # Get user-specific usage
                user_folder = f"prescriptions/user_{user_id}"
                user_path = os.path.join(settings.MEDIA_ROOT, user_folder)
                
                if os.path.exists(user_path):
                    for root, dirs, files in os.walk(user_path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            if os.path.exists(file_path):
                                total_size += os.path.getsize(file_path)
                                file_count += 1
            else:
                # Get total usage
                media_root = settings.MEDIA_ROOT
                if os.path.exists(media_root):
                    for root, dirs, files in os.walk(media_root):
                        for file in files:
                            file_path = os.path.join(root, file)
                            if os.path.exists(file_path):
                                total_size += os.path.getsize(file_path)
                                file_count += 1
            
            return {
                'success': True,
                'total_size_bytes': total_size,
                'total_size_formatted': FileUploadValidator._format_file_size(total_size),
                'file_count': file_count,
                'user_id': user_id
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Storage usage calculation failed: {str(e)}"
            }


# Import ContentFile for file operations
from django.core.files.base import ContentFile