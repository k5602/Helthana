"use client"

import { Link } from "react-router-dom"
import { useLanguage } from "../contexts/LanguageContext"

const AboutPage = () => {
  const { t } = useLanguage()

  return (
    <div>
      {/* Hero Section */}
      <div className="hero min-h-96 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-10 h-10 text-primary"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t("about.title", "About Your Health Guide")}
            </h1>
            <p className="text-xl mb-8 text-base-content/80">
              {t("about.subtitle", "Transforming healthcare management in Egypt with AI-powered solutions")}
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className="py-16 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-6 h-6 text-primary"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15.75a9.065 9.065 0 0 1-6.23-.957L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.611L5 14.5"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">{t("about.mission.title", "Our Mission")}</h3>
                </div>
                <p className="text-base-content/80 text-lg">
                  {t(
                    "about.mission.desc",
                    "To transform healthcare management in Egypt by providing an intelligent, accessible digital health companion that empowers patients with chronic conditions to take control of their health journey.",
                  )}
                </p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-lg">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-6 h-6 text-secondary"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">{t("about.vision.title", "Our Vision")}</h3>
                </div>
                <p className="text-base-content/80 text-lg">
                  {t(
                    "about.vision.desc",
                    "To be the leading healthcare technology platform in the Middle East, making quality healthcare accessible, understandable, and manageable for every Egyptian patient.",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Problem We Solve */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center mb-8">{t("about.problem.title", "The Problem We Solve")}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h4 className="font-bold text-lg mb-2">
                  {t("about.problem.prescription.title", "Illegible Prescriptions")}
                </h4>
                <p className="text-base-content/70 text-sm">
                  {t(
                    "about.problem.prescription.desc",
                    "78% of prescriptions in Egypt contain errors due to poor handwriting",
                  )}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="font-bold text-lg mb-2">{t("about.problem.tracking.title", "Poor Health Tracking")}</h4>
                <p className="text-base-content/70 text-sm">
                  {t("about.problem.tracking.desc", "62% of patients don't consistently track their vital signs")}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-info/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🩺</span>
                </div>
                <h4 className="font-bold text-lg mb-2">
                  {t("about.problem.visits.title", "Inefficient Doctor Visits")}
                </h4>
                <p className="text-base-content/70 text-sm">
                  {t("about.problem.visits.desc", "85% of patients rely on memory during medical consultations")}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h4 className="font-bold text-lg mb-2">{t("about.problem.digital.title", "Digital Barriers")}</h4>
                <p className="text-base-content/70 text-sm">
                  {t("about.problem.digital.desc", "65% of elderly patients struggle with complex health apps")}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-2xl">
              <div className="card-body py-12">
                <h3 className="text-3xl font-bold mb-4">
                  {t("about.cta.title", "Ready to Transform Your Health Management?")}
                </h3>
                <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
                  {t(
                    "about.cta.desc",
                    "Join thousands of Egyptian patients who trust Your Health Guide for their healthcare needs",
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/signup" className="btn btn-secondary btn-lg">
                    {t("about.cta.start", "Get Started Free")}
                  </Link>
                  <Link
                    to="/services"
                    className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary"
                  >
                    {t("about.cta.services", "View Services")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
