"""
Prescription business logic services
"""
import time
import random
from typing import Dict, Any, List
from django.core.files.uploadedfile import InMemoryUploadedFile
from .models import Prescription, Medication


class OCRService:
    """OCR processing service with placeholder functionality"""
    
    # Mock prescription templates for realistic variation
    MOCK_PRESCRIPTIONS = [
        {
            'doctor_name': 'Dr. Ahmed Hassan',
            'clinic_name': 'Cairo Medical Center',
            'specialty': 'Internal Medicine',
            'medications': [
                {
                    'name': 'Amoxicillin',
                    'dosage': '500mg',
                    'frequency': '3 times daily',
                    'duration': '7 days',
                    'instructions': 'Take with food'
                },
                {
                    'name': 'Paracetamol',
                    'dosage': '500mg',
                    'frequency': 'Every 6 hours as needed',
                    'duration': '',
                    'instructions': 'For pain relief'
                },
                {
                    'name': 'Omeprazole',
                    'dosage': '20mg',
                    'frequency': 'Once daily',
                    'duration': '14 days',
                    'instructions': 'Before breakfast'
                }
            ]
        },
        {
            'doctor_name': 'Dr. Fatima Al-Zahra',
            'clinic_name': 'Alexandria General Hospital',
            'specialty': 'Cardiology',
            'medications': [
                {
                    'name': 'Atenolol',
                    'dosage': '50mg',
                    'frequency': 'Once daily',
                    'duration': '30 days',
                    'instructions': 'Take in the morning'
                },
                {
                    'name': 'Aspirin',
                    'dosage': '75mg',
                    'frequency': 'Once daily',
                    'duration': 'Ongoing',
                    'instructions': 'Take with food'
                }
            ]
        },
        {
            'doctor_name': 'Dr. Mohamed Salah',
            'clinic_name': 'Giza Medical Complex',
            'specialty': 'Pediatrics',
            'medications': [
                {
                    'name': 'Cefixime',
                    'dosage': '100mg',
                    'frequency': 'Twice daily',
                    'duration': '5 days',
                    'instructions': 'Shake well before use'
                },
                {
                    'name': 'Ibuprofen',
                    'dosage': '200mg',
                    'frequency': 'Every 8 hours as needed',
                    'duration': '',
                    'instructions': 'For fever and pain'
                }
            ]
        },
        {
            'doctor_name': 'Dr. Nadia Mahmoud',
            'clinic_name': "Women's Health Clinic",
            'specialty': 'Gynecology',
            'medications': [
                {
                    'name': 'Folic Acid',
                    'dosage': '5mg',
                    'frequency': 'Once daily',
                    'duration': '30 days',
                    'instructions': 'Take with breakfast'
                },
                {
                    'name': 'Iron Supplement',
                    'dosage': '65mg',
                    'frequency': 'Twice daily',
                    'duration': '60 days',
                    'instructions': 'Take with vitamin C'
                }
            ]
        }
    ]
    
    @staticmethod
    def process_prescription_image(image_path: str) -> Dict[str, Any]:
        """
        Placeholder OCR processing that simulates realistic medical text extraction
        with variations and confidence scoring
        """
        # Simulate processing delay (1-3 seconds)
        processing_time = random.uniform(1.0, 3.0)
        time.sleep(processing_time)
        
        # Randomly select a prescription template
        template = random.choice(OCRService.MOCK_PRESCRIPTIONS)
        
        # Generate confidence score based on simulated image quality
        base_confidence = random.uniform(0.75, 0.95)
        
        # Simulate OCR challenges that might reduce confidence
        challenges = []
        if random.random() < 0.3:  # 30% chance of handwriting issues
            challenges.append('handwriting_unclear')
            base_confidence -= random.uniform(0.05, 0.15)
        
        if random.random() < 0.2:  # 20% chance of image quality issues
            challenges.append('image_quality_poor')
            base_confidence -= random.uniform(0.1, 0.2)
        
        if random.random() < 0.15:  # 15% chance of partial text
            challenges.append('partial_text_visible')
            base_confidence -= random.uniform(0.15, 0.25)
        
        # Ensure confidence doesn't go below 0.4
        confidence = max(0.4, base_confidence)
        
        # Generate prescription date (within last 30 days)
        import datetime
        days_ago = random.randint(1, 30)
        prescription_date = (datetime.date.today() - datetime.timedelta(days=days_ago))
        
        # Build OCR text
        ocr_text = f"""
        {template['doctor_name']} - {template['specialty']}
        {template['clinic_name']}
        Date: {prescription_date.strftime('%d/%m/%Y')}
        
        Patient: [Patient Name]
        
        Rx:
        """
        
        # Add medications to OCR text
        for i, med in enumerate(template['medications'], 1):
            duration_text = f" for {med['duration']}" if med['duration'] else ""
            ocr_text += f"{i}. {med['name']} {med['dosage']} - {med['frequency']}{duration_text}\n"
            if med['instructions']:
                ocr_text += f"   ({med['instructions']})\n"
        
        ocr_text += f"""
        Follow up as needed
        {template['doctor_name']}
        License: {random.randint(10000, 99999)}
        """
        
        # Add OCR processing notes if confidence is low
        processing_notes = []
        if confidence < 0.8:
            processing_notes.append("Manual verification recommended")
        if 'handwriting_unclear' in challenges:
            processing_notes.append("Some handwritten text may be unclear")
        if 'image_quality_poor' in challenges:
            processing_notes.append("Image quality affects text recognition")
        if 'partial_text_visible' in challenges:
            processing_notes.append("Some text may be partially obscured")
        
        return {
            'text': ocr_text.strip(),
            'medications': template['medications'],
            'doctor_name': template['doctor_name'],
            'clinic_name': template['clinic_name'],
            'specialty': template['specialty'],
            'date': prescription_date.strftime('%Y-%m-%d'),
            'confidence': round(confidence, 2),
            'processing_time': round(processing_time, 1),
            'challenges_detected': challenges,
            'processing_notes': processing_notes,
            'requires_manual_review': confidence < 0.8
        }
    
    @staticmethod
    def simulate_ocr_failure() -> Dict[str, Any]:
        """Simulate OCR processing failure for testing error handling"""
        time.sleep(1)
        return {
            'success': False,
            'error': 'OCR processing failed',
            'error_code': 'OCR_PROCESSING_ERROR',
            'suggestions': [
                'Ensure image is clear and well-lit',
                'Try taking photo from directly above',
                'Make sure all text is visible in the image'
            ]
        }
    
    @staticmethod
    def get_processing_status_update(prescription_id: int) -> Dict[str, Any]:
        """Get real-time processing status updates"""
        # Simulate different processing stages
        stages = [
            {'stage': 'uploading', 'progress': 10, 'message': 'Uploading image...'},
            {'stage': 'preprocessing', 'progress': 30, 'message': 'Preprocessing image...'},
            {'stage': 'text_extraction', 'progress': 60, 'message': 'Extracting text...'},
            {'stage': 'medication_parsing', 'progress': 80, 'message': 'Parsing medications...'},
            {'stage': 'validation', 'progress': 95, 'message': 'Validating results...'},
            {'stage': 'completed', 'progress': 100, 'message': 'Processing completed'}
        ]
        
        # Return a random stage for simulation
        stage = random.choice(stages)
        return {
            'prescription_id': prescription_id,
            'status': stage['stage'],
            'progress': stage['progress'],
            'message': stage['message'],
            'estimated_time_remaining': max(0, (100 - stage['progress']) * 0.1)
        }


class PrescriptionService:
    """Service class for prescription business logic"""
    
    @staticmethod
    def create_prescription(user, validated_data: Dict[str, Any]) -> Prescription:
        """Create a new prescription"""
        validated_data['user'] = user
        return Prescription.objects.create(**validated_data)
    
    @staticmethod
    def process_prescription_ocr(prescription: Prescription) -> Dict[str, Any]:
        """Process OCR for a prescription with enhanced error handling"""
        try:
            # Update status to processing
            prescription.processing_status = 'processing'
            prescription.save()
            
            # Simulate random OCR failure for testing (5% chance)
            if random.random() < 0.05:
                raise Exception("Simulated OCR processing failure")
            
            # Process OCR
            ocr_result = OCRService.process_prescription_image(prescription.image.path)
            
            # Update prescription with OCR results
            prescription.ocr_text = ocr_result['text']
            prescription.ai_confidence_score = ocr_result['confidence']
            prescription.manual_verification_required = ocr_result.get('requires_manual_review', ocr_result['confidence'] < 0.8)
            
            # Set status based on confidence and challenges
            if ocr_result.get('requires_manual_review', False):
                prescription.processing_status = 'manual_review'
            else:
                prescription.processing_status = 'completed'
            
            prescription.is_processed = True
            prescription.save()
            
            # Create medication records
            PrescriptionService._create_medications_from_ocr(prescription, ocr_result['medications'])
            
            return {
                'success': True,
                'ocr_result': ocr_result,
                'prescription_id': prescription.id,
                'processing_notes': ocr_result.get('processing_notes', []),
                'challenges_detected': ocr_result.get('challenges_detected', [])
            }
            
        except Exception as e:
            prescription.processing_status = 'failed'
            prescription.save()
            
            # Provide helpful error messages and suggestions
            error_suggestions = [
                'Ensure the image is clear and well-lit',
                'Make sure all text is visible and not cut off',
                'Try taking the photo from directly above the prescription',
                'Avoid shadows and reflections on the prescription'
            ]
            
            return {
                'success': False,
                'error': str(e),
                'error_code': 'OCR_PROCESSING_FAILED',
                'prescription_id': prescription.id,
                'suggestions': error_suggestions,
                'retry_available': True
            }
    
    @staticmethod
    def _create_medications_from_ocr(prescription: Prescription, medications_data: List[Dict[str, Any]]):
        """Create medication records from OCR data"""
        for med_data in medications_data:
            Medication.objects.create(
                prescription=prescription,
                name=med_data['name'],
                dosage=med_data['dosage'],
                frequency=med_data['frequency'],
                duration=med_data.get('duration', ''),
                instructions=med_data.get('instructions', '')
            )
    
    @staticmethod
    def validate_image_upload(image: InMemoryUploadedFile) -> Dict[str, Any]:
        """Validate uploaded prescription image"""
        errors = []
        
        # Check file size (max 10MB)
        if image.size > 10 * 1024 * 1024:
            errors.append("Image size must be less than 10MB")
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
        if image.content_type not in allowed_types:
            errors.append("Only JPEG and PNG images are allowed")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }