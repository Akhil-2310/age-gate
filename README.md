# AgeGate - Secure Age-Verified Content Platform

A Next.js application that provides secure age verification for content sharing using Self Protocol. Users can upload content with age restrictions and viewers must verify their age to access content.

## Features

- **Age Verification**: Uses Self Protocol for secure, privacy-preserving age verification
- **Content Upload**: Users can upload images with titles and descriptions
- **Age-Gated Viewing**: Content requires age verification to view
- **User Content Management**: Users can manage their uploaded content
- **Persistent Sessions**: Age verification persists across browser sessions

## [Demo](https://www.loom.com/share/e741436e1e2c46b684b9540d7dc95baf)

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









