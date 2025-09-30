"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Lock, Eye, Calendar, User, Shield } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { supabase } from "@/lib/supabase"
import type { Content } from "@/types/database"
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode"
import { v4 as uuidv4 } from 'uuid'

export default function ExplorePage() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [isAgeVerified, setIsAgeVerified] = useState(false) // Real verification status
  const [showVerification, setShowVerification] = useState(false)
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  useEffect(() => {
    fetchContent()
    generateViewingUserId()
    
    // Check if user was previously age verified or is an uploader
    try {
      const savedVerificationStatus = localStorage.getItem('ageGateVerified')
      const uploaderUserId = localStorage.getItem('ageGateUploaderUserId')
      
      if (savedVerificationStatus === 'true') {
        setIsAgeVerified(true)
      } else if (uploaderUserId) {
        setIsAgeVerified(true)
        // Save verification status for consistency
        localStorage.setItem('ageGateVerified', 'true')
      }
    } catch (error) {
      console.warn('localStorage not available for verification check:', error)
    }
  }, [])

  const generateViewingUserId = () => {
    try {
      // Check if we already have a viewing user ID in localStorage
      let userId = localStorage.getItem('ageGateViewingUserId')
      
      if (!userId) {
        // Generate new ID only if one doesn't exist
        userId = uuidv4()
        localStorage.setItem('ageGateViewingUserId', userId)
      }
      
      setViewingUserId(userId)
    } catch (error) {
      // Fallback if localStorage is not available
      console.warn('localStorage not available, using session-only ID:', error)
      const userId = uuidv4()
      setViewingUserId(userId)
    }
  }

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setContent(data || [])
    } catch (error) {
      console.error("Error fetching content:", error)
    } finally {
      setLoading(false)
    }
  }

  const canViewContent = (contentItem: Content) => {
    return isAgeVerified // Age verification already confirms 18+, and all content requires 18+
  }

  // Create Self app for age verification
  useEffect(() => {
    if (!viewingUserId) return
    
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: "AgeGate",
        scope: "agegate",
        endpoint: "0xb6b9918c5880f7a1a4c65c4c4b6297956b4c39ad",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: viewingUserId,
        endpointType: "celo",
        userIdType: "uuid",
        userDefinedData: "Welcome to AgeGate!",
        disclosures: {
          minimumAge: 18,
          ofac: false,
          excludedCountries:[],
        }
      }).build();
      
      setSelfApp(app);
    } catch (error) {
      console.error('Failed to create Self app:', error)
      setSelfApp(null)
    }
  }, [viewingUserId])

  const handleContentClick = (contentItem: Content) => {
    if (canViewContent(contentItem)) {
      setSelectedContent(contentItem)
    } else {
      // Show age verification modal
      setShowVerification(true)
      setVerificationError(null)
    }
  }

  const handleVerifyAge = () => {
    setShowVerification(true)
    setVerificationError(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Content</h1>
          <p className="text-gray-600">Discover age-appropriate content from our community of creators.</p>
        </div>

        {/* Age Verification Status */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${isAgeVerified ? "bg-green-500" : "bg-red-500"}`}></div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Age Verification Status: {isAgeVerified ? "Verified" : "Not Verified"}
                </h3>
                <p className="text-sm text-gray-600">
                  {isAgeVerified
                    ? "Verified as 18+ years old"
                    : "Complete age verification to access age-restricted content"}
                </p>
              </div>
            </div>
            {!isAgeVerified ? (
              <button
                onClick={handleVerifyAge}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Verify Age
              </button>
            ) : (
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('ageGateVerified')
                    localStorage.removeItem('ageGateViewingUserId')
                    setIsAgeVerified(false)
                    // Regenerate new viewing user ID
                    generateViewingUserId()
                  } catch (error) {
                    console.warn('Could not clear verification data:', error)
                  }
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Clear Verification
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item) => {
            const canView = canViewContent(item)

            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  canView ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                }`}
                onClick={() => handleContentClick(item)}
              >
                <div className="relative">
                  <Image
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.title}
                    width={400}
                    height={300}
                    className={`w-full h-48 object-cover transition-all duration-300 ${
                      !canView ? "blur-md" : ""
                    }`}
                  />

                  {/* Age Restriction Overlay */}
                  {!canView && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Lock className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-semibold">18+ Content</p>
                        <p className="text-sm">Click to verify age and view</p>
                      </div>
                    </div>
                  )}

                  {/* Age Badge */}
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    18+
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">{item.title}</h3>

                  {item.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      <span>User {item.uploader_id?.slice(0, 8) || "Anonymous"}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {content.length === 0 && (
          <div className="text-center py-12">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No content available</h3>
            <p className="text-gray-600">Be the first to upload content to the platform!</p>
          </div>
        )}
      </div>

      {/* Content Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedContent.title}</h2>
                <button onClick={() => setSelectedContent(null)} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <Image
                src={selectedContent.image_url || "/placeholder.svg"}
                alt={selectedContent.title}
                width={600}
                height={400}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />

              {selectedContent.description && <p className="text-gray-600 mb-4">{selectedContent.description}</p>}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>By User {selectedContent.uploader_id?.slice(0, 8) || "Anonymous"}</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    18+ Content
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Age Verification Modal */}
      {showVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Age Verification Required
                </h2>
                <button 
                  onClick={() => setShowVerification(false)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-700 mb-6">
                You must verify that you are 18 years or older to view this content.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                {selfApp ? (
                  <SelfQRcodeWrapper 
                    selfApp={selfApp}
                    onSuccess={() => {
                      setIsAgeVerified(true)
                      setShowVerification(false)
                      setVerificationError(null)
                      setIsVerifying(false)
                      
                      // Save verification status to localStorage
                      try {
                        localStorage.setItem('ageGateVerified', 'true')
                      } catch (error) {
                        console.warn('Could not save verification status to localStorage:', error)
                      }
                    }}
                    onError={(data: { error_code?: string; reason?: string; status?: string }) => {
                      console.error('Self verification error:', data)
                      
                      let errorMessage = 'Verification failed. Please try again.'
                      
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
                    {viewingUserId ? 'Initializing verification...' : 'Loading verification system...'}
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mt-4 mb-2">
                  Scan QR code with Self app to verify you are 18+ years old
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
              
              {verificationError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{verificationError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
