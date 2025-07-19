/**
 * AI Health Insights Service
 * Provides placeholder AI functionality for health analysis and recommendations
 */

class AIHealthInsights {
    constructor() {
        this.insights = [];
        this.medicationInteractions = [];
        this.healthGoals = [];
        this.personalizedTips = [];
        this.reportSummaries = new Map();
        this.trendAnalysis = new Map();
        
        // Initialize with mock data
        this.initializeMockData();
    }

    /**
     * Initialize mock AI data for demonstration
     */
    initializeMockData() {
        // Mock medication interaction database
        this.medicationDatabase = {
            'amoxicillin': {
                interactions: ['warfarin', 'methotrexate'],
                warnings: ['May reduce effectiveness of oral contraceptives', 'Take with food to reduce stomach upset'],
                category: 'antibiotic'
            },
            'metformin': {
                interactions: ['alcohol', 'contrast_dye'],
                warnings: ['Monitor kidney function regularly', 'May cause vitamin B12 deficiency'],
                category: 'diabetes'
            },
            'lisinopril': {
                interactions: ['potassium_supplements', 'nsaids'],
                warnings: ['Monitor blood pressure regularly', 'Avoid potassium-rich foods'],
                category: 'blood_pressure'
            },
            'atorvastatin': {
                interactions: ['grapefruit', 'warfarin'],
                warnings: ['Monitor liver function', 'Report muscle pain immediately'],
                category: 'cholesterol'
            }
        };

        // Mock health conditions for personalized tips
        this.healthConditions = [
            'diabetes', 'hypertension', 'high_cholesterol', 'heart_disease', 'arthritis'
        ];
    }

    /**
     * Analyze health trends from vitals data
     * @param {Array} vitalsData - Array of vital readings
     * @returns {Object} Trend analysis with insights
     */
    async analyzeHealthTrends(vitalsData = []) {
        // Simulate AI processing delay
        await this.simulateProcessingDelay(1000, 2000);

        if (!vitalsData || vitalsData.length === 0) {
            return this.generateMockTrendAnalysis();
        }

        const analysis = {
            trends: [],
            alerts: [],
            recommendations: [],
            confidence: 0.85,
            lastAnalyzed: new Date().toISOString()
        };

        // Analyze blood pressure trends
        const bpReadings = vitalsData.filter(v => v.vital_type === 'blood_pressure');
        if (bpReadings.length > 0) {
            analysis.trends.push(this.analyzeBPTrend(bpReadings));
        }

        // Analyze weight trends
        const weightReadings = vitalsData.filter(v => v.vital_type === 'weight');
        if (weightReadings.length > 0) {
            analysis.trends.push(this.analyzeWeightTrend(weightReadings));
        }

        // Analyze heart rate trends
        const hrReadings = vitalsData.filter(v => v.vital_type === 'heart_rate');
        if (hrReadings.length > 0) {
            analysis.trends.push(this.analyzeHeartRateTrend(hrReadings));
        }

        // Generate recommendations based on trends
        analysis.recommendations = this.generateTrendRecommendations(analysis.trends);

        // Cache analysis
        this.trendAnalysis.set('latest', analysis);

        return analysis;
    }

    /**
     * Generate mock trend analysis when no data is available
     */
    generateMockTrendAnalysis() {
        return {
            trends: [
                {
                    type: 'blood_pressure',
                    direction: 'stable',
                    change: 0.02,
                    insight: 'Your blood pressure has remained stable over the past month. This is a positive sign of good cardiovascular health.',
                    confidence: 0.88
                },
                {
                    type: 'weight',
                    direction: 'decreasing',
                    change: -0.05,
                    insight: 'You\'ve shown a gradual weight decrease of 2.3kg over the past 6 weeks. This steady progress indicates your health plan is working well.',
                    confidence: 0.92
                },
                {
                    type: 'heart_rate',
                    direction: 'improving',
                    change: -0.08,
                    insight: 'Your resting heart rate has improved by 8% this month, suggesting better cardiovascular fitness.',
                    confidence: 0.85
                }
            ],
            alerts: [
                {
                    type: 'reminder',
                    priority: 'medium',
                    message: 'Consider logging your blood sugar levels more regularly for better diabetes management.',
                    actionable: true
                }
            ],
            recommendations: [
                'Continue your current exercise routine - it\'s showing positive results',
                'Consider adding 30 minutes of walking after meals to help with blood sugar control',
                'Your medication adherence is excellent - keep up the good work'
            ],
            confidence: 0.87,
            lastAnalyzed: new Date().toISOString()
        };
    }

    /**
     * Analyze blood pressure trend
     */
    analyzeBPTrend(readings) {
        const recent = readings.slice(-5);
        const systolic = recent.map(r => parseInt(r.value.split('/')[0]));
        const trend = this.calculateTrend(systolic);

        return {
            type: 'blood_pressure',
            direction: trend > 0.05 ? 'increasing' : trend < -0.05 ? 'decreasing' : 'stable',
            change: trend,
            insight: this.generateBPInsight(trend, systolic),
            confidence: 0.85 + Math.random() * 0.1
        };
    }

    /**
     * Analyze weight trend
     */
    analyzeWeightTrend(readings) {
        const recent = readings.slice(-10);
        const weights = recent.map(r => parseFloat(r.value));
        const trend = this.calculateTrend(weights);

        return {
            type: 'weight',
            direction: trend > 0.02 ? 'increasing' : trend < -0.02 ? 'decreasing' : 'stable',
            change: trend,
            insight: this.generateWeightInsight(trend, weights),
            confidence: 0.90 + Math.random() * 0.08
        };
    }

    /**
     * Analyze heart rate trend
     */
    analyzeHeartRateTrend(readings) {
        const recent = readings.slice(-7);
        const heartRates = recent.map(r => parseInt(r.value));
        const trend = this.calculateTrend(heartRates);

        return {
            type: 'heart_rate',
            direction: trend > 0.05 ? 'increasing' : trend < -0.05 ? 'improving' : 'stable',
            change: trend,
            insight: this.generateHeartRateInsight(trend, heartRates),
            confidence: 0.82 + Math.random() * 0.12
        };
    }

    /**
     * Calculate trend from array of numbers
     */
    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const first = values[0];
        const last = values[values.length - 1];
        return (last - first) / first;
    }

    /**
     * Generate blood pressure insights
     */
    generateBPInsight(trend, values) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        
        if (trend > 0.05) {
            return `Your blood pressure has increased by ${(trend * 100).toFixed(1)}% recently. Consider reducing sodium intake and increasing physical activity.`;
        } else if (trend < -0.05) {
            return `Great news! Your blood pressure has decreased by ${Math.abs(trend * 100).toFixed(1)}%. Your current health plan is working well.`;
        } else {
            return `Your blood pressure remains stable at an average of ${avg.toFixed(0)} mmHg systolic. Continue your current routine.`;
        }
    }

    /**
     * Generate weight insights
     */
    generateWeightInsight(trend, values) {
        const avgWeight = values.reduce((a, b) => a + b, 0) / values.length;
        
        if (trend > 0.02) {
            return `You've gained ${(trend * avgWeight).toFixed(1)}kg recently. Consider reviewing your diet and exercise routine.`;
        } else if (trend < -0.02) {
            return `Excellent progress! You've lost ${Math.abs(trend * avgWeight).toFixed(1)}kg. Keep up the healthy lifestyle changes.`;
        } else {
            return `Your weight remains stable at ${avgWeight.toFixed(1)}kg. This consistency shows good health management.`;
        }
    }

    /**
     * Generate heart rate insights
     */
    generateHeartRateInsight(trend, values) {
        const avgHR = values.reduce((a, b) => a + b, 0) / values.length;
        
        if (trend < -0.05) {
            return `Your resting heart rate has improved by ${Math.abs(trend * 100).toFixed(1)}%, indicating better cardiovascular fitness.`;
        } else if (trend > 0.05) {
            return `Your heart rate has increased by ${(trend * 100).toFixed(1)}%. Consider stress management and regular exercise.`;
        } else {
            return `Your heart rate remains stable at ${avgHR.toFixed(0)} bpm, which is within a healthy range.`;
        }
    }

    /**
     * Check for medication interactions
     * @param {Array} medications - List of current medications
     * @returns {Array} Array of interaction warnings
     */
    async checkMedicationInteractions(medications = []) {
        await this.simulateProcessingDelay(800, 1500);

        const interactions = [];
        const medicationNames = medications.map(med => 
            med.name ? med.name.toLowerCase() : med.toLowerCase()
        );

        // Check each medication against others
        for (let i = 0; i < medicationNames.length; i++) {
            const med1 = medicationNames[i];
            const med1Data = this.medicationDatabase[med1];
            
            if (!med1Data) continue;

            // Check for interactions with other medications
            for (let j = i + 1; j < medicationNames.length; j++) {
                const med2 = medicationNames[j];
                
                if (med1Data.interactions.includes(med2)) {
                    interactions.push({
                        type: 'drug_interaction',
                        severity: 'moderate',
                        medications: [med1, med2],
                        warning: `${med1} may interact with ${med2}. Monitor for side effects and consult your doctor.`,
                        recommendation: 'Take medications at different times of day if possible',
                        confidence: 0.85
                    });
                }
            }

            // Add general warnings for this medication
            med1Data.warnings.forEach(warning => {
                interactions.push({
                    type: 'medication_warning',
                    severity: 'low',
                    medication: med1,
                    warning: warning,
                    recommendation: 'Follow medication instructions carefully',
                    confidence: 0.90
                });
            });
        }

        // Add mock interactions if no real ones found
        if (interactions.length === 0 && medications.length > 0) {
            interactions.push({
                type: 'general_advice',
                severity: 'info',
                warning: 'No significant interactions detected with your current medications.',
                recommendation: 'Continue taking medications as prescribed and inform your doctor of any new medications.',
                confidence: 0.95
            });
        }

        return interactions;
    }

    /**
     * Generate health goal recommendations based on vitals
     * @param {Array} vitalsData - Recent vitals data
     * @param {Object} userProfile - User profile information
     * @returns {Array} Array of health goal recommendations
     */
    async generateHealthGoals(vitalsData = [], userProfile = {}) {
        await this.simulateProcessingDelay(1200, 2000);

        const goals = [];
        const age = userProfile.age || 35;
        const conditions = userProfile.conditions || [];

        // Weight management goals
        const weightReadings = vitalsData.filter(v => v.vital_type === 'weight');
        if (weightReadings.length > 0) {
            const currentWeight = parseFloat(weightReadings[weightReadings.length - 1].value);
            const targetWeight = this.calculateTargetWeight(currentWeight, userProfile);
            
            goals.push({
                type: 'weight_management',
                title: 'Achieve Healthy Weight',
                current: `${currentWeight}kg`,
                target: `${targetWeight}kg`,
                timeframe: '3 months',
                steps: [
                    'Maintain a balanced diet with portion control',
                    'Exercise for 30 minutes, 5 days a week',
                    'Track your weight weekly',
                    'Stay hydrated with 8 glasses of water daily'
                ],
                priority: 'high',
                confidence: 0.88
            });
        }

        // Blood pressure goals
        const bpReadings = vitalsData.filter(v => v.vital_type === 'blood_pressure');
        if (bpReadings.length > 0) {
            const lastBP = bpReadings[bpReadings.length - 1].value;
            const [systolic] = lastBP.split('/').map(Number);
            
            if (systolic > 130) {
                goals.push({
                    type: 'blood_pressure',
                    title: 'Lower Blood Pressure',
                    current: lastBP,
                    target: '<120/80 mmHg',
                    timeframe: '2 months',
                    steps: [
                        'Reduce sodium intake to less than 2300mg daily',
                        'Increase potassium-rich foods (bananas, spinach)',
                        'Practice stress reduction techniques',
                        'Take prescribed medications consistently'
                    ],
                    priority: 'high',
                    confidence: 0.92
                });
            }
        }

        // Activity goals based on age and conditions
        goals.push({
            type: 'physical_activity',
            title: 'Increase Physical Activity',
            current: 'Moderate activity',
            target: '150 minutes/week moderate exercise',
            timeframe: '1 month',
            steps: [
                'Start with 10-minute walks after meals',
                'Gradually increase to 30-minute sessions',
                'Include strength training twice a week',
                'Track your progress with a fitness app'
            ],
            priority: 'medium',
            confidence: 0.85
        });

        // Medication adherence goals
        if (conditions.length > 0) {
            goals.push({
                type: 'medication_adherence',
                title: 'Improve Medication Adherence',
                current: '85% adherence',
                target: '95% adherence',
                timeframe: '1 month',
                steps: [
                    'Set daily medication reminders',
                    'Use a pill organizer',
                    'Track medications in the app',
                    'Discuss any side effects with your doctor'
                ],
                priority: 'high',
                confidence: 0.90
            });
        }

        return goals;
    }

    /**
     * Calculate target weight based on user profile
     */
    calculateTargetWeight(currentWeight, profile) {
        const height = profile.height || 170; // cm
        const bmi = currentWeight / Math.pow(height / 100, 2);
        
        if (bmi > 25) {
            // Target BMI of 23
            return Math.round((23 * Math.pow(height / 100, 2)) * 10) / 10;
        } else if (bmi < 18.5) {
            // Target BMI of 20
            return Math.round((20 * Math.pow(height / 100, 2)) * 10) / 10;
        }
        
        return currentWeight; // Already in healthy range
    }

    /**
     * Generate personalized health tips
     * @param {Object} userProfile - User profile and health data
     * @returns {Array} Array of personalized health tips
     */
    async generatePersonalizedTips(userProfile = {}) {
        await this.simulateProcessingDelay(500, 1000);

        const tips = [];
        const age = userProfile.age || 35;
        const conditions = userProfile.conditions || [];
        const medications = userProfile.medications || [];

        // Age-based tips
        if (age > 50) {
            tips.push({
                category: 'preventive_care',
                title: 'Regular Health Screenings',
                tip: 'Schedule annual health checkups including blood pressure, cholesterol, and diabetes screening.',
                priority: 'high',
                frequency: 'yearly'
            });
        }

        // Condition-specific tips
        if (conditions.includes('diabetes')) {
            tips.push({
                category: 'diabetes_management',
                title: 'Blood Sugar Monitoring',
                tip: 'Check your blood sugar levels at the same times each day and log them in the app for better tracking.',
                priority: 'high',
                frequency: 'daily'
            });
        }

        if (conditions.includes('hypertension')) {
            tips.push({
                category: 'blood_pressure',
                title: 'DASH Diet Benefits',
                tip: 'Follow the DASH diet rich in fruits, vegetables, and low-fat dairy to help lower blood pressure naturally.',
                priority: 'medium',
                frequency: 'ongoing'
            });
        }

        // General wellness tips
        tips.push({
            category: 'nutrition',
            title: 'Hydration Reminder',
            tip: 'Drink water before you feel thirsty. Aim for 8 glasses daily, more if you exercise or live in a hot climate.',
            priority: 'medium',
            frequency: 'daily'
        });

        tips.push({
            category: 'mental_health',
            title: 'Stress Management',
            tip: 'Practice deep breathing for 5 minutes daily. It can help reduce stress and lower blood pressure.',
            priority: 'medium',
            frequency: 'daily'
        });

        tips.push({
            category: 'sleep',
            title: 'Sleep Hygiene',
            tip: 'Maintain a consistent sleep schedule. Go to bed and wake up at the same time every day, even on weekends.',
            priority: 'medium',
            frequency: 'daily'
        });

        // Medication-related tips
        if (medications.length > 0) {
            tips.push({
                category: 'medication',
                title: 'Medication Timing',
                tip: 'Take medications at the same time each day to maintain consistent levels in your body.',
                priority: 'high',
                frequency: 'daily'
            });
        }

        return tips;
    }

    /**
     * Generate AI-powered report summaries
     * @param {Object} reportData - Health report data
     * @returns {Object} Report summary with highlights
     */
    async generateReportSummary(reportData = {}) {
        await this.simulateProcessingDelay(1500, 2500);

        const summary = {
            overview: '',
            keyFindings: [],
            recommendations: [],
            riskFactors: [],
            positiveIndicators: [],
            nextSteps: [],
            confidence: 0.87,
            generatedAt: new Date().toISOString()
        };

        // Generate overview based on report type
        if (reportData.type === 'comprehensive') {
            summary.overview = 'Your comprehensive health report shows overall positive trends with some areas for improvement. Your medication adherence is excellent, and vital signs are mostly within normal ranges.';
        } else if (reportData.type === 'vitals_summary') {
            summary.overview = 'Your vital signs over the past month show stable patterns with gradual improvements in cardiovascular health indicators.';
        } else {
            summary.overview = 'This health report provides insights into your recent health data and medication management.';
        }

        // Key findings
        summary.keyFindings = [
            'Blood pressure has remained stable over the past 30 days',
            'Weight shows a gradual downward trend (-2.1kg over 6 weeks)',
            'Medication adherence rate is 94% - excellent compliance',
            'Heart rate variability indicates good cardiovascular fitness'
        ];

        // Recommendations
        summary.recommendations = [
            'Continue current exercise routine - showing positive results',
            'Consider increasing fiber intake to 25-30g daily',
            'Schedule follow-up appointment in 3 months',
            'Monitor blood sugar levels more frequently if diabetic'
        ];

        // Risk factors
        summary.riskFactors = [
            {
                factor: 'Family history of heart disease',
                level: 'moderate',
                mitigation: 'Regular cardiovascular screening recommended'
            },
            {
                factor: 'Sedentary lifestyle periods',
                level: 'low',
                mitigation: 'Set hourly movement reminders'
            }
        ];

        // Positive indicators
        summary.positiveIndicators = [
            'Consistent medication adherence',
            'Regular vital signs monitoring',
            'Stable weight management',
            'Good sleep pattern consistency'
        ];

        // Next steps
        summary.nextSteps = [
            'Continue logging vitals daily',
            'Maintain current medication schedule',
            'Increase physical activity by 15 minutes weekly',
            'Schedule routine lab work in 2 months'
        ];

        // Cache summary
        this.reportSummaries.set(reportData.id || 'latest', summary);

        return summary;
    }

    /**
     * Get cached trend analysis
     */
    getCachedTrendAnalysis(key = 'latest') {
        return this.trendAnalysis.get(key);
    }

    /**
     * Get cached report summary
     */
    getCachedReportSummary(reportId) {
        return this.reportSummaries.get(reportId);
    }

    /**
     * Generate trend recommendations based on analysis
     */
    generateTrendRecommendations(trends) {
        const recommendations = [];

        trends.forEach(trend => {
            switch (trend.type) {
                case 'blood_pressure':
                    if (trend.direction === 'increasing') {
                        recommendations.push('Consider reducing sodium intake and increasing physical activity');
                    } else if (trend.direction === 'decreasing') {
                        recommendations.push('Great progress! Continue your current blood pressure management plan');
                    }
                    break;
                    
                case 'weight':
                    if (trend.direction === 'increasing') {
                        recommendations.push('Review your diet and consider increasing physical activity');
                    } else if (trend.direction === 'decreasing') {
                        recommendations.push('Excellent weight management! Maintain your current healthy habits');
                    }
                    break;
                    
                case 'heart_rate':
                    if (trend.direction === 'improving') {
                        recommendations.push('Your cardiovascular fitness is improving - keep up the exercise routine');
                    }
                    break;
            }
        });

        // Add general recommendations if none specific
        if (recommendations.length === 0) {
            recommendations.push('Continue monitoring your health metrics regularly');
            recommendations.push('Maintain a balanced diet and regular exercise routine');
        }

        return recommendations;
    }

    /**
     * Simulate AI processing delay for realistic UX
     */
    async simulateProcessingDelay(minMs = 500, maxMs = 1500) {
        const delay = Math.random() * (maxMs - minMs) + minMs;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Get all available insights for dashboard display
     */
    async getAllInsights(userData = {}) {
        const insights = {
            trends: await this.analyzeHealthTrends(userData.vitals),
            interactions: await this.checkMedicationInteractions(userData.medications),
            goals: await this.generateHealthGoals(userData.vitals, userData.profile),
            tips: await this.generatePersonalizedTips(userData.profile),
            lastUpdated: new Date().toISOString()
        };

        return insights;
    }
}

// Create global instance
const aiInsights = new AIHealthInsights();

// Export for use in other modules
export { AIHealthInsights, aiInsights };

// Global access
window.aiInsights = aiInsights;