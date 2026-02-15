import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { Box, Download, RefreshCcw, Share2, X } from "lucide-react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

import Button from "components/ui/Button";
import { generate3DView } from "lib/ai.action";
import { createProject, getProjectById } from "lib/puter.action";

const visualizerId = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useOutletContext<AuthContext>();

  // Prevents AI generation from running multiple times due to re-renders
  const hasInitialGenerated = useRef(false);

  // Project data
  const [project, setProject] = useState<DesignItem | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState<boolean>(true);

  // Rendering state (AI processing)
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Currently displayed image (may be source OR generated)
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const SectionLoader = ({ text = "Loading..." }: { text?: string }) => (
    <div className="flex items-center justify-center w-full h-40">
      <div className="flex items-center gap-2 text-gray-500 font-medium">
        <RefreshCcw className="w-4 h-4 animate-spin" />
        {text}
      </div>
    </div>
  );

  const handleBack = () => navigate("/");

  // Downloads hosted image by converting remote URL -> blob -> local download
  // Needed because browsers ignore <a download> for cross-origin URLs
  const handleExport = async () => {
    if (!currentImage) return;

    try {
      const response = await fetch(currentImage, { mode: "cors" });
      const blob = await response.blob();

      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `planora-${id || "design"}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  /**
   * Runs AI rendering flow
   * 1. Send source image to AI
   * 2. Receive generated render
   * 3. Persist render to backend
   * 4. Update UI with saved project
   *
   * This ensures refresh persistence — without saving,
   * generated images would disappear on reload.
   */
  const runGeneration = async (item: DesignItem) => {
    if (!id || !item.sourceImage) return;

    try {
      setIsProcessing(true);

      const result = await generate3DView({ sourceImage: item.sourceImage });

      if (result?.renderedImage) {
        // Immediately show preview while saving
        setCurrentImage(result.renderedImage);

        const updatedProject = {
          ...item,
          renderedImage: result.renderedImage,
          renderedPath: result.renderedPath,
          timestamp: Date.now(),
          ownerId: item.ownerId ?? userId ?? null,
          isPublic: item.isPublic ?? false,
        };

        // Persist generated render
        const savedProject = await createProject({ item: updatedProject, visibility: "private" });

        // After save, sync UI with stored version
        if (savedProject) {
          setProject(savedProject);
          setCurrentImage(savedProject.renderedImage || result.renderedImage);
        }
      }
    } catch (error) {
      console.error("Error during generation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Load project when visiting visualizer
   * Handles refresh / deep-link scenario
   */
  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) {
        setIsProjectLoading(false);
        return;
      }

      setIsProjectLoading(true);

      const fetchedProject = await getProjectById({ id });

      // Prevent state update after unmount
      if (!isMounted) return;

      setProject(fetchedProject);
      setCurrentImage(fetchedProject?.renderedImage || null);
      setIsProjectLoading(false);

      // Reset generation guard when project changes
      hasInitialGenerated.current = false;
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

  /**
   * Automatic generation trigger
   *
   * Rules:
   * - Do NOT regenerate if already generated
   * - Do NOT generate while loading
   * - Generate only when project has source but no render
   */
  useEffect(() => {
    if (
      isProjectLoading ||
      hasInitialGenerated.current ||
      !project?.sourceImage
    )
      return;

    // If render exists, just display
    if (project.renderedImage) {
      setCurrentImage(project.renderedImage);
      hasInitialGenerated.current = true;
      return;
    }

    // Otherwise generate once
    hasInitialGenerated.current = true;
    void runGeneration(project);
  }, [project, isProjectLoading]);

  return (
    <div className="visualizer">
      <nav className="topbar">
        <div className="brand">
          <Box className="logo" />
          <span className="name">Planora</span>
        </div>

        <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
          <X className="icon" />
          Exit Editor
        </Button>
      </nav>

      <section className="content">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{project?.name || `Project ${id}`}</h2>
              <p className="note">Created by You</p>
            </div>

            <div className="panel-actions">
              <Button
                size="sm"
                onClick={handleExport}
                className="export"
                disabled={!currentImage}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className={`render-area ${isProcessing ? "is-processing" : ""}`}>
            {isProjectLoading ? (
              <SectionLoader text="Loading project..." />
            ) : currentImage ? (
              <img src={currentImage} alt="AI Rendered View" className="render-img" />
            ) : (
              <div className="render-placeholder">
                {project?.sourceImage && (
                  <img src={project.sourceImage} alt="Initial Floor Plan" className="render-fallback" />
                )}
              </div>
            )}

            {isProcessing && (
              <div className="render-overlay">
                <div className="rendering-card">
                  <RefreshCcw className="spinner" />
                  <span className="title">Rendering ...</span>
                  <span className="subtitle">Generating your 3D visualization</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="panel compare">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Comparison</p>
              <h3>Before and After</h3>
            </div>

            <div className="hint">
              Drag to compare
            </div>
          </div>

          <div className="compare-stage">
            {isProjectLoading ? (
              <SectionLoader text="Loading comparison..." />
            ) : project?.sourceImage && currentImage ? (
              <ReactCompareSlider
                defaultValue={50}
                style={{ width: "100%", height: "auto" }}
                itemOne={
                  <ReactCompareSliderImage src={project?.sourceImage} alt="Before - Floor Plan" className="compare-img" />
                }
                itemTwo={
                  <ReactCompareSliderImage src={currentImage ?? project?.renderedImage ?? undefined} alt="After - Floor Plan" className="compare-img" />
                }
              />
            ) : (
              <div className="compare-fallback">
                {project?.sourceImage && (
                  <img src={project.sourceImage} alt="Initial Floor Plan" className="compare-img" />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default visualizerId;
