/**
 *    constr    asy    constructor() {
        console.log('LocalizationManager constructor called');
        this.currentLanguage = localStorage.getItem('preferred-language') || 'en';
        console.log('Current language:', this.currentLanguage);
        this.translations = {};
        this.init();
    }it() {
        await this.loadTranslations();
        
        // Setup language toggle after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.applyLanguage();
                this.setupLanguageToggle();
            });
        } else {
            // DOM is already ready
            this.applyLanguage();
            this.setupLanguageToggle();
        }
    }    this.currentLanguage = localStorage.getItem('preferred-language') || 'en';
        this.translations = {};
        this.init();
    }lization Module
 * Handles multi-language support for English and Arabic
 */

class LocalizationManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'en';
        this.translations = {};
        this.init();
    }

    async init() {
        console.log('LocalizationManager init called');
        await this.loadTranslations();
        console.log('Translations loaded');
        
        // Setup language toggle after DOM is ready
        if (document.readyState === 'loading') {
            console.log('DOM still loading, waiting for DOMContentLoaded');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOMContentLoaded fired, applying language');
                this.applyLanguage();
                this.setupLanguageToggle();
            });
        } else {
            // DOM is already ready
            console.log('DOM already ready, applying language immediately');
            this.applyLanguage();
            this.setupLanguageToggle();
        }
    }

    async loadTranslations() {
        // English translations
        this.translations.en = {
            // Navigation
            'nav.brand': 'Your Health Guide',
            'nav.services': 'Services',
            'nav.about': 'About',
            'nav.login': 'Login',
            'nav.signup': 'Join Us Now!',
            'nav.signup.mobile': 'Join us!',
            'nav.join': 'Join Us Now!',
            'nav.join.short': 'Join us!',
            'nav.logout': 'Logout',
            'nav.profile': 'Profile',
            'nav.dashboard': 'Dashboard',

            // Sidebar
            'sidebar.dashboard': 'Dashboard',
            'sidebar.prescriptions': 'Prescriptions',
            'sidebar.vitals': 'Vitals Tracking',
            'sidebar.reports': 'Health Reports',
            'sidebar.emergency': 'Emergency',
            'sidebar.settings': 'Settings',

            // Landing Page
            'hero.title': 'Your Health, Our Priority',
            'hero.subtitle': 'Transform your healthcare management with AI-powered prescription scanning, smart vitals tracking, and voice-first interface designed for Egyptian patients.',
            'hero.cta.primary': 'Get Started',
            'hero.cta.secondary': 'Emergency: 911',

            // Stats
            'stats.scanner.title': 'AI Prescription Scanner',
            'stats.scanner.value': '95%',
            'stats.scanner.desc': 'Accuracy rate',
            'stats.vitals.title': 'Smart Vitals Tracking',
            'stats.vitals.value': '24/7',
            'stats.vitals.desc': 'Health monitoring',
            'stats.voice.title': 'Voice Commands',
            'stats.voice.value': 'AR',
            'stats.voice.desc': 'Egyptian Arabic',

            // Dashboard
            'dashboard.welcome': 'Welcome to Your Health Dashboard',
            'dashboard.subtitle': 'Manage your health with AI-powered tools and smart tracking',
            'dashboard.prescriptions': 'Prescriptions',
            'dashboard.prescriptions.desc': 'Total scanned',
            'dashboard.vitals': 'Vitals Logged',
            'dashboard.vitals.desc': 'This month',
            'dashboard.reports': 'Reports',
            'dashboard.reports.desc': 'Generated',
            'dashboard.checkup': 'Next Checkup',
            'dashboard.checkup.date': 'Jan 15',
            'dashboard.checkup.doctor': 'Dr. Ahmed',

            // Quick Actions
            'actions.title': 'Quick Actions',
            'actions.scan': 'Scan Prescription',
            'actions.vitals': 'Log Vitals',
            'actions.report': 'Generate Report',
            'actions.emergency': 'Emergency',

            // Recent Activity
            'activity.title': 'Recent Activity',
            'activity.prescription': 'Prescription Scanned',
            'activity.vitals': 'Vital Signs Logged',
            'activity.empty': 'No recent activity',

            // Authentication
            'auth.welcome': 'Welcome Back',
            'auth.welcome.desc': 'Sign in to access your Health Guide account',
            'auth.join': 'Join Your Health Guide',
            'auth.join.desc': 'Create your account to access intelligent healthcare management',
            'auth.username': 'Username',
            'auth.email': 'Email Address',
            'auth.password': 'Password',
            'auth.password.confirm': 'Confirm Password',
            'auth.firstname': 'First Name',
            'auth.lastname': 'Last Name',
            'auth.phone': 'Phone Number',
            'auth.dob': 'Date of Birth',
            'auth.remember': 'Remember me',
            'auth.forgot': 'Forgot password?',
            'auth.signin': 'Sign In',
            'auth.signup': 'Create Account',
            'auth.have.account': 'Already have an account?',
            'auth.no.account': "Don't have an account?",
            'auth.signin.here': 'Sign in here',
            'auth.signup.here': 'Sign up here',
            // Authentication placeholders
            'auth.username.placeholder': 'Enter your username',
            'auth.email.placeholder': 'Enter your email',
            'auth.password.placeholder': 'Enter your password',
            'auth.password.confirm.placeholder': 'Confirm your password',
            'auth.firstname.placeholder': 'First name',
            'auth.lastname.placeholder': 'Last name',
            'auth.phone.placeholder': 'Enter your phone number',

            // Services
            'services.title': 'Smart Health Services',
            'services.subtitle': 'AI-powered healthcare management designed for Egyptian patients',
            'services.scanner.title': 'AI Prescription Scanner',
            'services.scanner.desc': 'Convert handwritten prescriptions to digital records with 95%+ accuracy using advanced OCR technology.',
            'services.scanner.badge': '95% Accuracy',
            'services.scanner.btn': 'Try Now',
            'services.vitals.title': 'Smart Vitals Tracking',
            'services.vitals.desc': 'Log and visualize your health metrics over time with intelligent insights and trends.',
            'services.vitals.badge': '24/7 Monitoring',
            'services.vitals.btn': 'Start Tracking',
            'services.voice.title': 'Voice Commands',
            'services.voice.desc': 'Egyptian Arabic voice recognition for hands-free health management and accessibility.',
            'services.voice.badge': 'Arabic Support',
            'services.voice.btn': 'Try Voice',
            'services.reports.title': 'Health Reports',
            'services.reports.desc': 'Generate comprehensive PDF reports for doctor visits with your health data and trends.',
            'services.reports.badge': 'PDF Export',
            'services.reports.btn': 'Generate Report',
            'services.emergency.title': 'Emergency SOS',
            'services.emergency.desc': 'One-tap emergency alerts to your contacts with location sharing and medical information.',
            'services.emergency.badge': 'Instant Alert',
            'services.emergency.btn': 'Setup SOS',
            'services.offline.title': 'Offline Support',
            'services.offline.desc': 'Works without internet connection and syncs data when you\'re back online.',
            'services.offline.badge': 'Always Available',
            'services.offline.btn': 'Learn More',
            'services.cta.title': 'Ready to Transform Your Health Management?',
            'services.cta.desc': 'Join thousands of Egyptian patients who trust Your Health Guide for their healthcare needs',
            'services.cta.start': 'Get Started Free',
            'services.cta.demo': 'Try Demo',

            // About
            'about.title': 'About Your Health Guide',
            'about.subtitle': 'Transforming healthcare management in Egypt with AI-powered solutions',
            'about.mission.title': 'Our Mission',
            'about.mission.desc': 'To transform healthcare management in Egypt by providing an intelligent, accessible digital health companion that empowers patients with chronic conditions to take control of their health journey.',
            'about.vision.title': 'Our Vision',
            'about.vision.desc': 'To be the leading healthcare technology platform in the Middle East, making quality healthcare accessible, understandable, and manageable for every Egyptian patient.',
            'about.problem.title': 'The Problem We Solve',
            'about.problem.prescription.title': 'Illegible Prescriptions',
            'about.problem.prescription.desc': '78% of prescriptions in Egypt contain errors due to poor handwriting',
            'about.problem.tracking.title': 'Poor Health Tracking',
            'about.problem.tracking.desc': '62% of patients don\'t consistently track their vital signs',
            'about.problem.visits.title': 'Inefficient Doctor Visits',
            'about.problem.visits.desc': '85% of patients rely on memory during medical consultations',
            'about.problem.digital.title': 'Digital Barriers',
            'about.problem.digital.desc': '65% of elderly patients struggle with complex health apps',
            'about.cta.title': 'Ready to Transform Your Health Management?',
            'about.cta.desc': 'Join thousands of Egyptian patients who trust Your Health Guide for their healthcare needs',
            'about.cta.start': 'Get Started Free',
            'about.cta.services': 'View Services',
            'about.problem.prescriptions.desc': '78% of prescriptions in Egypt contain errors due to poor handwriting',
            'about.problem.tracking': 'Poor Health Tracking',
            'about.problem.tracking.desc': '62% of patients don\'t consistently track their vital signs',
            'about.problem.visits': 'Inefficient Doctor Visits',
            'about.problem.visits.desc': '85% of patients rely on memory during medical consultations',
            'about.problem.barriers': 'Digital Barriers',
            'about.problem.barriers.desc': '65% of elderly patients struggle with complex health apps',

            // Common
            'common.try.now': 'Try Now',
            'common.start.tracking': 'Start Tracking',
            'common.try.voice': 'Try Voice',
            'common.generate.report': 'Generate Report',
            'common.setup.sos': 'Setup SOS',
            'common.learn.more': 'Learn More',
            'common.get.started': 'Get Started Free',
            'common.view.services': 'View Services',
            'common.try.demo': 'Try Demo',
            'common.loading': 'Loading...',
            'common.close': 'Close',
            'common.cancel': 'Cancel',
            'common.save': 'Save',
            'common.submit': 'Submit',

            // Messages
            'msg.connection.restored': 'Connection restored',
            'msg.offline': 'You are now offline',
            'msg.offline.limited': 'You\'re currently offline. Some features may be limited.',
            'msg.emergency.confirm': 'Send emergency alert to your contacts?',
            'msg.emergency.sent': 'Emergency alert sent to your contacts!',
            'msg.emergency.failed': 'Failed to send emergency alert',
            'msg.voice.listening': 'Listening... Speak now',
            'msg.voice.failed': 'Voice recognition failed',
            'msg.voice.not.supported': 'Voice recognition not supported in this browser',
            'msg.command.not.recognized': 'Command not recognized. Try "scan prescription" or "log vitals"',

            // Modals
            'modal.prescription.title': 'Scan Prescription',
            'modal.prescription.doctor': 'Doctor Name',
            'modal.prescription.clinic': 'Clinic Name',
            'modal.prescription.date': 'Prescription Date',
            'modal.prescription.image': 'Prescription Image',
            'modal.prescription.upload': 'Upload & Process',
            'modal.vitals.title': 'Log Vital Signs',
            'modal.vitals.type': 'Vital Type',
            'modal.vitals.value': 'Value',
            'modal.vitals.unit': 'Unit',
            'modal.vitals.datetime': 'Date & Time',
            'modal.vitals.notes': 'Notes (Optional)',
            'modal.vitals.save': 'Save Vital',

            // Vital Types
            'vitals.blood_pressure': 'Blood Pressure',
            'vitals.glucose': 'Blood Glucose',
            'vitals.weight': 'Weight',
            'vitals.heart_rate': 'Heart Rate',
            'vitals.temperature': 'Temperature',

            // Emergency
            'emergency.title': 'Emergency Alert System',
            'emergency.call.title': 'Call 911',
            'emergency.call.desc': 'For immediate life-threatening emergencies',
            'emergency.call.button': 'Call Now',
            'emergency.location.title': 'Share Location',
            'emergency.location.desc': 'Send your current location to emergency contacts',
            'emergency.location.button': 'Share Location'
        };

        // Arabic translations
        this.translations.ar = {
            // Navigation
            'nav.brand': 'دليلك الصحي',
            'nav.services': 'الخدمات',
            'nav.about': 'عن التطبيق',
            'nav.login': 'تسجيل الدخول',
            'nav.signup': 'انضم إلينا الآن!',
            'nav.signup.mobile': 'انضم!',
            'nav.join': 'انضم إلينا الآن!',
            'nav.join.short': 'انضم!',
            'nav.logout': 'تسجيل الخروج',
            'nav.profile': 'الملف الشخصي',
            'nav.dashboard': 'لوحة التحكم',

            // Sidebar
            'sidebar.dashboard': 'لوحة التحكم',
            'sidebar.prescriptions': 'الوصفات الطبية',
            'sidebar.vitals': 'تتبع العلامات الحيوية',
            'sidebar.reports': 'التقارير الصحية',
            'sidebar.emergency': 'الطوارئ',
            'sidebar.settings': 'الإعدادات',

            // Landing Page
            'hero.title': 'صحتك، أولويتنا',
            'hero.subtitle': 'حول إدارة الرعاية الصحية الخاصة بك باستخدام مسح الوصفات الطبية المدعوم بالذكاء الاصطناعي، وتتبع العلامات الحيوية الذكي، وواجهة صوتية مصممة للمرضى المصريين.',
            'hero.cta.primary': 'ابدأ الآن',
            'hero.cta.secondary': 'الطوارئ: 911',

            // Stats
            'stats.scanner.title': 'ماسح الوصفات بالذكاء الاصطناعي',
            'stats.scanner.value': '95%',
            'stats.scanner.desc': 'معدل الدقة',
            'stats.vitals.title': 'تتبع العلامات الحيوية الذكي',
            'stats.vitals.value': '24/7',
            'stats.vitals.desc': 'مراقبة صحية',
            'stats.voice.title': 'الأوامر الصوتية',
            'stats.voice.value': 'عربي',
            'stats.voice.desc': 'العربية المصرية',

            // Dashboard
            'dashboard.welcome': 'مرحباً بك في لوحة التحكم الصحية',
            'dashboard.subtitle': 'أدر صحتك باستخدام أدوات مدعومة بالذكاء الاصطناعي وتتبع ذكي',
            'dashboard.prescriptions': 'الوصفات الطبية',
            'dashboard.prescriptions.desc': 'إجمالي الممسوحة',
            'dashboard.vitals': 'العلامات الحيوية المسجلة',
            'dashboard.vitals.desc': 'هذا الشهر',
            'dashboard.reports': 'التقارير',
            'dashboard.reports.desc': 'المُنشأة',
            'dashboard.checkup': 'الفحص القادم',
            'dashboard.checkup.date': '15 يناير',
            'dashboard.checkup.doctor': 'د. أحمد',

            // Quick Actions
            'actions.title': 'الإجراءات السريعة',
            'actions.scan': 'مسح الوصفة الطبية',
            'actions.vitals': 'تسجيل العلامات الحيوية',
            'actions.report': 'إنشاء تقرير',
            'actions.emergency': 'الطوارئ',

            // Recent Activity
            'activity.title': 'النشاط الأخير',
            'activity.prescription': 'تم مسح الوصفة الطبية',
            'activity.vitals': 'تم تسجيل العلامات الحيوية',
            'activity.empty': 'لا يوجد نشاط حديث',

            // Authentication
            'auth.welcome': 'مرحباً بعودتك',
            'auth.welcome.desc': 'سجل الدخول للوصول إلى حساب دليلك الصحي',
            'auth.join': 'انضم إلى دليلك الصحي',
            'auth.join.desc': 'أنشئ حسابك للوصول إلى إدارة الرعاية الصحية الذكية',
            'auth.username': 'اسم المستخدم',
            'auth.email': 'عنوان البريد الإلكتروني',
            'auth.password': 'كلمة المرور',
            'auth.password.confirm': 'تأكيد كلمة المرور',
            'auth.firstname': 'الاسم الأول',
            'auth.lastname': 'اسم العائلة',
            'auth.phone': 'رقم الهاتف',
            'auth.dob': 'تاريخ الميلاد',
            'auth.remember': 'تذكرني',
            'auth.forgot': 'نسيت كلمة المرور؟',
            'auth.signin': 'تسجيل الدخول',
            'auth.signup': 'إنشاء حساب',
            'auth.have.account': 'لديك حساب بالفعل؟',
            'auth.no.account': 'ليس لديك حساب؟',
            'auth.signin.here': 'سجل الدخول هنا',
            'auth.signup.here': 'سجل هنا',
            // Authentication placeholders
            'auth.username.placeholder': 'أدخل اسم المستخدم',
            'auth.email.placeholder': 'أدخل بريدك الإلكتروني',
            'auth.password.placeholder': 'أدخل كلمة المرور',
            'auth.password.confirm.placeholder': 'تأكيد كلمة المرور',
            'auth.firstname.placeholder': 'الاسم الأول',
            'auth.lastname.placeholder': 'اسم العائلة',
            'auth.phone.placeholder': 'أدخل رقم الهاتف',

            // Services
            'services.title': 'خدمات صحية ذكية',
            'services.subtitle': 'إدارة الرعاية الصحية المدعومة بالذكاء الاصطناعي مصممة للمرضى المصريين',
            'services.scanner.title': 'ماسح الوصفات بالذكاء الاصطناعي',
            'services.scanner.desc': 'حول الوصفات الطبية المكتوبة بخط اليد إلى سجلات رقمية بدقة تزيد عن 95% باستخدام تقنية OCR المتقدمة.',
            'services.scanner.badge': 'دقة 95%',
            'services.scanner.btn': 'جرب الآن',
            'services.vitals.title': 'تتبع العلامات الحيوية الذكي',
            'services.vitals.desc': 'سجل وتصور مقاييسك الصحية بمرور الوقت مع رؤى ذكية وتحليل الاتجاهات.',
            'services.vitals.badge': 'مراقبة 24/7',
            'services.vitals.btn': 'ابدأ التتبع',
            'services.voice.title': 'الأوامر الصوتية',
            'services.voice.desc': 'التعرف على الصوت باللغة العربية المصرية لإدارة الصحة بدون استخدام اليدين وسهولة الوصول.',
            'services.voice.badge': 'دعم العربية',
            'services.voice.btn': 'جرب الصوت',
            'services.reports.title': 'التقارير الصحية',
            'services.reports.desc': 'إنشاء تقارير PDF شاملة لزيارات الطبيب مع بياناتك الصحية والاتجاهات.',
            'services.reports.badge': 'تصدير PDF',
            'services.reports.btn': 'إنشاء تقرير',
            'services.emergency.title': 'نداء الاستغاثة الطارئ',
            'services.emergency.desc': 'تنبيهات طوارئ بنقرة واحدة لجهات الاتصال الخاصة بك مع مشاركة الموقع والمعلومات الطبية.',
            'services.emergency.badge': 'تنبيه فوري',
            'services.emergency.btn': 'إعداد SOS',
            'services.offline.title': 'الدعم دون اتصال',
            'services.offline.desc': 'يعمل بدون اتصال بالإنترنت ويزامن البيانات عند العودة للاتصال.',
            'services.offline.badge': 'متوفر دائماً',
            'services.offline.btn': 'اعرف المزيد',
            'services.cta.title': 'مستعد لتحويل إدارة صحتك؟',
            'services.cta.desc': 'انضم إلى آلاف المرضى المصريين الذين يثقون في دليلك الصحي لاحتياجاتهم الصحية',
            'services.cta.start': 'ابدأ مجاناً',
            'services.cta.demo': 'جرب العرض التوضيحي',

            // About
            'about.title': 'عن دليلك الصحي',
            'about.subtitle': 'تحويل إدارة الرعاية الصحية في مصر بحلول مدعومة بالذكاء الاصطناعي',
            'about.mission.title': 'مهمتنا',
            'about.mission.desc': 'تحويل إدارة الرعاية الصحية في مصر من خلال توفير رفيق صحي رقمي ذكي ومتاح يمكن المرضى الذين يعانون من حالات مزمنة من السيطرة على رحلتهم الصحية.',
            'about.vision.title': 'رؤيتنا',
            'about.vision.desc': 'أن نكون منصة تكنولوجيا الرعاية الصحية الرائدة في الشرق الأوسط، مما يجعل الرعاية الصحية عالية الجودة متاحة ومفهومة وقابلة للإدارة لكل مريض مصري.',
            'about.problem.title': 'المشكلة التي نحلها',
            'about.problem.prescription.title': 'الوصفات غير المقروءة',
            'about.problem.prescription.desc': '78% من الوصفات في مصر تحتوي على أخطاء بسبب سوء الخط',
            'about.problem.tracking.title': 'ضعف تتبع الصحة',
            'about.problem.tracking.desc': '62% من المرضى لا يتتبعون علاماتهم الحيوية باستمرار',
            'about.problem.visits.title': 'زيارات الطبيب غير الفعالة',
            'about.problem.visits.desc': '85% من المرضى يعتمدون على الذاكرة أثناء الاستشارات الطبية',
            'about.problem.digital.title': 'الحواجز الرقمية',
            'about.problem.digital.desc': '65% من كبار السن يواجهون صعوبة في التطبيقات الصحية المعقدة',
            'about.cta.title': 'مستعد لتحويل إدارة صحتك؟',
            'about.cta.desc': 'انضم إلى آلاف المرضى المصريين الذين يثقون في دليلك الصحي لاحتياجاتهم الصحية',
            'about.cta.start': 'ابدأ مجاناً',
            'about.cta.services': 'عرض الخدمات',
            'about.problem.prescriptions.desc': '78% من الوصفات في مصر تحتوي على أخطاء بسبب سوء الخط',
            'about.problem.tracking': 'ضعف تتبع الصحة',
            'about.problem.tracking.desc': '62% من المرضى لا يتتبعون علاماتهم الحيوية باستمرار',
            'about.problem.visits': 'زيارات الطبيب غير الفعالة',
            'about.problem.visits.desc': '85% من المرضى يعتمدون على الذاكرة أثناء الاستشارات الطبية',
            'about.problem.barriers': 'الحواجز الرقمية',
            'about.problem.barriers.desc': '65% من المرضى كبار السن يواجهون صعوبة مع تطبيقات الصحة المعقدة',

            // Common
            'common.try.now': 'جرب الآن',
            'common.start.tracking': 'ابدأ التتبع',
            'common.try.voice': 'جرب الصوت',
            'common.generate.report': 'إنشاء تقرير',
            'common.setup.sos': 'إعداد الطوارئ',
            'common.learn.more': 'اعرف المزيد',
            'common.get.started': 'ابدأ مجاناً',
            'common.view.services': 'عرض الخدمات',
            'common.try.demo': 'جرب العرض التوضيحي',
            'common.loading': 'جاري التحميل...',
            'common.close': 'إغلاق',
            'common.cancel': 'إلغاء',
            'common.save': 'حفظ',
            'common.submit': 'إرسال',

            // Messages
            'msg.connection.restored': 'تم استعادة الاتصال',
            'msg.offline': 'أنت الآن غير متصل',
            'msg.offline.limited': 'أنت حالياً غير متصل. قد تكون بعض الميزات محدودة.',
            'msg.emergency.confirm': 'إرسال تنبيه طوارئ لجهات الاتصال الخاصة بك؟',
            'msg.emergency.sent': 'تم إرسال تنبيه الطوارئ لجهات الاتصال الخاصة بك!',
            'msg.emergency.failed': 'فشل في إرسال تنبيه الطوارئ',
            'msg.voice.listening': 'أستمع... تحدث الآن',
            'msg.voice.failed': 'فشل التعرف على الصوت',
            'msg.voice.not.supported': 'التعرف على الصوت غير مدعوم في هذا المتصفح',
            'msg.command.not.recognized': 'لم يتم التعرف على الأمر. جرب "مسح الوصفة الطبية" أو "تسجيل العلامات الحيوية"',

            // Modals
            'modal.prescription.title': 'مسح الوصفة الطبية',
            'modal.prescription.doctor': 'اسم الطبيب',
            'modal.prescription.clinic': 'اسم العيادة',
            'modal.prescription.date': 'تاريخ الوصفة الطبية',
            'modal.prescription.image': 'صورة الوصفة الطبية',
            'modal.prescription.upload': 'رفع ومعالجة',
            'modal.vitals.title': 'تسجيل العلامات الحيوية',
            'modal.vitals.type': 'نوع العلامة الحيوية',
            'modal.vitals.value': 'القيمة',
            'modal.vitals.unit': 'الوحدة',
            'modal.vitals.datetime': 'التاريخ والوقت',
            'modal.vitals.notes': 'ملاحظات (اختيارية)',
            'modal.vitals.save': 'حفظ العلامة الحيوية',

            // Vital Types
            'vitals.blood_pressure': 'ضغط الدم',
            'vitals.glucose': 'سكر الدم',
            'vitals.weight': 'الوزن',
            'vitals.heart_rate': 'معدل ضربات القلب',
            'vitals.temperature': 'درجة الحرارة',

            // Emergency
            'emergency.title': 'نظام تنبيه الطوارئ',
            'emergency.call.title': 'اتصل بـ 911',
            'emergency.call.desc': 'للطوارئ المهددة للحياة فوراً',
            'emergency.call.button': 'اتصل الآن',
            'emergency.location.title': 'مشاركة الموقع',
            'emergency.location.desc': 'أرسل موقعك الحالي لجهات الاتصال في حالات الطوارئ',
            'emergency.location.button': 'مشاركة الموقع'
        };
    }

    // Get translation for a key
    t(key, fallback = key) {
        const translation = this.translations[this.currentLanguage]?.[key];
        return translation || fallback;
    }

    // Set language
    setLanguage(lang) {
        if (this.translations[lang] && lang !== this.currentLanguage) {
            console.log('Setting language to:', lang);
            this.currentLanguage = lang;
            localStorage.setItem('preferred-language', lang);
            this.applyLanguage();
            
            // Update language toggle without re-setting up event listeners
            this.updateLanguageToggle();
        }
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Apply language to all elements with data-i18n attribute
    applyLanguage() {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            // Handle different element types
            if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'email' || element.type === 'password' || element.type === 'tel')) {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else if (element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Apply language direction and font
        this.applyLanguageStyles();

        // Update language toggle button
        this.updateLanguageToggle();
    }

    // Apply language-specific styles
    applyLanguageStyles() {
        const htmlElement = document.documentElement;
        const bodyElement = document.body;
        
        if (this.currentLanguage === 'ar') {
            // Apply Arabic styles
            htmlElement.setAttribute('dir', 'rtl');
            htmlElement.setAttribute('lang', 'ar');
            bodyElement.style.fontFamily = "'Cairo', sans-serif";
            bodyElement.classList.add('text-arabic');
            
            // Update navbar direction for Arabic
            const navbars = document.querySelectorAll('.navbar');
            navbars.forEach(navbar => {
                navbar.style.direction = 'rtl';
            });
        } else {
            // Apply English styles
            htmlElement.setAttribute('dir', 'ltr');
            htmlElement.setAttribute('lang', 'en');
            bodyElement.style.fontFamily = '';
            bodyElement.classList.remove('text-arabic');
            
            // Update navbar direction for English
            const navbars = document.querySelectorAll('.navbar');
            navbars.forEach(navbar => {
                navbar.style.direction = 'ltr';
            });
        }
    }

    // Setup language toggle functionality
    setupLanguageToggle() {
        // Find existing language toggle or create one
        let langToggle = document.getElementById('language-toggle');
        
        if (!langToggle) {
            console.log('Language toggle not found, creating one...');
            langToggle = this.createLanguageToggle();
        }

        if (!langToggle) {
            console.warn('Could not find or create language toggle');
            return;
        }

        // Remove existing event listeners by cloning the element
        const newToggle = langToggle.cloneNode(true);
        if (langToggle.parentNode) {
            langToggle.parentNode.replaceChild(newToggle, langToggle);
        }
        
        // Add event listener to the new toggle
        newToggle.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Language toggle clicked, current language:', this.currentLanguage);
            const newLang = this.currentLanguage === 'en' ? 'ar' : 'en';
            this.setLanguage(newLang);
            console.log('Language changed to:', newLang);
        });

        // Update the button text
        this.updateLanguageToggle();
    }

    // Create language toggle button
    createLanguageToggle() {
        const langToggle = document.createElement('button');
        langToggle.id = 'language-toggle';
        langToggle.className = 'btn btn-ghost btn-circle';
        langToggle.innerHTML = this.currentLanguage === 'en' ? 'عربي' : 'EN';
        langToggle.setAttribute('title', this.currentLanguage === 'en' ? 'Switch to Arabic' : 'Switch to English');
        
        // Insert before theme toggle
        const themeToggle = document.querySelector('.theme-controller')?.closest('label');
        if (themeToggle) {
            themeToggle.parentNode.insertBefore(langToggle, themeToggle);
        } else {
            // Fallback: add to navbar end
            const navbarEnd = document.querySelector('.navbar-end');
            if (navbarEnd) {
                navbarEnd.insertBefore(langToggle, navbarEnd.firstChild);
            }
        }

        return langToggle;
    }

    // Update language toggle button text
    updateLanguageToggle() {
        const langToggle = document.getElementById('language-toggle');
        if (langToggle) {
            langToggle.innerHTML = this.currentLanguage === 'en' ? 'عربي' : 'EN';
            langToggle.setAttribute('title', this.currentLanguage === 'en' ? 'Switch to Arabic' : 'Switch to English');
        }
    }
}

// Global localization manager instance
console.log('Creating global localization manager...');
window.i18n = new LocalizationManager();

// Global translation function
window.t = (key, fallback) => window.i18n.t(key, fallback);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalizationManager;
}