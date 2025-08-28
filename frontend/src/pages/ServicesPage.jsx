"use client"

import { Link } from "react-router-dom"
import { useLanguage } from "../contexts/LanguageContext"

const ServicesPage = () => {
  const { t } = useLanguage()

  const services = [
    {
      title: t("services.aiScanner.title"),
      description: t("services.aiScanner.desc"),
      icon: "📱",
      features: [
        t("services.aiScanner.feature1"),
        t("services.aiScanner.feature2"),
        t("services.aiScanner.feature3"),
        t("services.aiScanner.feature4"),
      ],
      color: "primary",
    },
    {
      title: t("services.vitals.title"),
      description: t("services.vitals.desc"),
      icon: "📊",
      features: [
        t("services.vitals.feature1"),
        t("services.vitals.feature2"),
        t("services.vitals.feature3"),
        t("services.vitals.feature4"),
      ],
      color: "secondary",
    },
    {
      title: t("services.reports.title"),
      description: t("services.reports.desc"),
      icon: "📄",
      features: [
        t("services.reports.feature1"),
        t("services.reports.feature2"),
        t("services.reports.feature3"),
        t("services.reports.feature4"),
      ],
      color: "accent",
    },
    {
      title: t("services.emergency.title"),
      description: t("services.emergency.desc"),
      icon: "🚨",
      features: [
        t("services.emergency.feature1"),
        t("services.emergency.feature2"),
        t("services.emergency.feature3"),
        t("services.emergency.feature4"),
      ],
      color: "error",
    },
    {
      title: t("services.voice.title"),
      description: t("services.voice.desc"),
      icon: "🎤",
      features: [
        t("services.voice.feature1"),
        t("services.voice.feature2"),
        t("services.voice.feature3"),
        t("services.voice.feature4"),
      ],
      color: "info",
    },
    {
      title: t("services.reminders.title"),
      description: t("services.reminders.desc"),
      icon: "💊",
      features: [
        t("services.reminders.feature1"),
        t("services.reminders.feature2"),
        t("services.reminders.feature3"),
        t("services.reminders.feature4"),
      ],
      color: "warning",
    },
  ]

  return (
    <div>
      {/* Hero Section */}
      <div className="hero min-h-96 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t("services.hero.title")}
            </h1>
            <p className="text-xl mb-8 text-base-content/80">{t("services.hero.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <section className="py-16 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className={`w-16 h-16 bg-${service.color}/20 rounded-lg flex items-center justify-center mb-4`}>
                    <span className="text-3xl">{service.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-base-content/70 mb-4">{service.description}</p>
                  <div className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-success"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center text-white">
      <h2 className="text-3xl font-bold mb-4">{t("services.cta.title")}</h2>
      <p className="text-lg mb-8 opacity-90">{t("services.cta.desc")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn btn-secondary btn-lg">
        {t("services.cta.start")}
            </Link>
            <Link
              to="/about"
              className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary"
            >
        {t("services.cta.learnMore")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ServicesPage
