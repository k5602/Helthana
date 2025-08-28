"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "../contexts/LanguageContext"
import { useApi } from "../hooks/useApi"

export function PrescriptionScanner({ onClose, onSuccess, onError }) {
  const { t } = useLanguage()
  const { apiCall } = useApi()

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const [stream, setStream] = useState(null)
  const [devices, setDevices] = useState([])
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResults, setOcrResults] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [cameraError, setCameraError] = useState(null)

  useEffect(() => {
    initializeCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const initializeCamera = async () => {
    try {
      // Check camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("cameraNotSupported")
        return
      }

      // Get available devices
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = deviceList.filter((device) => device.kind === "videoinput")
      setDevices(videoDevices)

      // Request camera permission and start stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Camera initialization failed:", error)
      setCameraError("permissionDenied")
    }
  }

  const switchCamera = async () => {
    if (devices.length <= 1) {
      onError(t("prescriptions.camera.noAlternative"))
      return
    }

    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      const nextIndex = (currentDeviceIndex + 1) % devices.length
      const deviceId = devices[nextIndex].deviceId

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      })

      setStream(newStream)
      setCurrentDeviceIndex(nextIndex)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
    } catch (error) {
      console.error("Failed to switch camera:", error)
      onError(t("prescriptions.camera.switchError"))
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          await uploadPrescriptionImage(blob)
        }
      },
      "image/jpeg",
      0.8,
    )
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      await uploadPrescriptionImage(file)
    }
  }

  const uploadPrescriptionImage = async (imageFile) => {
    try {
      setIsProcessing(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append("image", imageFile)
      formData.append("process_ocr", "true")

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await apiCall("/api/prescriptions/upload", "POST", formData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ocr_result) {
        setOcrResults({
          ...response.ocr_result,
          prescriptionId: response.id,
        })
      } else {
        onSuccess(response)
      }
    } catch (error) {
      console.error("Upload failed:", error)
      onError(t("prescriptions.uploadError"))
    } finally {
      setIsProcessing(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const savePrescriptionFromOcr = async () => {
    try {
      const prescriptionData = {
        medication_name: ocrResults.medication_name,
        dosage: ocrResults.dosage,
        frequency: ocrResults.frequency,
        doctor_name: ocrResults.doctor_name,
        instructions: ocrResults.instructions,
      }

      await apiCall(`/api/prescriptions/${ocrResults.prescriptionId}`, "PUT", prescriptionData)
      onSuccess(prescriptionData)
    } catch (error) {
      console.error("Failed to save prescription:", error)
      onError(t("prescriptions.saveError"))
    }
  }

  const renderCameraError = () => {
    const errorMessages = {
      cameraNotSupported: {
        icon: "📷",
        title: t("prescriptions.camera.unsupported"),
        subtitle: t("prescriptions.camera.uploadOnly"),
      },
      permissionDenied: {
        icon: "🚫",
        title: t("prescriptions.camera.permissionDenied"),
        subtitle: t("prescriptions.camera.enableInstructions"),
      },
    }

    const error = errorMessages[cameraError]
    if (!error) return null

    return (
      <div className="flex items-center justify-center h-64 bg-base-200 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-4">{error.icon}</div>
          <p className="text-base-content/70 mb-2">{error.title}</p>
          <p className="text-sm text-base-content/50">{error.subtitle}</p>
          {cameraError === "permissionDenied" && (
            <button onClick={initializeCamera} className="btn btn-sm btn-primary mt-3">
              {t("prescriptions.camera.tryAgain")}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        <h3 className="font-bold text-lg mb-4">{t("prescriptions.scanner.title")}</h3>

        {!ocrResults ? (
          <div>
            {/* Camera View */}
            <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "4/3" }}>
              {cameraError ? (
                renderCameraError()
              ) : (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanner Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-white border-dashed rounded-lg w-4/5 h-3/4 flex items-center justify-center">
                      <p className="text-white text-center px-4">{t("prescriptions.scanner.align")}</p>
                    </div>
                  </div>

                  {/* Processing Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <span className="loading loading-spinner loading-lg mb-2"></span>
                        <p>{t("prescriptions.scanner.processing")}</p>
                        {uploadProgress > 0 && (
                          <progress
                            className="progress progress-primary w-32 mt-2"
                            value={uploadProgress}
                            max="100"
                          ></progress>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Scanner Controls */}
            <div className="flex justify-center gap-4 mb-4">
              <button onClick={capturePhoto} className="btn btn-primary btn-lg" disabled={isProcessing || cameraError}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                  />
                </svg>
                {t("prescriptions.scanner.capture")}
              </button>

              {devices.length > 1 && (
                <button onClick={switchCamera} className="btn btn-outline" disabled={isProcessing}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3 3-3"
                    />
                  </svg>
                  {t("prescriptions.scanner.switch")}
                </button>
              )}

              <label className="btn btn-outline" htmlFor="file-upload">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
                {t("prescriptions.scanner.upload")}
              </label>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
            </div>
          </div>
        ) : (
          /* OCR Results */
          <div className="space-y-4">
            <div className="divider">{t("prescriptions.ocr.results")}</div>
            <div className="bg-base-200 rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">{t("prescriptions.medication.name")}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={ocrResults.medication_name || ""}
                    onChange={(e) => setOcrResults((prev) => ({ ...prev, medication_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">{t("prescriptions.dosage")}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={ocrResults.dosage || ""}
                    onChange={(e) => setOcrResults((prev) => ({ ...prev, dosage: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">{t("prescriptions.frequency")}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={ocrResults.frequency || ""}
                    onChange={(e) => setOcrResults((prev) => ({ ...prev, frequency: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">{t("prescriptions.doctor.name")}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={ocrResults.doctor_name || ""}
                    onChange={(e) => setOcrResults((prev) => ({ ...prev, doctor_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="label">
                  <span className="label-text">{t("prescriptions.instructions")}</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows="3"
                  value={ocrResults.instructions || ""}
                  onChange={(e) => setOcrResults((prev) => ({ ...prev, instructions: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{t("prescriptions.confidence")}</span>
                  <div
                    className={`badge ${
                      (ocrResults.confidence || 0) >= 0.8
                        ? "badge-success"
                        : (ocrResults.confidence || 0) >= 0.6
                          ? "badge-warning"
                          : "badge-error"
                    }`}
                  >
                    {Math.round((ocrResults.confidence || 0) * 100)}%
                  </div>
                </div>
                <button onClick={savePrescriptionFromOcr} className="btn btn-primary">
                  {t("prescriptions.save")}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button onClick={onClose} className="btn">
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  )
}
