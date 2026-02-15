import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { ArrowRight, ArrowUpRight, Clock, Layers, RefreshCcw } from "lucide-react";

import Navbar from "components/Navbar";
import type { Route } from "./+types/home";
import Button from "components/ui/Button";
import Upload from "components/Upload";
import { createProject, getProjects } from "lib/puter.action";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Planora AI — 2D to 3D Architectural Visualization" },
    {
      name: "description",
      content:
        "Transform floor plans into photorealistic 3D renders instantly with Planora AI. Design, visualize, and export architectural spaces faster than ever.",
    },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { isSignedIn, userName } = useOutletContext<AuthContext>();

  // Stores all user projects
  const [projects, setProjects] = useState<DesignItem[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false);

  // Prevents duplicate project creation during upload
  const isCreatingProjectRef = useRef<boolean>(false);

  // Handles image upload and creates a new project
  const handleUploadComplete = async (base64Data: string) => {
    try {
      if (isCreatingProjectRef.current) return false;
      isCreatingProjectRef.current = true;

      const newId = Date.now().toString();
      const name = `Project ${newId}`;

      const newItem = {
        id: newId,
        name,
        sourceImage: base64Data,
        renderedImage: undefined,
        timestamp: Date.now(),
      };

      const savedProject = await createProject({ item: newItem, visibility: "private" });

      if (!savedProject) {
        console.warn("Project creation failed, not navigating.");
        return false;
      }

      // Add new project to top of list
      setProjects((prev) => [savedProject, ...prev]);

      // Navigate to visualizer with initial state
      navigate(`/visualizer/${newId}`, {
        state: {
          initialImage: savedProject.sourceImage,
          initialRender: savedProject.renderedImage || null,
          name
        },
      });

      return true;
    } finally {
      isCreatingProjectRef.current = false;
    }
  };

  // Fetch projects on first load
  useEffect(() => {
    const fetchProjects = async () => {
      if (!isSignedIn) {
        setProjects([]);
        return;
      }

      setIsProjectsLoading(true);

      try {
        const items = await getProjects();
        setProjects(items.slice().reverse());
      } catch (e) {
        console.error("Failed to fetch projects:", e);
        setProjects([]);
      } finally {
        setIsProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [isSignedIn]);


  return (
    <div className="home">
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="announce">
          <div className="dot">
            <div className="pulse"></div>
          </div>

          <p>Introducing Planora AI 2.0</p>
        </div>

        <h1>
          Create stunning interiors at speed of imagination with Planora AI
        </h1>

        <p className="subtitle">
          Planora is a next-generation AI design platform for faster visualization and rendering of architectural ideas.
        </p>

        <div className="actions">
          <a href="#upload" className="cta">
            Start Building
            <ArrowRight className="icon" />
          </a>

          <Button variant="outline" size="lg" className="demo">
            Watch Demo
          </Button>
        </div>

        {/* Upload card */}
        <div id="upload" className="upload-shell">
          <div className="grid-overlay" />

          <div className="upload-card">
            <div className="upload-head">
              <div className="upload-icon">
                <Layers className="icon" />
              </div>

              <h3>Upload your floor plan</h3>
              <p>Supports JPG, PNG, formats up to 50 MB</p>
            </div>

            <Upload onComplete={handleUploadComplete} />
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="projects">
        <div className="section-inner">
          <div className="section-head">
            <div className="copy">
              <h2>Projects</h2>
              <p>Your latest work and shared community projects, all in one place.</p>
            </div>
          </div>

          <div className="projects-grid-wrapper relative">

            {/* Empty / Loading state */}
            {isProjectsLoading || projects.length === 0 ? (
              <div className="w-full min-h-65 border border-gray-300 rounded-xl bg-white flex items-center justify-center">
                <div className="text-center px-6">
                  {isProjectsLoading ? (
                    <div className="flex items-center justify-center gap-2 text-black font-semibold">
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Loading Projects...
                    </div>
                  ) : (
                    <span className="text-gray-500 font-medium">
                      Your workspace is empty. Create your first project to begin.
                    </span>
                  )}
                </div>
              </div>
            ) : null}

            {/* Projects grid */}
            <div className="projects-grid">
              {projects.map(({ id, name, sourceImage, renderedImage, timestamp }) => (
                <div className="project-card group" key={id} onClick={() => navigate(`/visualizer/${id}`)}>
                  <div className="preview">
                    <img src={renderedImage || sourceImage} alt={name?.toString()} />
                    <div className="badge">
                      <span>Community</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div>
                      <h3>{name}</h3>
                      <div className="meta">
                        <Clock size={12} />
                        <span>{new Date(timestamp).toLocaleDateString()}</span>
                        <span>By {userName}</span>
                      </div>
                    </div>

                    <div className="arrow">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
