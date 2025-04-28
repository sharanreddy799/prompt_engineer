# ✨ LatexFormatter - AI-powered LaTeX Resume Tailor

This project is a **full-stack, production-grade** web application that helps users **refine and tailor** their LaTeX resumes based on a job description — powered by **Next.js 15**, **NextAuth.js**, **PostgreSQL**, **Google Cloud Storage**, and **OpenAI Groq API**.

---

## 🌟 Features

- 🖋️ AI-powered generation of customized LaTeX resumes.
- 🔐 Google OAuth 2.0 Authentication using NextAuth.js.
- 🗄️ Cloud storage of generated `.tex` files in Google Cloud Storage (GCS).
- 🧠 User-specific history: view past resume generations.
- 📝 Clean, modularized frontend with TailwindCSS.
- 🌩️ Hosted on Vercel with environment-based configuration.
- ⚡ Full backend API using Next.js App Router.

---

## 🚀 Tech Stack

| Category        | Tools/Frameworks                         |
|-----------------|-------------------------------------------|
| Frontend        | Next.js 15 App Router, Tailwind CSS       |
| Backend         | Next.js Server Actions, API Routes       |
| Authentication  | NextAuth.js with Google OAuth2.0         |
| Database        | PostgreSQL (user management + resumes)   |
| Cloud Storage   | Google Cloud Storage (public `.tex` links)|
| AI Integration  | Groq API (OpenAI compatible endpoint)     |
| Hosting         | Vercel                                   |

---

## 📂 Project Structure

```bash
/app
  /auth        # Authentication routes
  /dashboard   # Main Dashboard page (Latex & Job Input, Output)
    /components
      Header.tsx
      Footer.tsx
      LatexInput.tsx
      JobDescriptionInput.tsx
      ActionButtons.tsx
      OutputArea.tsx
  /history     # History page (past resumes)
  /api
    /auth      # NextAuth route
    /save      # Save resume and user record
    /history   # Fetch saved resumes
    /groq      # AI generation
  /lib
    authOptions.js   # Centralized NextAuth config
    gcsUpload.ts     # Google Cloud Storage helper
 
```

---

## 🛠 Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/prompt_engineer.git
cd latexformatter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

NEXTAUTH_SECRET=your-nextauth-secret

DATABASE_URL=your-postgres-connection-url

GCS_PROJECT_ID=your-gcp-project-id
GCS_CLIENT_EMAIL=your-gcp-client-email
GCS_PRIVATE_KEY="your-gcp-private-key"
GCS_BUCKET_NAME=your-gcp-bucket-name
```

---

### 4. Setup Google Cloud Storage (GCS)

- Create a **GCS Bucket** (ensure uniform bucket access is enabled).
- Create a **Service Account** with `Storage Object Admin` role.
- Use the service account credentials in environment variables.
- Make uploaded objects public if you want public download links.

### 5. Setup Google OAuth Credentials

- Go to [Google Cloud Console → OAuth Consent Screen → Credentials](https://console.cloud.google.com/apis/credentials).
- Create OAuth client credentials.
- Set **Authorized Redirect URIs**:

```text
http://localhost:3000/api/auth/callback/google
https://your-production-url.vercel.app/api/auth/callback/google
```

### 6. Database Schema

Tables needed:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE resume_db (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  latex_output TEXT NOT NULL,
  latex_file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7. Running Locally

```bash
npm run dev
```

Available at [http://localhost:3000](http://localhost:3000)

---

## 🧠 Core Workflows

1. **User signs in** using Google OAuth.
2. **User pastes LaTeX** template and **Job description**.
3. **AI tailors the resume** to match the job.
4. **User saves the tailored resume** to database and GCS.
5. **View past resumes** in History tab linked to user.

---

## 📈 Future Enhancements

- Full PDF generation from `.tex` files.
- Live resume preview and download.
- Resume versioning and comparison tools.
- Scoring system based on job relevance.
- Enhanced UI with Skeleton Loaders.

---

## 👨‍💻 Author

Built with ❤️ by **Sai Sharan Karam**.

If you like this project, please ⭐ the repo and share!

---

## 🎉 License

This project is licensed under the **MIT License**.

---

> "Empowering resumes for the future, one LaTeX line at a time." ✨

