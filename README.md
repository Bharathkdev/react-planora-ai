<div align="center">
  <h1>Planora AI</h1>
  <p>Transform 2D floor plans into photorealistic 3D renders using Generative AI</p>
</div>

<div align="center">
  <img src="https://github.com/user-attachments/assets/0f8f89da-097e-46a7-aa68-27938abb2def" width="48%" />
  <img src="https://github.com/user-attachments/assets/f6b305ca-a3ec-4209-84d4-32dcd3b8945c" width="48%" />
</div>

---

## 📋 Table of Contents

1. 🤖 [Introduction](#introduction)  
2. ⚙️ [Tech Stack](#tech-stack)  
3. 🔋 [Features](#features)  
4. 🏗️ [Architecture](#architecture)  
5. 🚀 [Quick Start](#quick-start)

---

## <a name="introduction">🤖 Introduction</a>

**Planora AI** is an AI-powered architectural visualization platform that converts 2D floor plans into realistic 3D interior renders in seconds.

**Upload a blueprint → AI understands spatial layout → generates a furnished photorealistic scene.**

The project demonstrates a complete modern AI SaaS architecture:
- **Image-to-Image Generative AI**: High-fidelity spatial translation.
- **Persistent storage & hosting**: Reliable asset management.
- **Serverless backend workers**: Scalable logic without managing servers.
- **Client-side rendering & download pipeline**: High-performance browser interactions.
- **Real production-like system design**: Industrial-grade modularity.

Instead of static design tools, Planora acts as a **visual thinking engine for architects, designers, and creators**.

---

## <a name="tech-stack">⚙️ Tech Stack</a>

### Frontend
- **React**: Component-based UI.
- **React Router**: Full-stack routing & SSR capabilities.
- **TypeScript**: Type-safe development.
- **Vite**: Ultra-fast build tool.
- **TailwindCSS**: Utility-first styling.
- **Canvas API**: Advanced image manipulation.

### AI & Backend
- **Puter.js**: Handing Auth, KV storage, Hosting, and Workers.
- **Gemini Image Model**: Core Image-to-Image rendering engine.
- **Serverless Edge Workers**: Low-latency backend processing.
- **KV Storage Database**: For high-speed metadata retrieval.
- **CDN Hosting**: Global delivery of generated assets.

### Image Processing
- **FileReader API**: Local file handling.
- **Canvas Rendering**: Processing raw image data.
- **Blob & Base64 normalization**: Universal data formats.
- **CORS-safe downloading**: Secure asset retrieval.

---

## <a name="features">🔋 Features</a>

👉 **2D → 3D AI Rendering** Upload a floor plan and generate a furnished, photorealistic interior automatically.

👉 **AI Image-to-Image Pipeline** Processes spatial layouts using a multimodal generative model.

👉 **Persistent Project Storage** Projects saved in KV database while images are stored in CDN hosting.

👉 **Instant Image Download** Download rendered images directly without opening a new tab.

👉 **Before / After Comparison** Interactive slider to compare blueprint vs generated interior.

👉 **Serverless Architecture** No traditional backend — powered entirely by edge workers.

👉 **Authentication System** Secure login using Puter Auth with per-user storage.

👉 **Smart Asset Hosting** AI outputs normalized and uploaded permanently for reuse & sharing.

👉 **Upload Experience Simulation** Smooth progress animation while AI processing happens.

👉 **Optimized Rendering Flow**
    - Base64 normalization
    - MIME detection
    - Cross-origin safe canvas rendering
    
👉 **Scalable Storage Design**
    - KV stores metadata only
    - CDN stores heavy assets
    - Worker API acts as database layer
    
👉 **Clean Modular Architecture**
    Separation of UI, AI processing, storage, hosting, and worker backend.

---

## <a name="architecture">🏗️ Architecture</a>

The application follows a linear, high-efficiency flow:

1. **User Upload**: Floor plan provided via React UI.
2. **AI Generation**: Gemini processes the image to create a 3D render.
3. **Normalization**: Image is converted via Canvas to a standard PNG format.
4. **CDN Upload**: Asset is hosted permanently on the CDN.
5. **Database Entry**: Metadata and asset links are stored in KV storage.
6. **UI Retrieval**: Client displays the final render with comparison tools.

**Pattern**: `Frontend → Worker API → AI → Hosting → Database`

---

## <a name="quick-start">🚀 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Environment Variables**

Planora AI requires a configuration for the AI worker endpoint. Create a `.env.local` file in the project root (if not already present) and add the following:

```env
VITE_PUTER_WORKER_URL=https://your-worker-url.puter.work
```

**Cloning the Repository**

```bash
git clone https://github.com/Bharathkdev/react-planora-ai.git
cd react-planora-ai
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the project.

**Building for Production**

```bash
npm run build
```

**Preview Production Build**

```bash
npm run preview
```
