# AgeGate - Secure Age-Verified Content Platform

A Next.js application that provides secure age verification for content sharing using Self Protocol. Users can upload content with age restrictions and viewers must verify their age to access content.

## Features

- **Age Verification**: Uses Self Protocol for secure, privacy-preserving age verification
- **Content Upload**: Users can upload images with titles and descriptions
- **Age-Gated Viewing**: Content requires age verification to view
- **User Content Management**: Users can manage their uploaded content
- **Persistent Sessions**: Age verification persists across browser sessions

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Age Verification**: Self Protocol
- **Authentication**: Self Protocol identity system

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Self Protocol integration (ngrok tunnel for development)

## Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agegate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migration (see Database Setup section)
   - Create a storage bucket named `content-images` with public access

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Self Protocol Setup**
   - Set up ngrok tunnel for local development
   - Update the endpoint URL in the code to match your ngrok tunnel
   - For production, replace with your production API endpoint

## Database Setup

Run this SQL in your Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE, -- Self Protocol UUID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content table
CREATE TABLE content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  minimum_age INTEGER NOT NULL DEFAULT 18,
  uploader_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE content 
ADD CONSTRAINT content_uploader_id_fkey 
FOREIGN KEY (uploader_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_content_uploader_id ON content(uploader_id);
CREATE INDEX idx_content_active ON content(is_active);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on content" ON content FOR ALL USING (true);
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

### Vercel (Recommended)

1. **Deploy to Vercel**
   ```bash
   npx vercel --prod
   ```

2. **Configure Environment Variables**
   Add these environment variables in your Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Update Self Protocol Endpoint**
   - Replace the ngrok URL in the code with your production API endpoint
   - Update the endpoint in both frontend and backend Self Protocol configurations

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Build the application**
  ```bash
  npm run build
  ```

- **Start the production server**
  ```bash
  npm start
  ```

## Project Structure

```
agegate/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   └── verify/        # Self Protocol verification endpoint
│   ├── explore/           # Content exploration page
│   ├── my-content/        # User content management
│   ├── upload/            # Content upload page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable React components
├── lib/                   # Utility libraries
│   └── supabase.ts        # Supabase client configuration
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## Key Features Explained

### Age Verification Flow

1. **Upload Verification**: Users must verify their age before uploading content
2. **Viewing Verification**: Users must verify their age to view content
3. **Persistent Sessions**: Verification status is saved in localStorage
4. **Auto-verification**: Users who have uploaded content are auto-verified for viewing

### User Identity Management

- Each user gets a unique UUID generated client-side
- UUIDs are stored in localStorage and Supabase
- Self Protocol uses these UUIDs for verification
- Content ownership is tracked via uploader_id field

### Content Management

- Users can upload images with titles and descriptions
- All content has a fixed 18+ age restriction
- Users can view and delete their own content
- Content can be soft-deleted (is_active flag)

## Security Considerations

- Age verification is handled by Self Protocol's secure system
- No sensitive user data is stored on the platform
- Content access is properly gated behind age verification
- Database uses Row Level Security (RLS) policies

## Known Limitations

- Currently uses ngrok for development (replace with production endpoint)
- Fixed 18+ age requirement (could be made configurable)
- Basic content moderation (could be enhanced)
- Single file upload only (could support multiple files)

## Support

For issues related to:
- **Self Protocol**: Check Self Protocol documentation
- **Supabase**: Check Supabase documentation  
- **Next.js**: Check Next.js documentation

