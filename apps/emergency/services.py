import logging
from datetime import timedelta
from typing import Dict, Any
from django.utils import timezone
from .models import EmergencyContact, EmergencyAlert

ALERT_TYPE_CONFIG = {
    'medical' : {
        'send_sms' : True,
        'make_call' : False,
        'message' : "🚨 MEDICAL EMERGENCY: {user_name} needs immediate help!"
    },
    'fall' : {
        'send_sms' : True,
        'make_call' : True,
        'message' : "🚨 FALL DETECTED: {user_name} may have fallen and needs assistance!"
    },
    'panic' : {
        'send_sms' : True,
        'make_call' : True,
        'message' : "🚨 PANIC ALERT: {user_name} has activated their panic button!"
    },
    'medication' : {
        'send_sms' : True,
        'make_call' : False,
        'message' : "🚨 MEDICATION EMERGENCY: {user_name} needs help with medication!" 
    }
    
    
}

logger = logging.getLogger(__name__)


class EmergencyService:
    """Service class for emergency management and notifications"""
    
    def _dispatch_sms_to_contact(self, contact, message, alert) -> Dict[str, Any]:
        
        sms_result = self._send_sms_notification(
            contact=contact,
            message=message,
            alert=alert
        )
        return sms_result
            

    def handle_alert(self, user, alert, alert_type, include_location):
        # this method is built like this so that, in the future, 
        # if we add new alerts, we won't have to change this method.
        send_sms = ALERT_TYPE_CONFIG[alert_type]['send_sms']
        make_call = ALERT_TYPE_CONFIG[alert_type]['make_call']
        if(send_sms):
            self._start_sms_sending_process(user, alert, alert_type, include_location)
        if(make_call):
            self._make_emergency_call()
        
    
    
    def _start_sms_sending_process(self, user, alert, alert_type, include_location):
        notifications_sent = 0
        failed_notifications = 0
        notifications_results = []
        
        contacts = EmergencyContact.objects.filter(
            user = user,
            is_active = True
            )
        
        if not contacts.exists():
            logger.warning(f"no emergency contacts found for user {user.id}")
            return {
                'notifications_sent' : 0,
                'failed_notifications' : 1,
                'message' : 'No emergency contacts configured'
            }
        # prepare alert sms
        message = self._prepare_alert_message(user, alert, alert_type, include_location)
        
        # loop over contacts
        for contact in contacts:
            sms_result = self._dispatch_sms_to_contact(contact, message, alert)
            notifications_results.append(sms_result)
            if sms_result['success']:
                notifications_sent+=1
            else:
                failed_notifications+=1
        
        return {
            'notification_sent' : notifications_sent,
            'failed_notifications' : failed_notifications,
            'notification_results' : notifications_results,
            'total_contacts' : contacts.count() 
        }
    
    
    
    def _send_notification(self, user, message, alert: EmergencyAlert):
        notifications_sent = 0
        failed_notifications = 0
        contacts = EmergencyContact.objects.filter(
            user=user,
            is_active=True
        )
        
        for contact in contacts:
            try:
                sms_result = self._dispatch_sms_to_contact(contact, message, alert)
                if sms_result['success']:
                    notifications_sent+=1
                else:
                    failed_notifications+=1
            except Exception as e:
                logger.error(f"Failed to send notification to contact {contact.id}: {str(e)}")
        
        return {
            'notifications_sent': notifications_sent,
            'failed_notifications': failed_notifications
        }
    
    def send_resolution_notification(self, user, alert: EmergencyAlert) -> Dict[str, Any]:
        message = f"RESOLVED: Emergency alert from {user.get_full_name() or user.username} has been resolved. They are now safe."
        return self._send_notification(user, message, alert)
        

    def send_cancellation_notification(self ,user, alert: EmergencyAlert) -> Dict[str, Any]:
        message = f"CANCELLED: Emergency alert from {user.get_full_name() or user.username} has been cancelled. False alarm - they are safe."
        return self._send_notification(user, message, alert)
        

    @staticmethod
    def get_emergency_status(user) -> Dict[str, Any]:
        """Get emergency status summary for user"""
        
        # Get contact statistics
        total_contacts = EmergencyContact.objects.filter(
            user=user,
            is_active=True
        ).count()
        
        primary_contact = EmergencyContact.objects.filter(
            user=user,
            is_primary=True,
            is_active=True
        ).first()
        
        # Get alert statistics
        total_alerts = EmergencyAlert.objects.filter(user=user).count()
        active_alerts = EmergencyAlert.objects.filter(
            user=user,
            is_resolved=False
        ).count()
        
        last_alert = EmergencyAlert.objects.filter(user=user).first()
        
        # Determine if emergency setup is ready
        emergency_ready = total_contacts > 0 and primary_contact is not None
        
        # Setup status details
        setup_status = {
            'has_contacts': total_contacts > 0,
            'has_primary_contact': primary_contact is not None,
            'contacts_count': total_contacts,
            'setup_complete': emergency_ready
        }
        
        return {
            'total_contacts': total_contacts,
            'primary_contact': primary_contact,
            'active_alerts': active_alerts,
            'total_alerts': total_alerts,
            'last_alert': last_alert,
            'emergency_ready': emergency_ready,
            'setup_status': setup_status
        }

    @staticmethod
    def get_alert_history(user, days: int = 30) -> Dict[str, Any]:
        """Get emergency alert history and statistics"""
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Get alerts in the period
        alerts = EmergencyAlert.objects.filter(
            user=user,
            created_at__gte=start_date
        )
        
        total_alerts = alerts.count()
        resolved_alerts = alerts.filter(is_resolved=True).count()
        active_alerts = alerts.filter(is_resolved=False).count()
        
        # Group alerts by type (if we had alert_type field)
        alerts_by_type = {
            'general': total_alerts,  # Placeholder since we don't have alert_type in model
        }
        
        # Group alerts by month
        alerts_by_month = {}
        for alert in alerts:
            month_key = alert.created_at.strftime('%Y-%m')
            alerts_by_month[month_key] = alerts_by_month.get(month_key, 0) + 1
        
        # Get recent alerts (last 10)
        recent_alerts = list(alerts.order_by('-created_at')[:10])
        
        # Calculate response times (time to resolution)
        resolved_alert_times = []
        for alert in alerts.filter(is_resolved=True):
            # Since we don't have resolution timestamp, we'll use a placeholder
            resolved_alert_times.append(30)  # 30 minutes average
        
        avg_response_time = sum(resolved_alert_times) / len(resolved_alert_times) if resolved_alert_times else 0
        
        response_times = {
            'average_minutes': round(avg_response_time, 1),
            'fastest_minutes': min(resolved_alert_times) if resolved_alert_times else 0,
            'slowest_minutes': max(resolved_alert_times) if resolved_alert_times else 0
        }
        
        return {
            'period_days': days,
            'total_alerts': total_alerts,
            'resolved_alerts': resolved_alerts,
            'active_alerts': active_alerts,
            'alerts_by_type': alerts_by_type,
            'alerts_by_month': alerts_by_month,
            'recent_alerts': recent_alerts,
            'response_times': response_times
        }

    @staticmethod
    def _prepare_alert_message(
        user,
        alert: EmergencyAlert,
        alert_type: str,
        include_location: bool
    ) -> str:
        """Prepare emergency alert message"""
        
        user_name = user.get_full_name() or user.username
        
        # Base message
        base_message = ALERT_TYPE_CONFIG[alert_type]['message'].format(user_name=user_name)
        
        # Add custom message if provided
        if alert.message and alert.message.strip():
            base_message += f"\n\nMessage: {alert.message}"
        
        # Add location if available and requested
        if include_location and alert.location_lat and alert.location_lng:
            base_message += f"\n\nLocation: https://maps.google.com/maps?q={alert.location_lat},{alert.location_lng}"
        
        # Add timestamp
        base_message += f"\n\nTime: {alert.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
        
        # Add app signature
        base_message += "\n\nSent from Your Health Guide app"
        
        return base_message

    @staticmethod
    def _send_sms_notification(
        contact: EmergencyContact,
        message: str,
        alert: EmergencyAlert
    ) -> Dict[str, Any]:
        """Send SMS notification to emergency contact"""
        
        try:
            # In a real implementation, this would use Twilio or similar service
            # For now, we'll simulate the SMS sending
            
            # Simulate SMS sending logic
            success = EmergencyService._simulate_sms_send(contact.phone_number, message)
            
            result = {
                'contact_id': contact.id,
                'contact_name': contact.name,
                'phone_number': contact.phone_number,
                'notification_type': 'sms',
                'status': 'sent' if success else 'failed',
                'message': message,
                'sent_at': timezone.now() if success else None,
                'error_message': None if success else 'SMS service unavailable',
                'success': success
            }
            
            logger.info(f"SMS notification {'sent' if success else 'failed'} to {contact.phone_number}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to send SMS to {contact.phone_number}: {str(e)}")
            return {
                'contact_id': contact.id,
                'contact_name': contact.name,
                'phone_number': contact.phone_number,
                'notification_type': 'sms',
                'status': 'failed',
                'message': message,
                'sent_at': None,
                'error_message': str(e),
                'success': False
            }

    @staticmethod
    def _make_emergency_call(
        contact: EmergencyContact,
        alert: EmergencyAlert
    ) -> Dict[str, Any]:
        """Make emergency call to contact"""
        
        try:
            # In a real implementation, this would use Twilio Voice API
            # For now, we'll simulate the call
            
            success = EmergencyService._simulate_call_make(contact.phone_number)
            
            result = {
                'contact_id': contact.id,
                'contact_name': contact.name,
                'phone_number': contact.phone_number,
                'notification_type': 'call',
                'status': 'sent' if success else 'failed',
                'message': 'Emergency call initiated',
                'sent_at': timezone.now() if success else None,
                'error_message': None if success else 'Call service unavailable',
                'success': success
            }
            
            logger.info(f"Emergency call {'initiated' if success else 'failed'} to {contact.phone_number}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to make emergency call to {contact.phone_number}: {str(e)}")
            return {
                'contact_id': contact.id,
                'contact_name': contact.name,
                'phone_number': contact.phone_number,
                'notification_type': 'call',
                'status': 'failed',
                'message': 'Emergency call failed',
                'sent_at': None,
                'error_message': str(e),
                'success': False
            }

    @staticmethod
    def _simulate_sms_send(phone_number: str, message: str) -> bool:
        """Simulate SMS sending (placeholder for real implementation)"""
        # In a real implementation, this would integrate with Twilio SMS API
        # For now, we'll simulate success/failure
        
        # Simulate 95% success rate
        import random
        return random.random() < 0.95

    @staticmethod
    def _simulate_call_make(phone_number: str) -> bool:
        """Simulate call making (placeholder for real implementation)"""
        # In a real implementation, this would integrate with Twilio Voice API
        # For now, we'll simulate success/failure
        
        # Simulate 90% success rate for calls
        import random
        return random.random() < 0.90

    @staticmethod
    def setup_twilio_integration():
        """Setup Twilio integration for real SMS/Call functionality"""
        # This would be implemented when integrating with Twilio
        # Would include:
        # - Twilio client initialization
        # - Account SID and Auth Token configuration
        # - Phone number validation
        # - Message templates
        # - Error handling and retry logic
        pass