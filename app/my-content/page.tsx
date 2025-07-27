"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Calendar, Eye, Lock, Trash2, Edit } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { supabase } from "@/lib/supabase"
import type { Content } from "@/types/database"

export default function MyContentPage() {
  const [accessibleContent, setAccessibleContent] = useState<Content[]>([])
  const [uploadedContent, setUploadedContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"accessible" | "uploaded">("accessible")

  // Mock user data - in real app, get from authentication
  const mockUserId = "550e8400-e29b-41d4-a716-446655440000"
  const userAge = 25
  const isAgeVerified = true

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      // Fetch content user can access (based on age verification)
      const { data: allContent, error: contentError } = await supabase
        .from("content")
        .select(`
          *,
          uploader:users(name, email)
        `)
        .eq("is_active", true)
        .lte("minimum_age", userAge)
        .order("created_at", { ascending: false })

      if (contentError) throw contentError

      // Fetch content uploaded by user
      const { data: userContent, error: userContentError } = await supabase
        .from("content")
        .select(`
          *,
          uploader:users(name, email)
        `)
        .eq("uploader_id", mockUserId)
        .order("created_at", { ascending: false })

      if (userContentError) throw userContentError

      setAccessibleContent(allContent || [])
      setUploadedContent(userContent || [])
    } catch (error) {
      console.error("Error fetching content:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return

    try {
      const { error } = await supabase.from("content").update({ is_active: false }).eq("id", contentId)

      if (error) throw error

      // Remove from local state
      setUploadedContent((prev) => prev.filter((item) => item.id !== contentId))
    } catch (error) {
      console.error("Error deleting content:", error)
      alert("Failed to delete content")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your content...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Content</h1>
          <p className="text-gray-600">Manage your uploaded content and view content you have access to.</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("accessible")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "accessible"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Accessible Content ({accessibleContent.length})
              </button>
              <button
                onClick={() => setActiveTab("uploaded")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "uploaded"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Uploads ({uploadedContent.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === "accessible" ? accessibleContent : uploadedContent).map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative">
                <Image
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.title}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />

                {/* Age Badge */}
                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  {item.minimum_age}+
                </div>

                {/* Access Status */}
                <div className="absolute top-2 left-2">
                  {isAgeVerified && userAge >= item.minimum_age ? (
                    <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      Accessible
                    </div>
                  ) : (
                    <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center">
                      <Lock className="h-3 w-3 mr-1" />
                      Restricted
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 truncate">{item.title}</h3>

                {item.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <span>By {item.uploader?.name || "Anonymous"}</span>
                </div>

                {/* Actions for uploaded content */}
                {activeTab === "uploaded" && (
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteContent(item.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty States */}
        {activeTab === "accessible" && accessibleContent.length === 0 && (
          <div className="text-center py-12">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No accessible content</h3>
            <p className="text-gray-600">Complete age verification to access age-restricted content.</p>
          </div>
        )}

        {activeTab === "uploaded" && uploadedContent.length === 0 && (
          <div className="text-center py-12">
            <div className="h-12 w-12 text-gray-400 mx-auto mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No uploaded content</h3>
            <p className="text-gray-600 mb-4">You haven't uploaded any content yet.</p>
            <a
              href="/upload"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Your First Content
            </a>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
