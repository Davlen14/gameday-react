import React, { useState, useEffect, useRef } from "react";
import {
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaGlobeAmericas,
  FaCompass
} from "react-icons/fa";
import teamsService from "../services/teamsService";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Loading animation component
const LoadingSpinner = ({ color = "#9e9e9e" }) => (
  <div className="loading-spinner">
    <svg width="50" height="50" viewBox="0 0 50 50">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray="31.4 31.4"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="1s"
          repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

// Helper function to lighten a color
const lightenColor = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return (
    "#" +
    (0x1000000 +
      (R < 255 ? R : 255) * 0x10000 +
      (G < 255 ? G : 255) * 0x100 +
      (B < 255 ? B : 255)
    )
      .toString(16)
      .slice(1)
  );
};

// Helper function to darken a color
const darkenColor = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;
  return (
    "#" +
    (0x1000000 +
      (R > 0 ? R : 0) * 0x10000 +
      (G > 0 ? G : 0) * 0x100 +
      (B > 0 ? B : 0)
    )
      .toString(16)
      .slice(1)
  );
};

// Convert hex color to THREE.js Color
const hexToThreeColor = (hex) => {
  return new THREE.Color(hex);
};

// Convert latitude/longitude to 3D coordinates on sphere
const latLongToVector3 = (lat, lon, radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
};

// Calculate normalized position along curve for Bezier interpolation
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const RosterMap = ({ teamName, teamColor, year = 2024 }) => {
  const [teamData, setTeamData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stadiumLocation, setStadiumLocation] = useState(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [logoTexture, setLogoTexture] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0); // 0: space, 1: continent, 2: country, 3: state, 4: stadium
  const [showStadiumDetails, setShowStadiumDetails] = useState(false);

  // THREE.js refs
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const teamMarkerRef = useRef(null);
  const animationRef = useRef(null);
  const zoomAnimationRef = useRef(null);
  const initialCameraPositionRef = useRef(null);

  // Constants for the globe
  const GLOBE_RADIUS = 100;
  const MARKER_SIZE = 3.5;

  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };

  // Fetch team data
  useEffect(() => {
    const fetchTeam = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch team location data
        const teamsData = await teamsService.getTeams();
        const team = teamsData.find(t => t.school === teamName);

        if (team) {
          setTeamData(team);

          // Set stadium location using the team's actual location data
          if (team.location && team.location.latitude && team.location.longitude) {
            const coordinates = [team.location.latitude, team.location.longitude];
            setStadiumLocation(coordinates);
          } else {
            console.warn("Team location data missing or incomplete:", team);
            // Use a default location for the team if not provided
            setStadiumLocation([39.8283, -98.5795]);
          }

          // Preload team logo if available
          if (team.logos && team.logos[0]) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.crossOrigin = "anonymous";
            textureLoader.load(
              team.logos[0],
              (texture) => {
                texture.minFilter = THREE.LinearFilter;
                setLogoTexture(texture);
              },
              undefined,
              (err) => {
                console.error("Error loading team logo:", err);
              }
            );
          }
        } else {
          console.warn("Team not found:", teamName);
          setError("Team not found");
        }
      } catch (err) {
        console.error("Error fetching team:", err.message);
        setError("Failed to load team information.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeam();
  }, [teamName, year]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || isLoading || error) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45, // FOV
      containerRef.current.clientWidth / containerRef.current.clientHeight, // aspect ratio
      0.1, // near plane
      1000 // far plane
    );
    camera.position.set(0, 0, 150); // Initial position closer to the marker
    initialCameraPositionRef.current = new THREE.Vector3(0, 0, 150);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.3;
    controls.enablePan = false;
    controls.minDistance = MARKER_SIZE * 5; // Closer zoom limit
    controls.maxDistance = 200;
    controls.enabled = false; // Disabled until initial animation completes
    controlsRef.current = controls;

    // Add team logo marker if we have the location
    if (stadiumLocation) {
      addTeamLogoMarker();
    }

    // Start animation loop
    animate();

    // Start initial zoom animation - directly to team location
    if (stadiumLocation) {
      startZoomSequence();
    }

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }

      // Clear all allocated THREE.js resources
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [isLoading, error]);

  // Add team logo marker when stadium location or logo texture updates
  useEffect(() => {
    if (stadiumLocation && !isLoading && !error && sceneRef.current) {
      addTeamLogoMarker();
    }
  }, [stadiumLocation, logoTexture, isLoading, error]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  },);

  // Add team logo marker in a glassy effect
  const addTeamLogoMarker = () => {
    if (!sceneRef.current || !stadiumLocation) return;

    // Remove existing marker if any
    if (teamMarkerRef.current) {
      sceneRef.current.remove(teamMarkerRef.current);
      teamMarkerRef.current = null;
    }

    const [stadiumLat, stadiumLon] = stadiumLocation;
    const stadiumPosition = latLongToVector3(stadiumLat, stadiumLon, GLOBE_RADIUS);

    // Create marker group
    const markerGroup = new THREE.Group();

    // Create a glassy base effect
    const glassGeometry = new THREE.SphereGeometry(MARKER_SIZE * 1.5, 32, 32);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: hexToThreeColor(teamColor),
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.9, // Glass-like transparency
      thickness: 1.0,    // Glass thickness
      envMapIntensity: 1.0,
      clearcoat: 1.0,    // Clear coat layer
      clearcoatRoughness: 0.1
    });

    const glassMarker = new THREE.Mesh(glassGeometry, glassMaterial);

    // Create a team logo plane inside the glass sphere
    if (logoTexture) {
      const logoSize = MARKER_SIZE * 1.8;
      const logoGeometry = new THREE.PlaneGeometry(logoSize, logoSize);
      const logoMaterial = new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        side: THREE.DoubleSide
      });

      const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);

      // Position the logo so it always faces the camera
      logoMesh.lookAt(new THREE.Vector3(0, 0, 0));

      // Add logo to marker group
      markerGroup.add(logoMesh);
    }

    // Add glass sphere to marker group
    markerGroup.add(glassMarker);

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(MARKER_SIZE * 2.0, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.2 },
        p: { value: 1.8 },
        glowColor: { value: new THREE.Color(teamColor) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float c;
        uniform float p;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
          gl_FragColor = vec4(glowColor, intensity);
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    markerGroup.add(glow);

    // Create light beam pointing up from marker
    const beamGeometry = new THREE.CylinderGeometry(0.5, 0, 15, 16, 1, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: hexToThreeColor(teamColor),
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.y = 10;
    beam.rotation.x = Math.PI;
    markerGroup.add(beam);

    // Position the marker in 3D space
    const markerPosition = latLongToVector3(stadiumLat, stadiumLon, GLOBE_RADIUS * 0.9); // Slightly closer
    markerGroup.position.copy(markerPosition);

    // Orient the marker to point towards the center
    markerGroup.lookAt(0, 0, 0);

    // Add marker to scene
    sceneRef.current.add(markerGroup);
    teamMarkerRef.current = markerGroup;
  };

  // Start zoom sequence animation
  const startZoomSequence = () => {
    if (!stadiumLocation || !cameraRef.current) return;

    setZoomLevel(4); // Directly set to stadium view

    const [lat, lon] = stadiumLocation;
    const stadiumVector = latLongToVector3(lat, lon, GLOBE_RADIUS);
    const targetPosition = stadiumVector.clone().normalize().multiplyScalar(MARKER_SIZE * 10); // Zoom closer to the marker

    const startTime = performance.now();
    const duration = 2000; // Adjust duration as needed
    const startPosition = new THREE.Vector3().copy(cameraRef.current.position);

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      // Interpolate camera position
      const newPosition = new THREE.Vector3().lerpVectors(
        startPosition,
        targetPosition,
        easedProgress
      );

      cameraRef.current.position.copy(newPosition);
      cameraRef.current.lookAt(teamMarkerRef.current ? teamMarkerRef.current.position : new THREE.Vector3(0,0,0)); // Look at the marker

      if (progress < 1) {
        zoomAnimationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimationComplete(true);
        setShowStadiumDetails(true);
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      }
    };

    zoomAnimationRef.current = requestAnimationFrame(animate);
  };

  // Animation loop
  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !teamMarkerRef.current) return;

    // Update team marker to always face camera if present
    if (teamMarkerRef.current && animationComplete) {
      // Find the logo plane within the marker group
      teamMarkerRef.current.children.forEach(child => {
        if (child.geometry instanceof THREE.PlaneGeometry) {
          const cameraPosition = new THREE.Vector3();
          cameraRef.current.getWorldPosition(cameraPosition);
          child.lookAt(cameraPosition);
        }
      });
    }

    // Update controls if enabled
    if (controlsRef.current && controlsRef.current.enabled) {
      controlsRef.current.update();
    }

    // Render scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Continue animation loop
    animationRef.current = requestAnimationFrame(animate);
  };

  // Reset view
  const resetView = () => {
    if (animationComplete && cameraRef.current) {
      // Cancel ongoing animations
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }

      // Reset zoom level
      setZoomLevel(0);
      setShowStadiumDetails(false);
      setAnimationComplete(false);

      // Disable controls during animation
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }

      // Start zoom sequence again
      startZoomSequence();
    }
  };

  return (
    <div className="dashboard-card full-width-card">
      <div className="card-header" style={cardHeaderStyle}>
        <FaGlobeAmericas style={{ marginRight: "12px", color: teamColor }} />
        {teamName} Location - Interactive 3D Globe
      </div>
      <div className="card-body globe-map-container">
        {isLoading ? (
          <div className="loading-indicator">
            <LoadingSpinner color={teamColor} />
            <p>Preparing 3D visualization...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <FaExclamationTriangle color="red" style={{ marginRight: "8px" }} />
            {error}
          </div>
        ) : (
          <>
            <div className="globe-controls">
              <button
                className="reset-button"
                onClick={resetView}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  color: teamColor,
                  border: `2px solid ${teamColor}`,
                  boxShadow: `0 4px 15px ${teamColor}50`
                }}
              >
                <FaCompass style={{ marginRight: "6px" }} /> Replay Zoom Animation
              </button>
            </div>

            <div className="globe-container" ref={containerRef}>
              {showStadiumDetails && (
                <div
                  className="stadium-info-panel"
                  style={{
                    backgroundColor: `rgba(0, 0, 0, 0.7)`,
                    borderColor: teamColor,
                    boxShadow: `0 0 20px ${teamColor}50`
                  }}
                >
                  {teamData?.logos && teamData.logos[0] && (
                    <div className="team-logo">
                      <img src={teamData.logos[0]} alt={teamName} />
                    </div>
                  )}

                  <div className="team-details">
                    <h2 style={{ color: teamColor }}>{teamName} {teamData?.mascot}</h2>

                    {teamData?.location?.name && (
                      <div className="info-row">
                        <span>Stadium:</span> {teamData.location.name}
                      </div>
                    )}

                    {teamData?.location?.city && teamData?.location?.state && (
                      <div className="info-row">
                        <span>Location:</span> {teamData.location.city}, {teamData.location.state}
                      </div>
                    )}

                    {teamData?.conference && (
                      <div className="info-row">
                        <span>Conference:</span> {teamData.conference}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="globe-instructions">
              <ul>
                <li><span style={{color: teamColor}}>Click and drag</span> to rotate the view around the marker</li>
                <li><span style={{color: teamColor}}>Scroll</span> to zoom in/out</li>
                <li>Click <span style={{color: teamColor}}>Replay Animation</span> to see the zoom effect again</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* CSS styles in component */}
      <style>{`
        /* Base Styles */
        .globe-map-container {
          position: relative;
          padding: 15px;
          overflow: hidden;
          background-color: #000000;
          border-radius: 0 0 8px 8px;
          min-height: 700px;
        }

        .loading-indicator, .error-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
          color: white;
        }

        .error-message {
          color: #e53935;
          font-weight: 500;
        }

        /* Globe Container */
        .globe-container {
          height: 650px;
          width: 100%;
          overflow: hidden;
          position: relative;
          background-color: transparent;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          margin: 10px 0;
        }

        /* Controls Styling */
        .globe-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
          position: relative;
          z-index: 1000;
        }

        .reset-button {
          border: none;
          border-radius: 30px;
          padding: 8px 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 15px 20px rgba(0, 0, 0, 0.3);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }
        }

        .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        /* Stadium Info Panel */
        .stadium-info-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 300px;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid;
          backdrop-filter: blur(10px);
          animation: fadeIn 1s ease;
          z-index: 1000;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stadium-info-panel .team-logo {
          text-align: center;
          margin-bottom: 15px;
        }

        .stadium-info-panel .team-logo img {
          max-width: 120px;
          max-height: 120px;
          filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.5));
        }

        .stadium-info-panel h2 {
          margin: 0 0 15px 0;
          font-size: 22px;
          text-align: center;
          text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
        }

        .info-row {
          margin-bottom: 8px;
          color: white;
        }

        .info-row span {
          font-weight: bold;
          margin-right: 5px;
        }

        /* Globe Instructions */
        .globe-instructions {
          background: rgba(0, 0, 0, 0.6);
          border-radius: 8px;
          padding: 10px 15px;
          margin-top: 10px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .globe-instructions ul {
          padding-left: 20px;
          margin: 0;
          color: white;
          list-style-type: none;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-around;
        }

        .globe-instructions li {
          margin: 5px 10px;
          font-size: 14px;
          white-space: nowrap;
        }

        .globe-instructions span {
          font-weight: 600;
        }

        /* Responsive Styles */
        @media (max-width: 768px) {
          .globe-container {
            height: 450px;
          }

          .stadium-info-panel {
            width: 240px;
            right: 10px;
            top: 10px;
            padding: 15px;
          }

          .stadium-info-panel .team-logo img {
            max-width: 80px;
            max-height: 80px;
          }

          .stadium-info-panel h2 {
            font-size: 18px;
          }

          .globe-instructions ul {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default RosterMap;