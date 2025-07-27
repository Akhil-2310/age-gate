export interface User {
    id: string
    email: string
    name: string
    age?: number
    is_age_verified: boolean
    created_at: string
    updated_at: string
  }
  
  export interface Content {
    id: string
    title: string
    description?: string
    image_url: string
    minimum_age: number
    uploader_id: string
    is_active: boolean
    created_at: string
    updated_at: string
    uploader?: User
  }
  
  export interface UserContentAccess {
    id: string
    user_id: string
    content_id: string
    granted_at: string
  }
  