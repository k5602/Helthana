"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"

export function useVoiceCommands() {
  const navigate = useNavigate()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [lastCommand, setLastCommand] = useState(null)

  const confidenceThreshold = 0.7

  const commands = new Map([
    [
      "scan prescription",
      {
        action: () => navigate("/prescriptions"),
        description: "Open prescription scanner",
        aliases: ["scan medicine", "scan medication", "take prescription photo"],
      },
    ],
    [
      "log vitals",
      {
        action: () => navigate("/vitals"),
        description: "Open vitals logging form",
        aliases: ["record vitals", "add vitals", "log health data"],
      },
    ],
    [
      "emergency",
      {
        action: () => navigate("/emergency"),
        description: "Trigger emergency alert",
        aliases: ["emergency alert", "call for help", "send emergency"],
      },
    ],
    [
      "dashboard",
      {
        action: () => navigate("/dashboard"),
        description: "Go to dashboard",
        aliases: ["home", "main page", "go home"],
      },
    ],
    [
      "help",
      {
        action: () => showCommandHelp(),
        description: "Show available commands",
        aliases: ["what can you do", "commands", "voice help"],
      },
    ],
    [
      "stop listening",
      {
        action: () => stopListening(),
        description: "Stop voice recognition",
        aliases: ["stop", "cancel", "quit"],
      },
    ],
  ])

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()

      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = "en-US"
      recognitionInstance.maxAlternatives = 3

      recognitionInstance.onstart = () => setIsListening(true)
      recognitionInstance.onend = () => setIsListening(false)
      recognitionInstance.onresult = handleSpeechResult
      recognitionInstance.onerror = handleSpeechError

      setRecognition(recognitionInstance)
      setIsSupported(true)
    } else {
      console.warn("Speech recognition not supported in this browser")
      setIsSupported(false)
    }
  }, [])

  const handleSpeechResult = useCallback((event) => {
    const results = Array.from(event.results)
    const lastResult = results[results.length - 1]

    if (lastResult.isFinal) {
      const transcript = lastResult[0].transcript.toLowerCase().trim()
      const confidence = lastResult[0].confidence

      console.log("Voice command:", transcript, "Confidence:", confidence)

      if (confidence >= confidenceThreshold) {
        processCommand(transcript)
      } else {
        console.warn(`Command unclear (${Math.round(confidence * 100)}% confidence)`)
      }
    }
  }, [])

  const handleSpeechError = useCallback((event) => {
    console.error("Speech recognition error:", event.error)
    setIsListening(false)
  }, [])

  const processCommand = useCallback((transcript) => {
    const command = findBestMatch(transcript)

    if (command) {
      setLastCommand({ transcript, command: command.key, timestamp: Date.now() })
      console.log(`Executing: ${command.description}`)

      try {
        command.action()
      } catch (error) {
        console.error("Error executing voice command:", error)
      }
    } else {
      console.warn("Command not recognized:", transcript)
    }
  }, [])

  const findBestMatch = useCallback((transcript) => {
    // Direct command match
    for (const [key, command] of commands) {
      if (transcript.includes(key)) {
        return { key, ...command }
      }
    }

    // Alias match
    for (const [key, command] of commands) {
      for (const alias of command.aliases) {
        if (transcript.includes(alias)) {
          return { key, ...command }
        }
      }
    }

    // Fuzzy matching for partial matches
    const words = transcript.split(" ")
    for (const [key, command] of commands) {
      const commandWords = key.split(" ")
      const matchCount = commandWords.filter((word) => words.some((w) => w.includes(word) || word.includes(w))).length

      if (matchCount >= Math.ceil(commandWords.length / 2)) {
        return { key, ...command }
      }
    }

    return null
  }, [])

  const startListening = useCallback(async () => {
    if (!isSupported || !recognition) {
      console.warn("Voice recognition not supported")
      return false
    }

    if (isListening) {
      console.log("Already listening...")
      return false
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())

      recognition.start()
      return true
    } catch (error) {
      console.error("Error starting voice recognition:", error)
      return false
    }
  }, [isSupported, recognition, isListening])

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop()
    }
  }, [recognition, isListening])

  const showCommandHelp = useCallback(() => {
    const commandList = Array.from(commands.entries())
      .map(([key, command]) => `• "${key}" - ${command.description}`)
      .join("\n")

    const helpMessage = `Available voice commands:\n\n${commandList}\n\nSay "stop listening" to end voice recognition.`
    alert(helpMessage)
  }, [])

  const getAvailableCommands = useCallback(() => {
    return Array.from(commands.entries()).map(([key, command]) => ({
      command: key,
      description: command.description,
      aliases: command.aliases,
    }))
  }, [])

  return {
    isListening,
    isSupported,
    lastCommand,
    startListening,
    stopListening,
    getAvailableCommands,
  }
}
