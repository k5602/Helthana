"use client"

import { createContext, useContext, useState, useEffect } from "react"

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

// Translation data
const translations = {
  en: {
    // Navigation
    "nav.brand": "Your Health Guide",
    "nav.services": "Services",
    "nav.about": "About",
    "nav.login": "Login",
    "nav.signup": "Join Us Now!",
    "nav.signup.mobile": "Join us!",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profile",
    "nav.logout": "Logout",

    // Hero/home
    "hero.title": "Your Health, Our Priority",
    "hero.subtitle":
      "Transform your healthcare management with AI-powered prescription scanning, smart vitals tracking, and voice-first interface designed for Egyptian patients.",
    "hero.cta.primary": "Get Started",
    "hero.cta.secondary": "Emergency: 911",
    "stats.scanner.title": "AI Prescription Scanner",
    "stats.scanner.value": "95%",
    "stats.scanner.desc": "Accuracy rate",
    "stats.vitals.title": "Smart Vitals Tracking",
    "stats.vitals.value": "24/7",
    "stats.vitals.desc": "Health monitoring",
    "stats.voice.title": "Voice Commands",
    "stats.voice.value": "AR",
    "stats.voice.desc": "Egyptian Arabic",

    // Common
    "common.refresh": "Refresh",
    "common.close": "Close",
  "common.save": "Save",
  "common.cancel": "Cancel",

    // Voice
    "voice.startListening": "Start voice commands",
    "voice.stopListening": "Stop voice commands",

    // Messages
    "msg.connection.restored": "Connection restored",
    "msg.offline": "You are offline",
    "msg.emergency.confirm": "Send emergency alert to your contacts?",
    "msg.emergency.sent": "Emergency alert sent to your contacts!",
    "msg.emergency.failed": "Failed to send emergency alert",

    // Auth - Labels & CTAs
    "auth.join": "Join Your Health Guide",
    "auth.join.desc": "Create your account to access intelligent healthcare management",
    "auth.firstname": "First Name",
    "auth.lastname": "Last Name",
    "auth.username": "Username",
    "auth.email": "Email Address",
    "auth.phone": "Phone Number",
    "auth.dob": "Date of Birth",
    "auth.password": "Password",
    "auth.password.confirm": "Confirm Password",
    "auth.terms": "I agree to the Terms of Service and Privacy Policy",
    "auth.signup": "Create Account",
    "auth.have.account": "Already have an account?",
    "auth.signin.here": "Sign in here",
    "auth.welcome": "Welcome Back",
    "auth.welcome.desc": "Sign in to access your Health Guide account",
    "auth.remember": "Remember me",
    "auth.forgot": "Forgot password?",
    "auth.signin": "Sign In",
    "auth.no.account": "Don't have an account?",
    "auth.signup.here": "Sign up here",
    "auth.show": "Show",
    "auth.hide": "Hide",
    "auth.creatingAccount": "Creating Account...",
    "auth.signingIn": "Signing In...",

  // Auth - Password hints
  "auth.password.hint.title": "Password must contain:",
  "auth.password.hint.8chars": "At least 8 characters",
  "auth.password.hint.upper": "One uppercase letter (A-Z)",
  "auth.password.hint.lower": "One lowercase letter (a-z)",
  "auth.password.hint.number": "One number (0-9)",
  "auth.password.hint.special": "One special character",
  "auth.password.hint.common": "No common patterns (123456, password, qwerty, etc.)",
  "auth.password.hint.sequential": "No sequential characters (abc, 123, etc.)",

    // Auth - Placeholders
    "auth.placeholder.first": "First name",
    "auth.placeholder.last": "Last name",
    "auth.placeholder.username": "Enter your username",
    "auth.placeholder.email": "Enter your email",
    "auth.placeholder.phone": "Enter your phone number",
    "auth.placeholder.dob": "Select your date of birth",
    "auth.placeholder.password": "Enter your password",
    "auth.placeholder.password.create": "Create a password",
    "auth.placeholder.password.confirm": "Confirm your password",
    "auth.placeholder.resetEmail": "Enter your email address",

    // Auth - Toasts/Errors
    "auth.error.first.required": "First name is required",
    "auth.error.last.required": "Last name is required",
    "auth.error.username.required": "Username is required",
    "auth.error.username.min": "Username must be at least 3 characters long",
    "auth.error.email.required": "Email is required",
    "auth.error.email.invalid": "Please enter a valid email address",
    "auth.error.password.required": "Password is required",
    "auth.error.password.min": "Password must be at least 8 characters long",
    "auth.error.password.complex":
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    "auth.error.password.common": "Password contains common patterns that are not secure",
    "auth.error.password.sequential": "Password should not contain sequential characters",
    "auth.error.password.mismatch": "Passwords don't match",
    "auth.error.terms": "You must agree to the Terms of Service and Privacy Policy",
    "auth.success.register.redirect": "Account created successfully! Redirecting...",
    "auth.success.register.verify":
      "Account created successfully! Please check your email to verify your account before logging in.",
    "auth.error.register.generic": "Registration failed. Please try again.",
    "auth.error.verifyEmail": "Email verification failed",
    "auth.success.login.redirect": "Login successful! Redirecting...",
    "auth.warning.verifyEmail": "Please verify your email address to access all features.",
    "auth.error.login.generic": "Login failed. Please try again.",
    "auth.error.reset.invalidEmail": "Please enter a valid email address",
    "auth.error.reset.generic": "Failed to send reset email. Please try again.",
    "auth.reset.title": "Reset Password",
    "auth.reset.cancel": "Cancel",
    "auth.reset.send": "Send Reset Link",

  // PWA
  "pwa.updatePrompt": "New version available! Refresh to update?",

    // Vitals
    "vitals.title": "Health Vitals",
    "vitals.subtitle": "Track your health metrics and trends",
    "vitals.log.title": "Quick Log",
    "vitals.add.detailed": "Add Detailed Entry",
    "vitals.blood_pressure": "Blood Pressure",
    "vitals.heart_rate": "Heart Rate",
    "vitals.temperature": "Temperature",
    "vitals.weight": "Weight",
    "vitals.bloodSugar": "Blood Sugar",
    "vitals.notes": "Notes",
    "vitals.placeholder.notes": "Any notes about your health",
    "vitals.log.save": "Save Entry",
    "vitals.trends.title": "Trends",
    "vitals.chart.type": "Vital Type",
    "vitals.chart.period": "Period",
    "vitals.period.week": "Last 7 days",
    "vitals.period.month": "Last 30 days",
    "vitals.period.quarter": "Last 90 days",
    "vitals.period.year": "Last year",
    "vitals.recent.title": "Recent Entries",
    "vitals.empty.title": "No Vitals Yet",
    "vitals.empty.desc": "Start tracking your vitals to see trends over time.",
    "vitals.addFirst": "Add your first vital",
    "vitals.editFeature.comingSoon": "Edit feature coming soon",
    "vitals.loadError": "Failed to load vitals",
    "vitals.trendsError": "Failed to load trends",
    "vitals.noDataEntered": "No data entered",
    "vitals.quickSaveSuccess": "Quick save successful",
    "vitals.saveError": "Failed to save entry",
    "vitals.addSuccess": "Vital added successfully",
    "vitals.addError": "Failed to add vital",
    "vitals.confirmDelete": "Delete this entry?",
    "vitals.deleteSuccess": "Entry deleted",
    "vitals.deleteError": "Failed to delete entry",
    "vitals.noDataToExport": "No data to export",
    "vitals.exportSuccess": "Exported successfully",
    "vitals.noChartData": "No data available for selected period",
    "vitals.chart.trend": "trend",
    "vitals.export": "Export",
    "vitals.stats.average": "Average",
    "vitals.stats.highest": "Highest",
    "vitals.stats.lowest": "Lowest",
    "vitals.stats.readings": "Readings",
  "vitals.requiredFields": "Please fill all required fields",
  "vitals.invalidValue": "Invalid value. Please check your input.",

    // Prescriptions
    "prescriptions.title": "Prescriptions",
    "prescriptions.subtitle": "Scan and manage your prescriptions",
    "prescriptions.scan.new": "Scan New",
    "prescriptions.manualEntry.comingSoon": "Manual entry coming soon",
    "prescriptions.add.manual": "Add Manually",
    "prescriptions.empty.title": "No Prescriptions Yet",
    "prescriptions.empty.desc": "Scan or add a prescription to get started.",
    "prescriptions.scan.first": "Scan your first prescription",
    "prescriptions.editFeature.comingSoon": "Edit feature coming soon",
    "prescriptions.viewFeature.comingSoon": "View feature coming soon",
    "prescriptions.loadError": "Failed to load prescriptions",
    "prescriptions.scanSuccess": "Scanned successfully",
    "prescriptions.scanError": "Scan failed",
    "prescriptions.confirmDelete": "Delete this prescription?",
    "prescriptions.deleteSuccess": "Deleted successfully",
    "prescriptions.deleteError": "Failed to delete",

    // Dashboard
    "dashboard.welcome": "Welcome to Your Health Dashboard",
    "dashboard.subtitle": "Manage your health with AI-powered tools and smart tracking",
    "dashboard.prescriptions": "Prescriptions",
    "dashboard.prescriptions.desc": "Total scanned",
    "dashboard.vitals": "Vitals Logged",
    "dashboard.vitals.desc": "This month",
    "dashboard.reports": "Reports",
    "dashboard.reports.desc": "Generated",
    "dashboard.checkup": "Next Checkup",
    "dashboard.checkup.date": "Jan 15",
    "dashboard.checkup.doctor": "Dr. Ahmed",
    "actions.title": "Quick Actions",
    "actions.scan": "Scan Prescription",
    "actions.vitals": "Log Vitals",
    "actions.report": "Generate Report",
    "actions.emergency": "Emergency",
    "activity.title": "Recent Activity",

    // Emergency
    "emergency.alert": "Emergency",
    "emergency.title": "Emergency Center",
    "emergency.call.title": "Call Emergency",
    "emergency.call.desc": "Contact emergency services for immediate help.",
    "emergency.call.button": "Call Now",
    "emergency.location.title": "Share Location",
    "emergency.location.desc": "Share your current location with trusted contacts.",
    "emergency.location.button": "Copy Location",
    "emergency.contacts.title": "Emergency Contacts",
    "emergency.contacts.empty": "No emergency contacts added yet.",
    "emergency.contacts.call": "Call",
    "emergency.contacts.add": "Add Contact",
    "emergency.medical.title": "Medical Alert",
    "emergency.medical.desc": "Send a medical alert with your conditions and medications.",
    "emergency.medical.button": "Send Medical Alert",
    "emergency.medical.info.title": "Medical Information",
    "emergency.medical.conditions": "Conditions",
    "emergency.medical.medications": "Medications",
    "emergency.medical.update": "Update Info",
  "emergency.call.confirm": "This will call emergency services (111). Proceed only if this is a real emergency.",
  "emergency.location.copied": "Location copied to clipboard",
  "emergency.location.error": "Unable to get location. Please enable GPS.",
  "emergency.geo.unsupported": "Geolocation is not supported by this browser.",
  "emergency.medical.sent": "Medical alert sent to emergency services",
  "emergency.contacts.added": "Emergency contact added successfully",
  "emergency.contacts.confirmDelete": "Are you sure you want to delete this emergency contact?",
  "emergency.contacts.deleted": "Emergency contact deleted",

  // Profile
  "profile.edit": "Edit Profile",
  "profile.updateError": "Failed to update profile. Please try again.",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.prescriptions": "Prescriptions",
    "sidebar.reports": "Reports",
    "sidebar.vitals": "Vitals",
    "sidebar.emergency": "Emergency",

    // Reports
    "reports.title": "Health Reports",
    "reports.description": "Generate and download comprehensive reports to share with your doctor or keep for your records.",
    "reports.generate": "Generate Report",
    "reports.vitalsReport": "Vitals Report",
    "reports.prescriptionsReport": "Prescriptions Report",
    "reports.comprehensiveReport": "Comprehensive Report",
    "reports.myReports": "My Reports",
    "reports.noReports": "No reports yet",
    "reports.generateFirst": "Generate your first report using the buttons above.",
    "reports.generatedOn": "Generated on",
    "reports.type": "Type",
    "reports.download": "Download",
    "reports.generated": "Report generated successfully",

    // Generic errors for reports
    "error.loadReports": "Failed to load reports",
    "error.generateReport": "Failed to generate report",
    "error.downloadReport": "Failed to download report",

    // About Page
    "about.title": "About Your Health Guide",
    "about.subtitle": "Transforming healthcare management in Egypt with AI-powered solutions",
    "about.mission.title": "Our Mission",
    "about.mission.desc":
      "To transform healthcare management in Egypt by providing an intelligent, accessible digital health companion that empowers patients with chronic conditions to take control of their health journey.",
    "about.vision.title": "Our Vision",
    "about.vision.desc":
      "To be the leading healthcare technology platform in the Middle East, making quality healthcare accessible, understandable, and manageable for every Egyptian patient.",
    "about.problem.title": "The Problem We Solve",
    "about.problem.prescription.title": "Illegible Prescriptions",
    "about.problem.prescription.desc": "78% of prescriptions in Egypt contain errors due to poor handwriting",
    "about.problem.tracking.title": "Poor Health Tracking",
    "about.problem.tracking.desc": "62% of patients don't consistently track their vital signs",
    "about.problem.visits.title": "Inefficient Doctor Visits",
    "about.problem.visits.desc": "85% of patients rely on memory during medical consultations",
    "about.problem.digital.title": "Digital Barriers",
    "about.problem.digital.desc": "65% of elderly patients struggle with complex health apps",
    "about.cta.title": "Ready to Transform Your Health Management?",
    "about.cta.desc": "Join thousands of Egyptian patients who trust Your Health Guide for their healthcare needs",
    "about.cta.start": "Get Started Free",
    "about.cta.services": "View Services",

    // Services Page
    "services.hero.title": "Our Services",
    "services.hero.subtitle": "Comprehensive healthcare management tools designed for Egyptian patients",
    "services.cta.title": "Ready to Get Started?",
    "services.cta.desc": "Join thousands of patients who trust Your Health Guide for their healthcare management",
    "services.cta.start": "Start Free Trial",
    "services.cta.learnMore": "Learn More",

    // Service items
    "services.aiScanner.title": "AI Prescription Scanner",
    "services.aiScanner.desc": "Scan and digitize prescriptions with 95% accuracy using advanced OCR technology",
    "services.aiScanner.feature1": "OCR Technology",
    "services.aiScanner.feature2": "Arabic Support",
    "services.aiScanner.feature3": "Drug Database",
    "services.aiScanner.feature4": "Dosage Tracking",

    "services.vitals.title": "Smart Vitals Tracking",
    "services.vitals.desc": "Monitor your health metrics with intelligent insights and trend analysis",
    "services.vitals.feature1": "Blood Pressure",
    "services.vitals.feature2": "Heart Rate",
    "services.vitals.feature3": "Weight Tracking",
    "services.vitals.feature4": "Trend Analysis",

    "services.reports.title": "Health Reports",
    "services.reports.desc": "Generate comprehensive health reports for doctor visits and personal tracking",
    "services.reports.feature1": "PDF Export",
    "services.reports.feature2": "Doctor Sharing",
    "services.reports.feature3": "Historical Data",
    "services.reports.feature4": "Visual Charts",

    "services.emergency.title": "Emergency Alerts",
    "services.emergency.desc": "Quick access to emergency services with location sharing and contact alerts",
    "services.emergency.feature1": "GPS Location",
    "services.emergency.feature2": "Contact Alerts",
    "services.emergency.feature3": "Medical Info",
    "services.emergency.feature4": "Quick Dial",

    "services.voice.title": "Voice Commands",
    "services.voice.desc": "Control the app using Egyptian Arabic voice commands for accessibility",
    "services.voice.feature1": "Arabic Recognition",
    "services.voice.feature2": "Hands-free Control",
    "services.voice.feature3": "Accessibility",
    "services.voice.feature4": "Quick Actions",

    "services.reminders.title": "Medication Reminders",
    "services.reminders.desc": "Never miss a dose with smart medication reminders and tracking",
    "services.reminders.feature1": "Smart Reminders",
    "services.reminders.feature2": "Dose Tracking",
    "services.reminders.feature3": "Refill Alerts",
    "services.reminders.feature4": "Adherence Reports",
  },
  ar: {
    // Navigation
    "nav.brand": "دليلك الصحي",
    "nav.services": "الخدمات",
    "nav.about": "عن التطبيق",
    "nav.login": "تسجيل الدخول",
    "nav.signup": "انضم إلينا الآن!",
    "nav.signup.mobile": "انضم إلينا!",
    "nav.dashboard": "لوحة التحكم",
    "nav.profile": "الملف الشخصي",
    "nav.logout": "تسجيل الخروج",

    // Hero/home
    "hero.title": "صحتك، أولويتنا",
    "hero.subtitle":
      "حوّل إدارة رعايتك الصحية مع مسح الوصفات بالذكاء الاصطناعي، وتتبع العلامات الحيوية الذكي، وواجهة صوتية للمرضى المصريين.",
    "hero.cta.primary": "ابدأ الآن",
    "hero.cta.secondary": "طوارئ: 911",
    "stats.scanner.title": "ماسح الوصفات بالذكاء الاصطناعي",
    "stats.scanner.value": "95%",
    "stats.scanner.desc": "معدل الدقة",
    "stats.vitals.title": "تتبع العلامات الحيوية الذكي",
    "stats.vitals.value": "24/7",
    "stats.vitals.desc": "مراقبة صحية",
    "stats.voice.title": "الأوامر الصوتية",
    "stats.voice.value": "عربي",
    "stats.voice.desc": "العربية المصرية",

    // Common
    "common.refresh": "تحديث",
    "common.close": "إغلاق",
  "common.save": "حفظ",
  "common.cancel": "إلغاء",

    // Voice
    "voice.startListening": "بدء الأوامر الصوتية",
    "voice.stopListening": "إيقاف الأوامر الصوتية",

    // Messages
    "msg.connection.restored": "تم استعادة الاتصال",
    "msg.offline": "أنت غير متصل",
    "msg.emergency.confirm": "هل تريد إرسال تنبيه طوارئ لجهات الاتصال الخاصة بك؟",
    "msg.emergency.sent": "تم إرسال تنبيه الطوارئ لجهات الاتصال الخاصة بك!",
    "msg.emergency.failed": "فشل إرسال تنبيه الطوارئ",

    // Auth - Labels & CTAs
    "auth.join": "انضم إلى دليلك الصحي",
    "auth.join.desc": "أنشئ حسابك للوصول إلى إدارة صحية ذكية",
    "auth.firstname": "الاسم الأول",
    "auth.lastname": "اسم العائلة",
    "auth.username": "اسم المستخدم",
    "auth.email": "البريد الإلكتروني",
    "auth.phone": "رقم الهاتف",
    "auth.dob": "تاريخ الميلاد",
    "auth.password": "كلمة المرور",
    "auth.password.confirm": "تأكيد كلمة المرور",
    "auth.terms": "أوافق على شروط الخدمة وسياسة الخصوصية",
    "auth.signup": "إنشاء حساب",
    "auth.have.account": "لديك حساب بالفعل؟",
    "auth.signin.here": "سجّل الدخول هنا",
    "auth.welcome": "مرحبًا بعودتك",
    "auth.welcome.desc": "سجّل الدخول للوصول إلى حسابك",
    "auth.remember": "تذكرني",
    "auth.forgot": "هل نسيت كلمة المرور؟",
    "auth.signin": "تسجيل الدخول",
    "auth.no.account": "ليس لديك حساب؟",
    "auth.signup.here": "أنشئ حسابًا هنا",
    "auth.show": "إظهار",
    "auth.hide": "إخفاء",
    "auth.creatingAccount": "جاري إنشاء الحساب...",
    "auth.signingIn": "جارٍ تسجيل الدخول...",

  // Auth - Password hints
  "auth.password.hint.title": "يجب أن تحتوي كلمة المرور على:",
  "auth.password.hint.8chars": "ثمانية أحرف على الأقل",
  "auth.password.hint.upper": "حرف كبير (A-Z)",
  "auth.password.hint.lower": "حرف صغير (a-z)",
  "auth.password.hint.number": "رقم (0-9)",
  "auth.password.hint.special": "رمز خاص",
  "auth.password.hint.common": "لا أنماط شائعة (123456, password, qwerty, ...)",
  "auth.password.hint.sequential": "لا تسلسل متتابع (abc, 123, ...)",

    // Auth - Placeholders
    "auth.placeholder.first": "الاسم الأول",
    "auth.placeholder.last": "اسم العائلة",
    "auth.placeholder.username": "أدخل اسم المستخدم",
    "auth.placeholder.email": "أدخل بريدك الإلكتروني",
    "auth.placeholder.phone": "أدخل رقم هاتفك",
    "auth.placeholder.dob": "اختر تاريخ الميلاد",
    "auth.placeholder.password": "أدخل كلمة المرور",
    "auth.placeholder.password.create": "أنشئ كلمة مرور",
    "auth.placeholder.password.confirm": "أكد كلمة المرور",
    "auth.placeholder.resetEmail": "أدخل بريدك الإلكتروني",

    // Auth - Toasts/Errors
    "auth.error.first.required": "الاسم الأول مطلوب",
    "auth.error.last.required": "اسم العائلة مطلوب",
    "auth.error.username.required": "اسم المستخدم مطلوب",
    "auth.error.username.min": "يجب ألا يقل اسم المستخدم عن 3 أحرف",
    "auth.error.email.required": "البريد الإلكتروني مطلوب",
    "auth.error.email.invalid": "يرجى إدخال بريد إلكتروني صالح",
    "auth.error.password.required": "كلمة المرور مطلوبة",
    "auth.error.password.min": "يجب ألا تقل كلمة المرور عن 8 أحرف",
    "auth.error.password.complex":
      "يجب أن تحتوي كلمة المرور على حرف كبير وصغير ورقم ورمز خاص على الأقل",
    "auth.error.password.common": "كلمة المرور تحتوي أنماطًا شائعة غير آمنة",
    "auth.error.password.sequential": "يجب ألا تحتوي كلمة المرور على تسلسل متتابع",
    "auth.error.password.mismatch": "كلمتا المرور غير متطابقتين",
    "auth.error.terms": "يجب الموافقة على الشروط والسياسة",
    "auth.success.register.redirect": "تم إنشاء الحساب بنجاح! جارٍ التحويل...",
    "auth.success.register.verify": "تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول.",
    "auth.error.register.generic": "فشل التسجيل. حاول مرة أخرى.",
    "auth.error.verifyEmail": "فشل التحقق من البريد الإلكتروني",
    "auth.success.login.redirect": "تم تسجيل الدخول بنجاح! جارٍ التحويل...",
    "auth.warning.verifyEmail": "يرجى التحقق من بريدك الإلكتروني للوصول لجميع الميزات.",
    "auth.error.login.generic": "فشل تسجيل الدخول. حاول مرة أخرى.",
    "auth.error.reset.invalidEmail": "يرجى إدخال بريد إلكتروني صالح",
    "auth.error.reset.generic": "فشل إرسال رسالة إعادة التعيين. حاول مرة أخرى.",
    "auth.reset.title": "إعادة تعيين كلمة المرور",
    "auth.reset.cancel": "إلغاء",
    "auth.reset.send": "إرسال رابط إعادة التعيين",

  // PWA
  "pwa.updatePrompt": "يوجد إصدار جديد! هل تريد التحديث الآن؟",

    // Vitals
    "vitals.title": "العلامات الحيوية",
    "vitals.subtitle": "تتبع مقاييس صحتك والاتجاهات",
    "vitals.log.title": "تسجيل سريع",
    "vitals.add.detailed": "إضافة إدخال مفصل",
    "vitals.blood_pressure": "ضغط الدم",
    "vitals.heart_rate": "نبض القلب",
    "vitals.temperature": "الحرارة",
    "vitals.weight": "الوزن",
    "vitals.bloodSugar": "سكر الدم",
    "vitals.notes": "ملاحظات",
    "vitals.placeholder.notes": "أي ملاحظات عن صحتك",
    "vitals.log.save": "حفظ الإدخال",
    "vitals.trends.title": "الاتجاهات",
    "vitals.chart.type": "نوع العلامة",
    "vitals.chart.period": "الفترة",
    "vitals.period.week": "آخر 7 أيام",
    "vitals.period.month": "آخر 30 يومًا",
    "vitals.period.quarter": "آخر 90 يومًا",
    "vitals.period.year": "السنة الماضية",
    "vitals.recent.title": "آخر الإدخالات",
    "vitals.empty.title": "لا توجد علامات بعد",
    "vitals.empty.desc": "ابدأ بتتبع العلامات الحيوية لرؤية الاتجاهات بمرور الوقت.",
    "vitals.addFirst": "أضف أول علامة حيوية",
    "vitals.editFeature.comingSoon": "ميزة التعديل قريبًا",
    "vitals.loadError": "فشل تحميل العلامات الحيوية",
    "vitals.trendsError": "فشل تحميل الاتجاهات",
    "vitals.noDataEntered": "لم يتم إدخال بيانات",
    "vitals.quickSaveSuccess": "تم الحفظ السريع",
    "vitals.saveError": "فشل حفظ الإدخال",
    "vitals.addSuccess": "تمت إضافة العلامة بنجاح",
    "vitals.addError": "فشلت إضافة العلامة",
    "vitals.confirmDelete": "حذف هذا الإدخال؟",
    "vitals.deleteSuccess": "تم الحذف",
    "vitals.deleteError": "فشل الحذف",
    "vitals.noDataToExport": "لا توجد بيانات للتصدير",
    "vitals.exportSuccess": "تم التصدير بنجاح",
    "vitals.noChartData": "لا توجد بيانات للفترة المحددة",
    "vitals.chart.trend": "اتجاه",
    "vitals.export": "تصدير",
    "vitals.stats.average": "المتوسط",
    "vitals.stats.highest": "الأعلى",
    "vitals.stats.lowest": "الأدنى",
    "vitals.stats.readings": "القراءات",
  "vitals.requiredFields": "يرجى ملء جميع الحقول المطلوبة",
  "vitals.invalidValue": "قيمة غير صحيحة. يرجى التحقق من الإدخال.",

    // Prescriptions
    "prescriptions.title": "الوصفات الطبية",
    "prescriptions.subtitle": "امسح وأدر وصفاتك",
    "prescriptions.scan.new": "مسح جديد",
    "prescriptions.manualEntry.comingSoon": "الإدخال اليدوي قريبًا",
    "prescriptions.add.manual": "إضافة يدويًا",
    "prescriptions.empty.title": "لا توجد وصفات بعد",
    "prescriptions.empty.desc": "امسح أو أضف وصفة للبدء.",
    "prescriptions.scan.first": "امسح أول وصفة",
    "prescriptions.editFeature.comingSoon": "ميزة التعديل قريبًا",
    "prescriptions.viewFeature.comingSoon": "ميزة العرض قريبًا",
    "prescriptions.loadError": "فشل تحميل الوصفات",
    "prescriptions.scanSuccess": "تم المسح بنجاح",
    "prescriptions.scanError": "فشل المسح",
    "prescriptions.confirmDelete": "حذف هذه الوصفة؟",
    "prescriptions.deleteSuccess": "تم الحذف بنجاح",
    "prescriptions.deleteError": "فشل الحذف",

    // Dashboard
    "dashboard.welcome": "مرحبًا بك في لوحة صحتك",
    "dashboard.subtitle": "أدر صحتك بأدوات ذكية مدعومة بالذكاء الاصطناعي",
    "dashboard.prescriptions": "الوصفات الطبية",
    "dashboard.prescriptions.desc": "إجمالي المفحوص",
    "dashboard.vitals": "العلامات الحيوية",
    "dashboard.vitals.desc": "هذا الشهر",
    "dashboard.reports": "التقارير",
    "dashboard.reports.desc": "المُنشأة",
    "dashboard.checkup": "الفحص القادم",
    "dashboard.checkup.date": "١٥ يناير",
    "dashboard.checkup.doctor": "د. أحمد",
    "actions.title": "إجراءات سريعة",
    "actions.scan": "مسح وصفة",
    "actions.vitals": "تسجيل العلامات",
    "actions.report": "إنشاء تقرير",
    "actions.emergency": "طوارئ",
    "activity.title": "النشاط الأخير",

    // Emergency
    "emergency.alert": "طوارئ",
    "emergency.title": "مركز الطوارئ",
    "emergency.call.title": "اتصال بالطوارئ",
    "emergency.call.desc": "اتصل بخدمات الطوارئ للمساعدة الفورية.",
    "emergency.call.button": "اتصل الآن",
    "emergency.location.title": "مشاركة الموقع",
    "emergency.location.desc": "شارك موقعك الحالي مع جهات موثوقة.",
    "emergency.location.button": "نسخ الموقع",
    "emergency.contacts.title": "جهات اتصال الطوارئ",
    "emergency.contacts.empty": "لا توجد جهات اتصال بعد.",
    "emergency.contacts.call": "اتصال",
    "emergency.contacts.add": "إضافة جهة اتصال",
    "emergency.medical.title": "تنبيه طبي",
    "emergency.medical.desc": "أرسل تنبيهًا طبيًا مع حالاتك وأدويتك.",
    "emergency.medical.button": "إرسال تنبيه طبي",
    "emergency.medical.info.title": "معلومات طبية",
    "emergency.medical.conditions": "الحالات",
    "emergency.medical.medications": "الأدوية",
    "emergency.medical.update": "تحديث المعلومات",
  "emergency.call.confirm": "سيتم الاتصال بخدمات الطوارئ (111). تابع فقط إذا كانت حالة طارئة حقيقية.",
  "emergency.location.copied": "تم نسخ الموقع إلى الحافظة",
  "emergency.location.error": "تعذر الحصول على الموقع. يرجى تفعيل GPS.",
  "emergency.geo.unsupported": "المتصفح لا يدعم تحديد الموقع الجغرافي",
  "emergency.medical.sent": "تم إرسال تنبيه طبي إلى خدمات الطوارئ",
  "emergency.contacts.added": "تمت إضافة جهة اتصال طوارئ بنجاح",
  "emergency.contacts.confirmDelete": "هل أنت متأكد من حذف جهة الاتصال هذه؟",
  "emergency.contacts.deleted": "تم حذف جهة اتصال الطوارئ",

  // Profile
  "profile.edit": "تعديل الملف الشخصي",
  "profile.updateError": "فشل تحديث الملف الشخصي. حاول مرة أخرى.",

    // Sidebar
    "sidebar.dashboard": "لوحة التحكم",
    "sidebar.prescriptions": "الوصفات الطبية",
    "sidebar.reports": "التقارير",
    "sidebar.vitals": "العلامات الحيوية",
    "sidebar.emergency": "الطوارئ",

    // Reports
    "reports.title": "التقارير الصحية",
    "reports.description": "أنشئ وحمّل تقارير شاملة لمشاركتها مع طبيبك أو للاحتفاظ بها.",
    "reports.generate": "إنشاء تقرير",
    "reports.vitalsReport": "تقرير العلامات الحيوية",
    "reports.prescriptionsReport": "تقرير الوصفات",
    "reports.comprehensiveReport": "تقرير شامل",
    "reports.myReports": "تقاريري",
    "reports.noReports": "لا توجد تقارير بعد",
    "reports.generateFirst": "أنشئ تقريرك الأول باستخدام الأزرار بالأعلى.",
    "reports.generatedOn": "تم الإنشاء في",
    "reports.type": "النوع",
    "reports.download": "تحميل",
    "reports.generated": "تم إنشاء التقرير بنجاح",

    // Generic errors for reports
    "error.loadReports": "فشل تحميل التقارير",
    "error.generateReport": "فشل إنشاء التقرير",
    "error.downloadReport": "فشل تنزيل التقرير",

    // About Page
    "about.title": "عن دليلك الصحي",
    "about.subtitle": "نحوّل إدارة الرعاية الصحية في مصر بحلول مدعومة بالذكاء الاصطناعي",
    "about.mission.title": "مهمتنا",
    "about.mission.desc":
      "تحويل إدارة الرعاية الصحية في مصر عبر توفير رفيق صحي رقمي ذكي وسهل الوصول، يمكّن المرضى من التحكم في رحلتهم الصحية.",
    "about.vision.title": "رؤيتنا",
    "about.vision.desc":
      "أن نكون المنصة الرائدة لتقنيات الرعاية الصحية في الشرق الأوسط، نجعل الرعاية الصحية عالية الجودة في متناول كل مريض مصري ويمكن فهمها وإدارتها.",
    "about.problem.title": "المشكلة التي نحلها",
    "about.problem.prescription.title": "وصفات غير مقروءة",
    "about.problem.prescription.desc": "78% من الوصفات في مصر تحتوي أخطاء بسبب رداءة الخط",
    "about.problem.tracking.title": "تتبع صحي ضعيف",
    "about.problem.tracking.desc": "62% من المرضى لا يتابعون العلامات الحيوية باستمرار",
    "about.problem.visits.title": "زيارات طبية غير فعّالة",
    "about.problem.visits.desc": "85% من المرضى يعتمدون على الذاكرة أثناء الاستشارات",
    "about.problem.digital.title": "عوائق رقمية",
    "about.problem.digital.desc": "65% من كبار السن يواجهون صعوبة مع تطبيقات الصحة المعقدة",
    "about.cta.title": "مستعد لتحويل إدارة صحتك؟",
    "about.cta.desc": "انضم لآلاف المرضى المصريين الذين يثقون في دليلك الصحي",
    "about.cta.start": "ابدأ مجانًا",
    "about.cta.services": "عرض الخدمات",

    // Services Page
    "services.hero.title": "خدماتنا",
    "services.hero.subtitle": "أدوات شاملة لإدارة الرعاية الصحية مصممة للمرضى المصريين",
    "services.cta.title": "جاهز للبدء؟",
    "services.cta.desc": "انضم لآلاف المرضى الذين يثقون في دليلك الصحي لإدارة رعايتهم",
    "services.cta.start": "ابدأ التجربة مجانًا",
    "services.cta.learnMore": "اعرف المزيد",

    // Service items
    "services.aiScanner.title": "ماسح الوصفات بالذكاء الاصطناعي",
    "services.aiScanner.desc": "مسح وتحويل الوصفات بدقة 95% باستخدام تقنية OCR المتقدمة",
    "services.aiScanner.feature1": "تقنية OCR",
    "services.aiScanner.feature2": "دعم العربية",
    "services.aiScanner.feature3": "قاعدة بيانات الأدوية",
    "services.aiScanner.feature4": "تتبّع الجرعات",

    "services.vitals.title": "تتبع العلامات الحيوية الذكي",
    "services.vitals.desc": "راقب مؤشرات صحتك مع رؤى ذكية وتحليل للاتجاهات",
    "services.vitals.feature1": "ضغط الدم",
    "services.vitals.feature2": "نبض القلب",
    "services.vitals.feature3": "تتبع الوزن",
    "services.vitals.feature4": "تحليل الاتجاهات",

    "services.reports.title": "التقارير الصحية",
    "services.reports.desc": "أنشئ تقارير صحية شاملة لزيارات الطبيب والمتابعة الشخصية",
    "services.reports.feature1": "تصدير PDF",
    "services.reports.feature2": "مشاركة مع الطبيب",
    "services.reports.feature3": "بيانات تاريخية",
    "services.reports.feature4": "رسوم بيانية",

    "services.emergency.title": "تنبيهات الطوارئ",
    "services.emergency.desc": "وصول سريع لخدمات الطوارئ مع مشاركة الموقع وتنبيه جهات الاتصال",
    "services.emergency.feature1": "موقع GPS",
    "services.emergency.feature2": "تنبيه جهات الاتصال",
    "services.emergency.feature3": "معلومات طبية",
    "services.emergency.feature4": "اتصال سريع",

    "services.voice.title": "الأوامر الصوتية",
    "services.voice.desc": "تحكم في التطبيق بأوامر صوتية بالعربية المصرية للسهولة",
    "services.voice.feature1": "تعرف عربي",
    "services.voice.feature2": "تحكم بدون يدين",
    "services.voice.feature3": "سهولة الوصول",
    "services.voice.feature4": "إجراءات سريعة",

    "services.reminders.title": "تذكيرات الدواء",
    "services.reminders.desc": "لا تفوّت جرعة مع تذكيرات ذكية وتتبع للأدوية",
    "services.reminders.feature1": "تذكيرات ذكية",
    "services.reminders.feature2": "تتبّع الجرعات",
    "services.reminders.feature3": "تنبيهات إعادة الشراء",
    "services.reminders.feature4": "تقارير الالتزام",
  },
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en")
  const [isRTL, setIsRTL] = useState(false)

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "en"
    setLanguage(savedLanguage)
    setIsRTL(savedLanguage === "ar")

    // Update document attributes
    document.documentElement.lang = savedLanguage
    document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr"
  }, [])

  // Toggle language
  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ar" : "en"
    setLanguage(newLanguage)
    setIsRTL(newLanguage === "ar")

    // Save preference
    localStorage.setItem("language", newLanguage)

    // Update document attributes
    document.documentElement.lang = newLanguage
    document.documentElement.dir = newLanguage === "ar" ? "rtl" : "ltr"
  }

  // Translation function
  const t = (key, fallback = key) => {
    return translations[language]?.[key] || fallback
  }

  const value = {
    language,
    isRTL,
    toggleLanguage,
    t,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
