import Button from "components/ui/Button";
import { generate3DView } from "lib/ai.action";
import { createProject, getProjectById } from "lib/puter.action";
import { Box, Download, RefreshCcw, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { useNavigate, useOutletContext, useParams } from "react-router";

const visualizerId = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useOutletContext<AuthContext>();

  const hasInitialGenerated = useRef(false);

  const [project, setProject] = useState<DesignItem | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const handleBack = () => navigate("/");

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

  const runGeneration = async (item: DesignItem) => {
    if (!id || !item.sourceImage) return;

    try {
      setIsProcessing(true);
      const result = await generate3DView({ sourceImage: item.sourceImage });

      if (result?.renderedImage) {
        setCurrentImage(result.renderedImage);

        const updatedProject = {
          ...item,
          renderedImage: result.renderedImage,
          renderedPath: result.renderedPath,
          timestamp: Date.now(),
          ownerId: item.ownerId ?? userId ?? null,
          isPublic: item.isPublic ?? false,
        };

        const savedProject = await createProject({ item: updatedProject, visibility: "private" });

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

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) {
        setIsProjectLoading(false);
        return;
      }

      setIsProjectLoading(true);

      const fetchedProject = await getProjectById({ id });

      if (!isMounted) return;

      setProject(fetchedProject);
      setCurrentImage(fetchedProject?.renderedImage || null);
      setIsProjectLoading(false);
      hasInitialGenerated.current = false;
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (
      isProjectLoading ||
      hasInitialGenerated.current ||
      !project?.sourceImage
    )
      return;

    if (project.renderedImage) {
      setCurrentImage(project.renderedImage);
      hasInitialGenerated.current = true;
      return;
    }

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
            {currentImage ? (
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
            {project?.sourceImage && currentImage ? (
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