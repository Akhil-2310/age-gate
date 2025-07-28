"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, ImageIcon, AlertCircle, Shield, CheckCircle2 } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { supabase } from "@/lib/supabase"
import {
    SelfQRcodeWrapper,
    SelfAppBuilder,
    type SelfApp,
  } from "@selfxyz/qrcode";
  import { v4 as uuidv4 } from 'uuid';

export default function UploadPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const minimumAge = 18 // Fixed minimum age for all content
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  
  // Age verification states
  const [userId, setUserId] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedAge, setVerifiedAge] = useState<number | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [showVerification, setShowVerification] = useState(false)

  // Generate userId and store in Supabase and localStorage
  useEffect(() => {
    const generateAndStoreUserId = async () => {
      try {
        // Check if user already has an uploader ID in localStorage
        const existingUserId = localStorage.getItem('ageGateUploaderUserId')
        
        if (existingUserId) {
          setUserId(existingUserId)
          return // Exit early if user ID already exists
        }

        // Generate new user ID only if one doesn't exist
        const newUserId = uuidv4()
        setUserId(newUserId)
        
        // Store uploader user ID in localStorage
        localStorage.setItem('ageGateUploaderUserId', newUserId)
        
        // Store userId in Supabase
        const { error } = await supabase
          .from('users')
          .insert({ 
            user_id: newUserId,
            created_at: new Date().toISOString()
          })
        
        if (error) {
          console.error('Error storing user ID in Supabase:', error)
        }
      } catch (error) {
        console.error('Failed to handle user ID:', error)
        // Fallback: create session-only ID
        const fallbackUserId = uuidv4()
        setUserId(fallbackUserId)
      }
    }
    
    generateAndStoreUserId()
  }, [])

  // Check if verification is needed when age verification changes
  useEffect(() => {
    if (isVerified && verifiedAge !== null) {
      if (verifiedAge < minimumAge) {
        setIsVerified(false)
        setVerificationError(`You need to be at least ${minimumAge} years old to upload this type of content.`)
      } else {
        setVerificationError(null)
      }
    }
  }, [isVerified, verifiedAge])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const startVerification = () => {
    setShowVerification(true)
    setVerificationError(null)
  }

    // Create Self app instance when verification is needed
  useEffect(() => {
    if (!userId) {
      return
    }
    
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: "AgeGate",
        scope: "agegate",
        endpoint: "https://age-gate-nine.vercel.app/api/verify",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "https",
        userIdType: "uuid",
        userDefinedData: "Welcome to AgeGate!",
        devMode: true,
        disclosures: {
          minimumAge: 18,
          ofac: false,
          excludedCountries:[],
        }
      }).build();
      
      setSelfApp(app);
    } catch (error) {
      console.error('Failed to create Self app for upload:', error)
      setSelfApp(null)
    }
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile || !title) return

    setIsUploading(true)
    setUploadStatus("idle")

    try {
      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("content-images")
        .upload(fileName, imageFile)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("content-images").getPublicUrl(fileName)

      // Use the generated userId
      if (!userId) {
        throw new Error('User ID not available')
      }

      // Insert content record with the Self Protocol user_id
      const { error: insertError } = await supabase.from("content").insert({
        title,
        description,
        image_url: publicUrl,
        minimum_age: 18, // Fixed minimum age
        uploader_id: userId,  // This is our Self Protocol UUID
      })

      if (insertError) throw insertError

      setUploadStatus("success")
      
      // Show success message briefly then redirect
      setTimeout(() => {
        router.push('/explore')
      }, 2000)
      
      // Reset form
      setTitle("")
      setDescription("")
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus("error")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Content</h1>
            <p className="text-gray-600">
              Share your content with age-appropriate restrictions to ensure responsible access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Image *</label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter content title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your content..."
              />
            </div>

            {/* Fixed Minimum Age Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Age Restriction: 18+</p>
                  <p className="text-sm text-blue-700">All content uploaded to this platform requires viewers to be 18 years or older.</p>
                </div>
              </div>
            </div>

            {/* Age Verification Section */}
            {userId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <Shield className="h-6 w-6 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Age Verification Required</h3>
                    <p className="text-yellow-700 mb-4">
                      Since you're uploading content with a minimum age requirement of {minimumAge}+, you must first verify that you meet this age requirement yourself.
                    </p>
                    
                    {!isVerified ? (
                      <div>
                        {!showVerification ? (
                          <button
                            type="button"
                            onClick={startVerification}
                            className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Verify My Age ({minimumAge}+)
                          </button>
                        ) : (
                          <div className="bg-white border border-yellow-300 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">Complete Age Verification</h4>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                              {selfApp ? (
                                <SelfQRcodeWrapper 
                                  selfApp={selfApp}
                                  onSuccess={() => {
                                    // Verification completed successfully
                                    setIsVerified(true)
                                    setVerifiedAge(18) // Fixed age verification
                                    setShowVerification(false)
                                    setVerificationError(null)
                                    setIsVerifying(false)
                                    
                                    // Save verification status for viewing content later
                                    try {
                                      localStorage.setItem('ageGateVerified', 'true')
                                    } catch (error) {
                                      console.warn('Could not save verification status:', error)
                                    }
                                  }}
                                  onError={(data: { error_code?: string; reason?: string; status?: string }) => {
                                    console.error('Self verification error:', data)
                                    
                                    let errorMessage = 'Verification failed. Please try again.'
                                    
                                    // Handle the new backend error format
                                    if (data.reason) {
                                      errorMessage = data.reason
                                    } else if (data.error_code) {
                                      switch(data.error_code) {
                                        case 'INVALID_INPUTS':
                                          errorMessage = 'Invalid verification data provided.'
                                          break
                                        case 'VERIFICATION_FAILED':
                                          errorMessage = 'Age verification failed. Please ensure you meet the age requirement.'
                                          break
                                        case 'INTERNAL_ERROR':
                                          errorMessage = 'Internal server error. Please try again later.'
                                          break
                                        default:
                                          errorMessage = 'Verification failed. Please try again.'
                                      }
                                    }
                                    
                                    setVerificationError(errorMessage)
                                    setIsVerifying(false)
                                  }}
                                />
                              ) : (
                                <div className="p-8 text-gray-500">
                                  {userId ? 'Initializing verification...' : 'Loading user session...'}
                                </div>
                              )}
                              
                              <p className="text-sm text-gray-600 mt-4 mb-2">
                                Scan QR code with Self app to verify you are {minimumAge}+ years old
                              </p>
                              <p className="text-xs text-gray-500">
                                Don't have the Self app? Download it from your app store
                              </p>
                              
                              {isVerifying && (
                                <div className="mt-4 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                  <span className="text-sm text-gray-600">Verifying...</span>
                                </div>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setShowVerification(false)}
                              className="mt-4 text-sm text-gray-600 hover:text-gray-700"
                            >
                              Cancel Verification
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center text-green-700">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        <span className="font-medium">Age verified for {minimumAge}+ content</span>
                      </div>
                    )}
                    
                    {verificationError && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{verificationError}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {uploadStatus === "success" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-green-600">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="ml-2 text-sm text-green-700">Content uploaded successfully!</p>
                </div>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-600">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="ml-2 text-sm text-red-700">Upload failed. Please try again.</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!imageFile || !title || !userId || isUploading || !isVerified || (verifiedAge !== null && verifiedAge < minimumAge)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Content
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}
