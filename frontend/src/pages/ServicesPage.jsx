"use client"

import { Link } from "react-router-dom"
import { useLanguage } from "../contexts/LanguageContext"

const ServicesPage = () => {
  const { t } = useLanguage()

  const services = [
    {
      title: "AI Prescription Scanner",
      description: "Scan and digitize prescriptions with 95% accuracy using advanced OCR technology",
      icon: "📱",
      features: ["OCR Technology", "Arabic Support", "Drug Database", "Dosage Tracking"],
      color: "primary",
    },
    {
      title: "Smart Vitals Tracking",
      description: "Monitor your health metrics with intelligent insights and trend analysis",
      icon: "📊",
      features: ["Blood Pressure", "Heart Rate", "Weight Tracking", "Trend Analysis"],
      color: "secondary",
    },
    {
      title: "Health Reports",
      description: "Generate comprehensive health reports for doctor visits and personal tracking",
      icon: "📄",
      features: ["PDF Export", "Doctor Sharing", "Historical Data", "Visual Charts"],
      color: "accent",
    },
    {
      title: "Emergency Alerts",
      description: "Quick access to emergency services with location sharing and contact alerts",
      icon: "🚨",
      features: ["GPS Location", "Contact Alerts", "Medical Info", "Quick Dial"],
      color: "error",
    },
    {
      title: "Voice Commands",
      description: "Control the app using Egyptian Arabic voice commands for accessibility",
      icon: "🎤",
      features: ["Arabic Recognition", "Hands-free Control", "Accessibility", "Quick Actions"],
      color: "info",
    },
    {
      title: "Medication Reminders",
      description: "Never miss a dose with smart medication reminders and tracking",
      icon: "💊",
      features: ["Smart Reminders", "Dose Tracking", "Refill Alerts", "Adherence Reports"],
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
              Our Services
            </h1>
            <p className="text-xl mb-8 text-base-content/80">
              Comprehensive healthcare management tools designed for Egyptian patients
            </p>
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
                      <div key={featureIndex} className="flex items-center space-x-2">
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
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of patients who trust Your Health Guide for their healthcare management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn btn-secondary btn-lg">
              Start Free Trial
            </Link>
            <Link
              to="/about"
              className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ServicesPage
