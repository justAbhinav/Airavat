"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, Mail, CheckCircle, AlertCircle, FileText, Shield, Send, Clock } from "lucide-react"
import Link from "next/link"

interface FormData {
  emailId: string
  userId: string
  file: File | null
  activationTime: string
}

interface TokenFormData {
  tokenId: string
  emailId: string
  messageBody: string
}

interface FormErrors {
  emailId?: string
  userId?: string
  file?: string
  messageBody?: string
  activationTime?: string
}

export default function SendMailPage() {
  const [formData, setFormData] = useState<FormData>({
    emailId: "",
    userId: "",
    file: null,
    activationTime: "",
  })
  const [tokenFormData, setTokenFormData] = useState<TokenFormData>({
    tokenId: "",
    emailId: "",
    messageBody: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingToken, setIsGeneratingToken] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [currentStep, setCurrentStep] = useState<"initial" | "token-generated">("initial")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleTokenInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setTokenFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({
      ...prev,
      file,
    }))

    if (errors.file) {
      setErrors((prev) => ({
        ...prev,
        file: undefined,
      }))
    }
  }

  // Helper function to calculate duration in seconds
  const calculateActiveDurationSeconds = (activationTime: string): number => {
    if (!activationTime) return 0
    
    const currentTime = new Date()
    const selectedTime = new Date(activationTime)
    
    // If selected time is in the past or current, return 0
    if (selectedTime <= currentTime) {
      return 0
    }
    
    // Calculate difference in seconds
    const diffInMs = selectedTime.getTime() - currentTime.getTime()
    return Math.floor(diffInMs / 1000)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.emailId.trim()) {
      newErrors.emailId = "Email ID is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      newErrors.emailId = "Please enter a valid email address"
    }

    // User ID validation
    if (!formData.userId.trim()) {
      newErrors.userId = "User ID is required"
    } else if (formData.userId.length < 3) {
      newErrors.userId = "User ID must be at least 3 characters long"
    }

    // File validation (optional but if provided, should be valid)
    if (formData.file) {
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ]

      if (formData.file.size > maxSize) {
        newErrors.file = "File size must be less than 10MB"
      } else if (!allowedTypes.includes(formData.file.type)) {
        newErrors.file = "File type not supported. Please use PDF, DOC, DOCX, TXT, JPG, or PNG"
      }
    }

    // Activation time validation
    if (!formData.activationTime.trim()) {
      newErrors.activationTime = "Token activation time is required"
    } else {
      const activeDurationSeconds = calculateActiveDurationSeconds(formData.activationTime)
      if (activeDurationSeconds <= 0) {
        newErrors.activationTime = "Activation time must be in the future"
      } else if (activeDurationSeconds < 60) {
        newErrors.activationTime = "Activation time must be at least 1 minute from now"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateTokenForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Message body validation
    if (!tokenFormData.messageBody.trim()) {
      newErrors.messageBody = "Message body is required"
    } else if (tokenFormData.messageBody.length < 10) {
      newErrors.messageBody = "Message body must be at least 10 characters long"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus("idle")

    if (!validateForm()) {
      setSubmitStatus("error")
      setStatusMessage("Please fix the errors above")
      return
    }

    setIsGeneratingToken(true)

    try {
      // Calculate activation duration in seconds
      const activeDurationSeconds = calculateActiveDurationSeconds(formData.activationTime)
      
      // Prepare form data for webhook integration
      const tokenData = {
        emailId: formData.emailId,
        userId: formData.userId,
        activeDurationSeconds,
        file: formData.file ? {
          name: formData.file.name,
          size: formData.file.size,
          type: formData.file.type
        } : null
      }

      // Generate token via TLS API (which will call the webhook)
      const response = await fetch("/api/generateToken", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: JSON.stringify(tokenData),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Set token form data with generated token and pre-filled email
        setTokenFormData({
          tokenId: result.tokenId,
          emailId: formData.emailId,
          messageBody: "",
        })
        
        setCurrentStep("token-generated")
        setSubmitStatus("success")
        setStatusMessage("Token generated successfully! You can now compose your message.")
      } else {
        throw new Error("Failed to generate token")
      }
    } catch (error) {
      setSubmitStatus("error")
      setStatusMessage("Failed to generate token. Please try again.")
    } finally {
      setIsGeneratingToken(false)
    }
  }

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus("idle")

    if (!validateTokenForm()) {
      setSubmitStatus("error")
      setStatusMessage("Please fix the errors above")
      return
    }

    setIsSubmitting(true)

    try {
      // Send email via SMTP
      const response = await fetch("/api/sendMail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: tokenFormData.tokenId,
          to: tokenFormData.emailId,
          subject: `Message from Token ${tokenFormData.tokenId}`,
          messageBody: tokenFormData.messageBody,
        }),
      })

      if (response.ok) {
        setSubmitStatus("success")
        setStatusMessage("Email sent successfully!")
        
        // Reset everything
        setFormData({
          emailId: "",
          userId: "",
          file: null,
          activationTime: "",
        })
        setTokenFormData({
          tokenId: "",
          emailId: "",
          messageBody: "",
        })
        setCurrentStep("initial")
      } else {
        throw new Error("Failed to send email")
      }
    } catch (error) {
      setSubmitStatus("error")
      setStatusMessage("Failed to send email. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Send Mail</h1>
            <p className="text-gray-600 mt-1">Send communications to users and stakeholders</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2 bg-white">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>

        {/* Main Form */}
        {currentStep === "initial" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Generate TLS Token
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateToken} className="space-y-6">
                {/* Email ID */}
                <div className="space-y-2">
                  <Label htmlFor="emailId">Email ID *</Label>
                  <Input
                    id="emailId"
                    name="emailId"
                    type="email"
                    placeholder="recipient@example.com"
                    value={formData.emailId}
                    onChange={handleInputChange}
                    className={`w-full ${errors.emailId ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  {errors.emailId && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.emailId}
                    </p>
                  )}
                </div>

                {/* User ID */}
                <div className="space-y-2">
                  <Label htmlFor="userId">Unique User ID *</Label>
                  <Input
                    id="userId"
                    name="userId"
                    type="text"
                    placeholder="Enter unique user identifier"
                    value={formData.userId}
                    onChange={handleInputChange}
                    className={`w-full ${errors.userId ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  {errors.userId && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.userId}
                    </p>
                  )}
                </div>

                {/* File Attachment */}
                <div className="space-y-2">
                  <Label htmlFor="file-upload">File Attachment (Optional)</Label>
                  <div className="space-y-2">
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileChange}
                      className={`w-full ${errors.file ? "border-red-500 focus:border-red-500" : ""}`}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    />
                    {formData.file && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-800">{formData.file.name}</span>
                        <span className="text-xs text-blue-600 ml-auto">
                          {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                    {errors.file && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.file}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)</p>
                </div>

                {/* Token Activation Time */}
                <div className="space-y-2">
                  <Label htmlFor="activationTime" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Token Activation Time *
                  </Label>
                  <Input
                    id="activationTime"
                    name="activationTime"
                    type="datetime-local"
                    value={formData.activationTime}
                    onChange={handleInputChange}
                    className={`w-full ${errors.activationTime ? "border-red-500 focus:border-red-500" : ""}`}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} // Minimum 1 minute from now
                  />
                  {errors.activationTime && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.activationTime}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Select when the token should become active. Current time: {new Date().toLocaleString()}
                  </p>
                </div>

                {/* Status Messages */}
                {submitStatus === "success" && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{statusMessage}</AlertDescription>
                  </Alert>
                )}

                {submitStatus === "error" && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{statusMessage}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isGeneratingToken}>
                  {isGeneratingToken ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Token...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Send to TLS
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Token Generated Form */}
        {currentStep === "token-generated" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Compose Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMail} className="space-y-6">
                {/* Token ID (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="tokenId">Token ID</Label>
                  <Input
                    id="tokenId"
                    name="tokenId"
                    type="text"
                    value={tokenFormData.tokenId}
                    readOnly
                    className="w-full bg-gray-50 cursor-not-allowed"
                  />
                </div>

                {/* Email ID (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="emailId">Email ID</Label>
                  <Input
                    id="emailId"
                    name="emailId"
                    type="email"
                    value={tokenFormData.emailId}
                    readOnly
                    className="w-full bg-gray-50 cursor-not-allowed"
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-2">
                  <Label htmlFor="messageBody">Message Body *</Label>
                  <Textarea
                    id="messageBody"
                    name="messageBody"
                    placeholder="Enter your message here..."
                    value={tokenFormData.messageBody}
                    onChange={handleTokenInputChange}
                    className={`w-full min-h-[120px] ${errors.messageBody ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  {errors.messageBody && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.messageBody}
                    </p>
                  )}
                </div>

                {/* Status Messages */}
                {submitStatus === "success" && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{statusMessage}</AlertDescription>
                  </Alert>
                )}

                {submitStatus === "error" && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{statusMessage}</AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep("initial")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending Mail...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Mail
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Integration Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">TLS Token & SMTP Integration Ready</p>
                <p>
                  Token generation via <code className="bg-blue-100 px-1 rounded">/api/generateToken</code> and 
                  email sending via <code className="bg-blue-100 px-1 rounded">/api/sendMail</code> with 
                  Nodemailer SMTP support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
