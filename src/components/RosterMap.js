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

const RosterMap = ({ teamName, teamColor = "#0088ce", year = 2024 }) => {
  const [teamData, setTeamData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stadiumLocation, setStadiumLocation] = useState(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [logoTexture, setLogoTexture] = useState(null);
  const [showStadiumDetails, setShowStadiumDetails] = useState(false);

  // THREE.js refs
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const globeRef = useRef(null);
  const earthRef = useRef(null);
  const cloudsRef = useRef(null);
  const teamMarkerRef = useRef(null);
  const animationRef = useRef(null);
  const zoomAnimationRef = useRef(null);

  // Constants for the globe
  const GLOBE_RADIUS = 100;
  const MARKER_SIZE = 3.5;

  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };

  // Fetch team data with improved error handling
  useEffect(() => {
    const fetchTeamLocation = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching location data for ${teamName}`);
        
        const teamsData = await teamsService.getTeams();
        console.log(`Got data for ${teamsData.length} teams`);
        
        const team = teamsData.find(t => t.school === teamName);
        
        if (team) {
          console.log("Found team:", team.school);
          setTeamData(team);
          
          if (team.location && 
              team.location.latitude !== undefined && 
              team.location.longitude !== undefined) {
            console.log(`Setting stadium location: [${team.location.latitude}, ${team.location.longitude}]`);
            setStadiumLocation([team.location.latitude, team.location.longitude]);
            
            // Preload team logo if available
            if (team.logos && team.logos[0]) {
              const textureLoader = new THREE.TextureLoader();
              textureLoader.crossOrigin = "anonymous";
              textureLoader.load(
                team.logos[0],
                (texture) => {
                  console.log("Team logo loaded successfully");
                  texture.minFilter = THREE.LinearFilter;
                  setLogoTexture(texture);
                },
                undefined,
                (err) => {
                  console.error("Error loading team logo texture:", err);
                  // Continue without logo
                }
              );
            }
          } else {
            console.warn("Team found but missing location data:", team);
            setError(`Location data not available for ${teamName}`);
          }
        } else {
          console.warn(`Team "${teamName}" not found in team data`);
          setError(`Team "${teamName}" not found in database`);
        }
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError(`Failed to load team data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (teamName) {
      fetchTeamLocation();
    }
  }, [teamName, year]);

  // Function to create a basic Earth - defined OUTSIDE useEffect to avoid redeclarations
  const createBasicEarth = () => {
    if (!sceneRef.current) return;
    
    // Remove any existing earth
    if (earthRef.current) {
      sceneRef.current.remove(earthRef.current);
    }
    
    // Create the basic ocean sphere
    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x0077be,  // Ocean blue
      shininess: 25
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    sceneRef.current.add(earth);
    earthRef.current = earth;
    globeRef.current = earth;
    
    // Create the landmass layer
    const continentsGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.1, 64, 64);
    const continentsMaterial = new THREE.MeshPhongMaterial({
      color: 0x3d9942,  // Land green
      opacity: 0.9,
      transparent: true
    });
    
    // Create landmass shapes
    // This is a simplified approximation of continents using displacement
    const vertices = continentsGeometry.attributes.position;
    const vector = new THREE.Vector3();
    
    for (let i = 0; i < vertices.count; i++) {
      vector.fromBufferAttribute(vertices, i);
      vector.normalize();
      
      // Use noise function to create continent-like shapes
      const lat = Math.asin(vector.y) / Math.PI + 0.5;
      const lon = Math.atan2(vector.z, vector.x) / Math.PI / 2 + 0.5;
      
      // Simplified noise function (can't use SimplexNoise directly)
      const noise = Math.sin(lat * 12) * Math.cos(lon * 12) * 0.2 + 
                    Math.sin(lat * 20 + 3) * Math.cos(lon * 15 + 5) * 0.15;
      
      // Make water areas disappear by setting radius to less than earth
      if (noise < 0.1) {
        vertices.setXYZ(
          i, 
          vector.x * (GLOBE_RADIUS - 0.5), 
          vector.y * (GLOBE_RADIUS - 0.5), 
          vector.z * (GLOBE_RADIUS - 0.5)
        );
      }
    }
    
    const continents = new THREE.Mesh(continentsGeometry, continentsMaterial);
    sceneRef.current.add(continents);
  };
  
  // Function to create stars background - defined OUTSIDE useEffect to avoid redeclarations
  const createStarsBackground = () => {
    if (!sceneRef.current) return;
    
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 3000;
    const positions = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2000;
      positions[i + 1] = (Math.random() - 0.5) * 2000;
      positions[i + 2] = (Math.random() - 0.5) * 2000;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    sceneRef.current.add(stars);
  };

  // Add team marker to the globe
  const addTeamMarker = () => {
    if (!sceneRef.current || !stadiumLocation) return;
    
    try {
      // Remove existing marker if any
      if (teamMarkerRef.current) {
        sceneRef.current.remove(teamMarkerRef.current);
        teamMarkerRef.current = null;
      }
      
      const [lat, lon] = stadiumLocation;
      const position = latLongToVector3(lat, lon, GLOBE_RADIUS);
      
      // Create a group to hold marker elements
      const markerGroup = new THREE.Group();
      
      // Add base marker (always visible)
      const markerGeometry = new THREE.SphereGeometry(MARKER_SIZE, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: hexToThreeColor(teamColor), 
        transparent: true,
        opacity: 0.8
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      markerGroup.add(marker);
      
      // If logo is available, add it as a billboard
      if (logoTexture) {
        const logoSize = MARKER_SIZE * 2.5;
        const logoGeometry = new THREE.PlaneGeometry(logoSize, logoSize);
        const logoMaterial = new THREE.MeshBasicMaterial({
          map: logoTexture,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        
        const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
        logoMesh.position.set(0, 0, MARKER_SIZE * 1.2); // Position in front of marker
        markerGroup.add(logoMesh);
      }
      
      // Position the marker group on the globe
      const markerPosition = position.clone().normalize().multiplyScalar(GLOBE_RADIUS + 0.5);
      markerGroup.position.copy(markerPosition);
      
      // Orient marker to face outward from the globe center
      markerGroup.lookAt(0, 0, 0);
      markerGroup.rotateY(Math.PI); // Rotate 180° to face outward
      
      // Add marker to scene
      sceneRef.current.add(markerGroup);
      teamMarkerRef.current = markerGroup;
    } catch (err) {
      console.error("Error adding team marker:", err);
    }
  };
  
  // Zoom animation to team location
  const startZoomAnimation = () => {
    if (!stadiumLocation || !cameraRef.current || !globeRef.current) return;
    
    try {
      console.log("Starting zoom animation to", stadiumLocation);
      
      // Cancel any existing animation
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }
      
      const [lat, lon] = stadiumLocation;
      
      // Rotate globe to show the location
      // For US teams, rotate to show North America
      if (globeRef.current) {
        // US-centric rotation for better viewing of US teams
        globeRef.current.rotation.set(0, Math.PI / 2, 0);
      }
      
      // Calculate target position for camera
      const targetPosition = latLongToVector3(lat, lon, GLOBE_RADIUS * 2.5);
      const startPosition = new THREE.Vector3(0, 0, 300);
      
      // Animation settings
      const duration = 2000; // ms
      const startTime = performance.now();
      
      // Animation function
      const animate = (time) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease in/out function for smoother animation
        const eased = progress < 0.5 ? 
          2 * progress * progress : 
          -1 + (4 - 2 * progress) * progress;
        
        // Interpolate camera position
        if (cameraRef.current) {
          const newPos = new THREE.Vector3().lerpVectors(
            startPosition, 
            targetPosition, 
            eased
          );
          
          cameraRef.current.position.copy(newPos);
          cameraRef.current.lookAt(0, 0, 0);
        }
        
        if (progress < 1) {
          zoomAnimationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          setAnimationComplete(true);
          setShowStadiumDetails(true);
          
          // Enable controls after animation
          if (controlsRef.current) {
            controlsRef.current.enabled = true;
          }
        }
      };
      
      // Start animation
      zoomAnimationRef.current = requestAnimationFrame(animate);
      
    } catch (err) {
      console.error("Error in zoom animation:", err);
      
      // If animation fails, still show details and enable controls
      setAnimationComplete(true);
      setShowStadiumDetails(true);
      
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    }
  };

  // Reset view function (for the Replay button)
  const resetView = () => {
    if (cameraRef.current && stadiumLocation) {
      console.log("Resetting view");
      
      // Cancel any existing animation
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }
      
      // Reset animation state
      setAnimationComplete(false);
      setShowStadiumDetails(false);
      
      // Disable controls during animation
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      
      // Reset camera to initial position
      cameraRef.current.position.set(0, 0, 300);
      cameraRef.current.lookAt(0, 0, 0);
      
      // Start new zoom animation
      startZoomAnimation();
    }
  };

  // Add team marker when stadiumLocation is set
  useEffect(() => {
    if (stadiumLocation && sceneRef.current && globeRef.current) {
      console.log("Adding team marker at", stadiumLocation);
      addTeamMarker();
      
      // Start zoom animation
      if (!animationComplete) {
        startZoomAnimation();
      }
    }
  }, [stadiumLocation, animationComplete]);

  // Update marker when team logo is loaded
  useEffect(() => {
    if (logoTexture && stadiumLocation && sceneRef.current) {
      console.log("Logo loaded, updating marker");
      addTeamMarker();
    }
  }, [logoTexture, stadiumLocation]);

  // Create a complete standalone component without any external dependencies
  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      // Clear any previous errors
      setError(null);
      console.log("Initializing 3D globe for", teamName);
      
      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0x000000);
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(
        45,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 300);
      cameraRef.current = camera;
      
      // Create renderer with basic settings (no fancy features that might fail)
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true
      });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(1); // Force to 1 for reliability
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Add basic lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 3, 5);
      scene.add(directionalLight);
      
      // Create controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.5;
      controls.enablePan = false;
      controls.minDistance = GLOBE_RADIUS * 1.2;
      controls.maxDistance = GLOBE_RADIUS * 5;
      controls.enabled = false; // Disabled until animation completes
      controlsRef.current = controls;
      
      // Create basic Earth with oceans and continents
      createBasicEarth();
      
      // Create stars background
      createStarsBackground();
      
      // If we have stadium location already, add marker
      if (stadiumLocation) {
        addTeamMarker();
        if (!animationComplete) {
          startZoomAnimation();
        }
      }
      
      // Start animation loop
      const animateLoop = () => {
        if (globeRef.current) {
          globeRef.current.rotation.y += 0.001;
        }
        
        if (controlsRef.current && controlsRef.current.enabled) {
          controlsRef.current.update();
        }
        
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        
        animationRef.current = requestAnimationFrame(animateLoop);
      };
      
      animateLoop();
      
      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        
        if (zoomAnimationRef.current) {
          cancelAnimationFrame(zoomAnimationRef.current);
        }
        
        if (rendererRef.current && containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        
        if (sceneRef.current) {
          // Dispose of resources
          sceneRef.current.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
          });
        }
      };
    } catch (err) {
      console.error("Error initializing 3D scene:", err);
      setError("Failed to initialize 3D visualization. Please try a different browser.");
    }
  }, [teamName, stadiumLocation, animationComplete]);

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
              {showStadiumDetails && teamData && (
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
                <li><span style={{color: teamColor}}>Click and drag</span> to rotate the globe</li>
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