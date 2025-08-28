"use client"

import { useState, useEffect } from "react"

const PWAInstaller = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    const handleAppInstalled = () => {
      console.log("PWA was installed")
      setShowInstallPrompt(false)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User response to the install prompt: ${outcome}`)
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  if (!showInstallPrompt) return null

  return (
    <div className="pwa-install-prompt">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold">Install Health Guide</h4>
          <p className="text-sm opacity-90">Add to your home screen for quick access</p>
        </div>
        <div className="space-x-2">
          <button onClick={handleDismiss} className="btn btn-sm btn-ghost">
            Later
          </button>
          <button onClick={handleInstall} className="btn btn-sm btn-accent">
            Install
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAInstaller
