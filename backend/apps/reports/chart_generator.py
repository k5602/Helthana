"""
Chart generation utilities for health reports
"""
import base64
from io import BytesIO
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json


class ChartGenerator:
    """Generate charts for health reports"""
    
    @staticmethod
    def generate_vitals_trend_chart(
        vital_type: str,
        readings: List[Dict[str, Any]],
        language: str = 'en'
    ) -> str:
        """Generate a trend chart for vital readings"""
        try:
            import matplotlib
            matplotlib.use('Agg')  # Use non-interactive backend
            import matplotlib.pyplot as plt
            import matplotlib.dates as mdates
            from datetime import datetime
            
            # Prepare data
            dates = []
            values = []
            
            for reading in readings:
                if isinstance(reading['date'], str):
                    date_obj = datetime.strptime(reading['date'], '%Y-%m-%d')
                else:
                    date_obj = reading['date']
                dates.append(date_obj)
                values.append(float(reading['value']))
            
            # Create figure
            fig, ax = plt.subplots(figsize=(10, 6))
            
            # Plot data
            ax.plot(dates, values, marker='o', linewidth=2, markersize=6, color='#3498db')
            ax.fill_between(dates, values, alpha=0.3, color='#3498db')
            
            # Customize chart
            title = f"{vital_type.replace('_', ' ').title()} Trend"
            if language == 'ar':
                title = f"اتجاه {vital_type.replace('_', ' ')}"
            
            ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
            ax.set_xlabel('Date' if language == 'en' else 'التاريخ', fontsize=12)
            ax.set_ylabel(f"Value ({readings[0]['unit']})" if language == 'en' else f"القيمة ({readings[0]['unit']})", fontsize=12)
            
            # Format dates on x-axis
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
            ax.xaxis.set_major_locator(mdates.DayLocator(interval=max(1, len(dates)//10)))
            plt.xticks(rotation=45)
            
            # Add grid
            ax.grid(True, alpha=0.3)
            
            # Style
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.spines['left'].set_color('#bdc3c7')
            ax.spines['bottom'].set_color('#bdc3c7')
            
            # Tight layout
            plt.tight_layout()
            
            # Save to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            buffer.seek(0)
            chart_data = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return f"data:image/png;base64,{chart_data}"
            
        except ImportError:
            # Return placeholder if matplotlib not available
            return ChartGenerator._generate_chart_placeholder(vital_type, len(readings), language)
        except Exception as e:
            print(f"Chart generation error: {e}")
            return ChartGenerator._generate_chart_placeholder(vital_type, len(readings), language)
    
    @staticmethod
    def generate_vitals_summary_chart(
        vitals_data: Dict[str, List[Dict[str, Any]]],
        language: str = 'en'
    ) -> str:
        """Generate a summary chart showing all vital types"""
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            
            # Prepare data
            vital_types = list(vitals_data.keys())
            reading_counts = [len(readings) for readings in vitals_data.values()]
            
            # Create figure
            fig, ax = plt.subplots(figsize=(10, 6))
            
            # Create bar chart
            colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']
            bars = ax.bar(range(len(vital_types)), reading_counts, 
                         color=[colors[i % len(colors)] for i in range(len(vital_types))])
            
            # Customize chart
            title = "Vital Signs Summary"
            if language == 'ar':
                title = "ملخص العلامات الحيوية"
            
            ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
            ax.set_xlabel('Vital Types' if language == 'en' else 'أنواع العلامات الحيوية', fontsize=12)
            ax.set_ylabel('Number of Readings' if language == 'en' else 'عدد القراءات', fontsize=12)
            
            # Set x-axis labels
            ax.set_xticks(range(len(vital_types)))
            ax.set_xticklabels([vt.replace('_', ' ').title() for vt in vital_types], rotation=45)
            
            # Add value labels on bars
            for bar, count in zip(bars, reading_counts):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                       f'{count}', ha='center', va='bottom', fontweight='bold')
            
            # Add grid
            ax.grid(True, alpha=0.3, axis='y')
            
            # Style
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.spines['left'].set_color('#bdc3c7')
            ax.spines['bottom'].set_color('#bdc3c7')
            
            # Tight layout
            plt.tight_layout()
            
            # Save to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            buffer.seek(0)
            chart_data = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return f"data:image/png;base64,{chart_data}"
            
        except ImportError:
            return ChartGenerator._generate_chart_placeholder("Summary", len(vitals_data), language)
        except Exception as e:
            print(f"Summary chart generation error: {e}")
            return ChartGenerator._generate_chart_placeholder("Summary", len(vitals_data), language)
    
    @staticmethod
    def generate_prescription_timeline_chart(
        prescriptions: List[Dict[str, Any]],
        language: str = 'en'
    ) -> str:
        """Generate a timeline chart for prescriptions"""
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            import matplotlib.dates as mdates
            from datetime import datetime
            
            # Prepare data
            dates = []
            medication_counts = []
            
            for prescription in prescriptions:
                if isinstance(prescription['date'], str):
                    date_obj = datetime.strptime(prescription['date'], '%Y-%m-%d')
                else:
                    date_obj = prescription['date']
                dates.append(date_obj)
                medication_counts.append(len(prescription.get('medications', [])))
            
            # Create figure
            fig, ax = plt.subplots(figsize=(10, 6))
            
            # Create timeline plot
            ax.scatter(dates, medication_counts, s=100, alpha=0.7, color='#e74c3c')
            
            # Connect points with lines
            if len(dates) > 1:
                ax.plot(dates, medication_counts, alpha=0.5, color='#e74c3c', linewidth=2)
            
            # Customize chart
            title = "Prescription Timeline"
            if language == 'ar':
                title = "الجدول الزمني للوصفات"
            
            ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
            ax.set_xlabel('Date' if language == 'en' else 'التاريخ', fontsize=12)
            ax.set_ylabel('Number of Medications' if language == 'en' else 'عدد الأدوية', fontsize=12)
            
            # Format dates on x-axis
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
            ax.xaxis.set_major_locator(mdates.DayLocator(interval=max(1, len(dates)//10)))
            plt.xticks(rotation=45)
            
            # Add grid
            ax.grid(True, alpha=0.3)
            
            # Style
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.spines['left'].set_color('#bdc3c7')
            ax.spines['bottom'].set_color('#bdc3c7')
            
            # Set y-axis to show integers only
            ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))
            
            # Tight layout
            plt.tight_layout()
            
            # Save to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            buffer.seek(0)
            chart_data = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return f"data:image/png;base64,{chart_data}"
            
        except ImportError:
            return ChartGenerator._generate_chart_placeholder("Prescriptions", len(prescriptions), language)
        except Exception as e:
            print(f"Prescription chart generation error: {e}")
            return ChartGenerator._generate_chart_placeholder("Prescriptions", len(prescriptions), language)
    
    @staticmethod
    def _generate_chart_placeholder(chart_type: str, data_count: int, language: str = 'en') -> str:
        """Generate a placeholder when chart libraries are not available"""
        if language == 'ar':
            return f"[رسم بياني لـ {chart_type} - {data_count} عنصر]"
        else:
            return f"[Chart for {chart_type} - {data_count} items]"
    
    @staticmethod
    def generate_health_insights(
        vitals_data: Dict[str, List[Dict[str, Any]]],
        prescriptions_data: Dict[str, Any],
        language: str = 'en'
    ) -> List[str]:
        """Generate health insights based on data patterns"""
        insights = []
        
        if vitals_data and vitals_data.get('by_type'):
            total_readings = vitals_data.get('total_readings', 0)
            
            if total_readings > 0:
                if language == 'ar':
                    insights.append(f"تم تسجيل {total_readings} قراءة للعلامات الحيوية خلال هذه الفترة")
                else:
                    insights.append(f"Recorded {total_readings} vital sign readings during this period")
                
                # Check for consistent monitoring
                vital_types_count = len(vitals_data['by_type'])
                if vital_types_count >= 3:
                    if language == 'ar':
                        insights.append("مراقبة شاملة للعلامات الحيوية - استمر في هذا النهج الجيد")
                    else:
                        insights.append("Comprehensive vital signs monitoring - keep up the good work")
                
                # Check for recent activity
                for vital_type, readings in vitals_data['by_type'].items():
                    if readings:
                        latest_reading = readings[-1]
                        if language == 'ar':
                            insights.append(f"آخر قراءة لـ {vital_type.replace('_', ' ')}: {latest_reading['value']} {latest_reading['unit']}")
                        else:
                            insights.append(f"Latest {vital_type.replace('_', ' ')} reading: {latest_reading['value']} {latest_reading['unit']}")
        
        if prescriptions_data and prescriptions_data.get('items'):
            prescription_count = len(prescriptions_data['items'])
            if prescription_count > 0:
                if language == 'ar':
                    insights.append(f"تم تسجيل {prescription_count} وصفة طبية خلال هذه الفترة")
                else:
                    insights.append(f"Recorded {prescription_count} prescriptions during this period")
        
        # Add general recommendations
        if language == 'ar':
            insights.extend([
                "تأكد من مراقبة العلامات الحيوية بانتظام",
                "احتفظ بسجل دقيق للأدوية والوصفات الطبية",
                "راجع طبيبك بانتظام لمتابعة حالتك الصحية"
            ])
        else:
            insights.extend([
                "Continue monitoring vital signs regularly",
                "Keep accurate records of medications and prescriptions",
                "Schedule regular check-ups with your healthcare provider"
            ])
        
        return insights[:6]  # Limit to 6 insights