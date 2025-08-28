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
    "nav.brand": "Your Health Guide",
    "nav.services": "Services",
    "nav.about": "About",
    "nav.login": "Login",
    "nav.signup": "Join Us Now!",
    "nav.signup.mobile": "Join us!",
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
    "msg.connection.restored": "Connection restored",
    "msg.offline": "You are offline",
    "msg.emergency.confirm": "Send emergency alert to your contacts?",
    "msg.emergency.sent": "Emergency alert sent to your contacts!",
    "msg.emergency.failed": "Failed to send emergency alert",
  },
  ar: {
    "nav.brand": "دليلك الصحي",
    "nav.services": "الخدمات",
    "nav.about": "عن التطبيق",
    "nav.login": "تسجيل الدخول",
    "nav.signup": "انضم إلينا الآن!",
    "nav.signup.mobile": "انضم إلينا!",
    "hero.title": "صحتك، أولويتنا",
    "hero.subtitle":
      "حول إدارة الرعاية الصحية الخاصة بك مع مسح الوصفات الطبية بالذكاء الاصطناعي، وتتبع العلامات الحيوية الذكي، وواجهة صوتية مصممة للمرضى المصريين.",
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
    "msg.connection.restored": "تم استعادة الاتصال",
    "msg.offline": "أنت غير متصل",
    "msg.emergency.confirm": "إرسال تنبيه طوارئ لجهات الاتصال الخاصة بك؟",
    "msg.emergency.sent": "تم إرسال تنبيه الطوارئ لجهات الاتصال الخاصة بك!",
    "msg.emergency.failed": "فشل في إرسال تنبيه الطوارئ",
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
