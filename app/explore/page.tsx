"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Lock, Eye, Calendar, User } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { supabase } from "@/lib/supabase"
import type { Content } from "@/types/database"

export default function ExplorePage() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [userAge] = useState(25) // Mock user age - in real app, get from auth
  const [isAgeVerified] = useState(true) // Mock verification status

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("content")
        .select(`
          *,
          uploader:users(name, email)
        `)
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
    return isAgeVerified && userAge >= contentItem.minimum_age
  }

  const handleContentClick = (contentItem: Content) => {
    if (canViewContent(contentItem)) {
      setSelectedContent(contentItem)
    }
  }

  const handleVerifyAge = () => {
    // In a real app, this would trigger the Self Protocol verification
    alert("Age verification would be handled by Self Protocol integration")
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
                    ? `Verified age: ${userAge} years old`
                    : "Complete age verification to access age-restricted content"}
                </p>
              </div>
            </div>
            {!isAgeVerified && (
              <button
                onClick={handleVerifyAge}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Verify Age
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
                    className="w-full h-48 object-cover"
                  />

                  {/* Age Restriction Overlay */}
                  {!canView && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Lock className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-semibold">{item.minimum_age}+ Only</p>
                        <p className="text-sm">Age verification required</p>
                      </div>
                    </div>
                  )}

                  {/* Age Badge */}
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    {item.minimum_age}+
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">{item.title}</h3>

                  {item.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      <span>{item.uploader?.name || "Anonymous"}</span>
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
                  <span>By {selectedContent.uploader?.name || "Anonymous"}</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    {selectedContent.minimum_age}+ Content
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
