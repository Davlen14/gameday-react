import React, { useState, useEffect, useRef } from "react";
import { 
  FaMapMarkerAlt, 
  FaExclamationTriangle, 
  FaInfoCircle,
  FaFilter,
  FaCompass,
  FaGlobeAmericas,
  FaUniversity
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

const RosterMap = ({ teamName, teamColor, year = 2024 }) => {
  const [teamData, setTeamData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stadiumLocation, setStadiumLocation] = useState(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [logoTexture, setLogoTexture] = useState(null);
  
  // THREE.js refs
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const globeRef = useRef(null);
  const stadiumMarkerRef = useRef(null);
  const animationRef = useRef(null);
  const tooltipRef = useRef(null);
  const targetPositionRef = useRef(null);
  const initialPositionRef = useRef(null);
  
  // Constants for the globe
  const GLOBE_RADIUS = 100;
  const TEAM_MARKER_SIZE = 6;
  const TEAM_MARKER_HEIGHT = 10;
  
  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };
  
  // Fetch team data
  useEffect(() => {
    console.log("Fetching team data for:", teamName);
    const fetchTeam = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch team location data
        const teamsData = await teamsService.getTeams();
        const team = teamsData.find(t => t.school === teamName);
        
        if (team) {
          console.log("Team data found:", team);
          setTeamData(team);
          
          // Set stadium location using the team's actual location data
          if (team.location && team.location.latitude && team.location.longitude) {
            const coordinates = [team.location.latitude, team.location.longitude];
            setStadiumLocation(coordinates);
            console.log("Stadium location set:", coordinates);
          } else {
            console.warn("Team location data missing or incomplete:", team);
            // Use a default location for the team if not provided
            setStadiumLocation([39.8283, -98.5795]);
          }
          
          // Preload team logo if available
          if (team.logos && team.logos[0]) {
            console.log("Preloading team logo:", team.logos[0]);
            const textureLoader = new THREE.TextureLoader();
            textureLoader.crossOrigin = "anonymous";
            textureLoader.load(
              team.logos[0],
              (texture) => {
                console.log("Team logo loaded successfully");
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
    console.log("Initializing Three.js scene");
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000510);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45, // FOV
      containerRef.current.clientWidth / containerRef.current.clientHeight, // aspect ratio
      0.1, // near plane
      10000 // far plane
    );
    camera.position.set(0, 0, 350);
    initialPositionRef.current = new THREE.Vector3(0, 0, 350);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enablePan = false;
    controls.minDistance = GLOBE_RADIUS * 1.1;
    controls.maxDistance = GLOBE_RADIUS * 5;
    controlsRef.current = controls;
    
    // Create globe
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";
    
    // Load earth textures (using NASA textures)
    Promise.all([
      new Promise(resolve => 
        textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg', resolve)),
      new Promise(resolve => 
        textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg', resolve)),
      new Promise(resolve => 
        textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg', resolve)),
    ]).then(([earthMap, earthSpecular, earthNormal]) => {
      console.log("Earth textures loaded successfully");
      
      // Create Earth globe
      const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
      const globeMaterial = new THREE.MeshPhongMaterial({
        map: earthMap,
        specularMap: earthSpecular,
        normalMap: earthNormal,
        specular: new THREE.Color(0x333333),
        shininess: 15,
      });
      
      const globe = new THREE.Mesh(globeGeometry, globeMaterial);
      scene.add(globe);
      globeRef.current = globe;
      
      // Create atmosphere glow
      const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.01, 32, 32);
      const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(atmosphere);
      
      // Stars background
      const starsGeometry = new THREE.BufferGeometry();
      const starsCount = 5000;
      const positions = new Float32Array(starsCount * 3);
      
      for (let i = 0; i < starsCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 2000;
        positions[i + 1] = (Math.random() - 0.5) * 2000;
        positions[i + 2] = (Math.random() - 0.5) * 2000;
      }
      
      starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        transparent: true
      });
      
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(stars);
      
      // Add tooltip for hovering over markers
      const tooltip = document.createElement('div');
      tooltip.className = 'globe-tooltip';
      tooltip.style.display = 'none';
      tooltip.style.position = 'absolute';
      tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      tooltip.style.color = 'white';
      tooltip.style.padding = '8px 12px';
      tooltip.style.borderRadius = '4px';
      tooltip.style.fontSize = '14px';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.zIndex = '10000';
      containerRef.current.appendChild(tooltip);
      tooltipRef.current = tooltip;
      
      // Add stadium marker if we have the location
      if (stadiumLocation) {
        console.log("Adding stadium marker");
        addStadiumMarker();
      }
      
      // Start animation loop
      animate();
    }).catch(err => {
      console.error("Error loading textures:", err);
      setError("Failed to load globe textures. Please try refreshing the page.");
    });
    
    // Cleanup on unmount
    return () => {
      console.log("Cleaning up 3D scene");
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (tooltipRef.current && containerRef.current) {
        containerRef.current.removeChild(tooltipRef.current);
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
  
  // Add stadium marker when stadium location or logo texture updates
  useEffect(() => {
    if (stadiumLocation && !isLoading && !error && sceneRef.current && globeRef.current) {
      console.log("Stadium location or logo updated, adding marker");
      addStadiumMarker();
      
      // Start initial zoom animation to team location
      const [lat, lon] = stadiumLocation;
      const targetVector = latLongToVector3(lat, lon, GLOBE_RADIUS);
      targetPositionRef.current = targetVector.clone().normalize().multiplyScalar(GLOBE_RADIUS * 1.5);
      
      // Start animation
      animateToTeam();
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
  }, []);
  
  // Add stadium marker
  const addStadiumMarker = () => {
    if (!sceneRef.current || !stadiumLocation) return;
    
    console.log("Creating stadium marker at:", stadiumLocation);
    
    // Remove existing marker if any
    if (stadiumMarkerRef.current) {
      sceneRef.current.remove(stadiumMarkerRef.current);
      stadiumMarkerRef.current = null;
    }
    
    const [stadiumLat, stadiumLon] = stadiumLocation;
    const stadiumPosition = latLongToVector3(stadiumLat, stadiumLon, GLOBE_RADIUS);
    
    // Create stadium marker group
    const stadiumMarker = new THREE.Group();
    
    // Base cylinder marker
    const markerGeometry = new THREE.CylinderGeometry(
      TEAM_MARKER_SIZE, // top radius
      TEAM_MARKER_SIZE * 0.6, // bottom radius
      TEAM_MARKER_HEIGHT, // height
      16 // radial segments for smoother appearance
    );
    
    const markerMaterial = new THREE.MeshPhongMaterial({
      color: hexToThreeColor(teamColor),
      emissive: hexToThreeColor(lightenColor(teamColor, 20)),
      emissiveIntensity: 0.5,
      shininess: 30
    });
    
    const baseMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    stadiumMarker.add(baseMarker);
    
    // Position the marker
    const markerPosition = stadiumPosition.clone().normalize().multiplyScalar(GLOBE_RADIUS);
    stadiumMarker.position.copy(markerPosition);
    
    // Orient the marker to point away from center
    stadiumMarker.lookAt(markerPosition.clone().multiplyScalar(2));
    stadiumMarker.rotateX(Math.PI / 2);
    
    // Translate the marker so its base is at the globe surface
    const markerOffset = markerPosition.clone().normalize().multiplyScalar(TEAM_MARKER_HEIGHT * 0.5);
    stadiumMarker.position.add(markerOffset);
    
    // Logo on top if available
    if (logoTexture) {
      console.log("Adding team logo to marker");
      
      // Create a circular plane for the logo
      const logoGeometry = new THREE.CircleGeometry(TEAM_MARKER_SIZE * 1.2, 32);
      const logoMaterial = new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
      logoMesh.position.y = TEAM_MARKER_HEIGHT * 0.5 + 1; // Position above the marker
      logoMesh.rotation.x = -Math.PI / 2; // Make it face up
      
      stadiumMarker.add(logoMesh);
    } else {
      console.log("No logo texture available, using university icon");
      
      // Add a sphere with team color when no logo is available
      const sphereGeometry = new THREE.SphereGeometry(TEAM_MARKER_SIZE * 0.8, 16, 16);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: hexToThreeColor(teamColor),
        emissive: hexToThreeColor(teamColor),
        emissiveIntensity: 0.3,
        shininess: 80
      });
      
      const logoSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      logoSphere.position.y = TEAM_MARKER_HEIGHT * 0.5 + 1; // Position above the marker
      
      stadiumMarker.add(logoSphere);
    }
    
    // Add glow effect around the marker
    const glowGeometry = new THREE.SphereGeometry(TEAM_MARKER_SIZE * 1.8, 32, 32);
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
    glow.position.y = TEAM_MARKER_HEIGHT * 0.25; // Center glow around marker
    
    stadiumMarker.add(glow);
    
    // Add to scene and store reference
    sceneRef.current.add(stadiumMarker);
    stadiumMarkerRef.current = stadiumMarker;
    
    // Store team info for tooltip
    stadiumMarker.userData = {
      type: 'team',
      name: teamData?.school || teamName,
      location: teamData?.location?.name || 'Home Stadium',
      city: teamData?.location?.city,
      state: teamData?.location?.state
    };
    
    console.log("Stadium marker added successfully");
  };
  
  // Create animation to zoom to the team location
  const animateToTeam = () => {
    if (!cameraRef.current || !targetPositionRef.current || !initialPositionRef.current) {
      console.warn("Missing refs for animation");
      return;
    }
    
    console.log("Starting zoom animation to team location");
    let startTime = null;
    const duration = 3000; // 3 seconds
    
    const animateFrame = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Interpolate camera position
      const newPosition = new THREE.Vector3().lerpVectors(
        initialPositionRef.current,
        targetPositionRef.current,
        easedProgress
      );
      
      cameraRef.current.position.copy(newPosition);
      
      // Point camera at globe center
      cameraRef.current.lookAt(0, 0, 0);
      
      // Continue animation until complete
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateFrame);
      } else {
        // Animation complete, enable controls
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
        setAnimationComplete(true);
        console.log("Zoom animation completed");
      }
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animateFrame);
  };
  
  // Animation loop
  const animate = () => {
    if (!globeRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    
    // Gentle globe rotation
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.0005;
    }
    
    // Update controls if enabled
    if (controlsRef.current && animationComplete) {
      controlsRef.current.update();
    }
    
    // Render scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(animate);
  };
  
  // Reset view
  const resetView = () => {
    if (cameraRef.current) {
      // Reset animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Get the initial position
      initialPositionRef.current = new THREE.Vector3(0, 0, 350);
      
      // Start new animation
      if (stadiumLocation) {
        const [lat, lon] = stadiumLocation;
        const targetVector = latLongToVector3(lat, lon, GLOBE_RADIUS);
        targetPositionRef.current = targetVector.clone().normalize().multiplyScalar(GLOBE_RADIUS * 1.5);
        
        // Start animation
        animateToTeam();
      } else {
        // If no stadium location, just reset to initial view
        cameraRef.current.position.copy(initialPositionRef.current);
        cameraRef.current.lookAt(0, 0, 0);
      }
      
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  };

  return (
    <div className="dashboard-card full-width-card">
      <div className="card-header" style={cardHeaderStyle}>
        <FaGlobeAmericas style={{ marginRight: "12px", color: teamColor }} />
        {teamName} Stadium Location - 3D Globe
      </div>
      <div className="card-body globe-map-container">
        {isLoading ? (
          <div className="loading-indicator">
            <LoadingSpinner color={teamColor} />
            <p>Preparing 3D globe...</p>
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
                  backgroundColor: '#ffffff',
                  color: teamColor,
                  border: `2px solid ${teamColor}`,
                  boxShadow: `0 4px 10px ${teamColor}30`
                }}
              >
                <FaCompass /> Reset View
              </button>
              
              <div className="team-info-panel" style={{
                backgroundColor: `rgba(255, 255, 255, 0.9)`,
                borderColor: teamColor
              }}>
                <div className="team-info-header" style={{
                  backgroundColor: teamColor,
                  color: '#fff'
                }}>
                  <FaUniversity style={{ marginRight: "8px" }} />
                  {teamName} {teamData?.mascot}
                </div>
                <div className="team-info-content">
                  {teamData?.location?.name && (
                    <div className="info-row">
                      <strong>Stadium:</strong> {teamData.location.name}
                    </div>
                  )}
                  {teamData?.location?.city && teamData?.location?.state && (
                    <div className="info-row">
                      <strong>Location:</strong> {teamData.location.city}, {teamData.location.state}
                    </div>
                  )}
                  {teamData?.conference && (
                    <div className="info-row">
                      <strong>Conference:</strong> {teamData.conference}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="globe-container" ref={containerRef}></div>
            
            <div className="globe-instructions">
              <h4 style={{color: teamColor}}>Globe Controls</h4>
              <ul>
                <li>Click and drag to rotate the globe</li>
                <li>Scroll to zoom in/out</li>
                <li>Click "Reset View" to return to team location</li>
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
          background-color: #000510;
          border-radius: 0 0 8px 8px;
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
          height: 600px;
          width: 100%;
          overflow: hidden;
          position: relative;
          background-color: transparent;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          margin: 10px 0;
        }
        
        /* Globe Tooltip */
        .globe-tooltip {
          font-family: Arial, sans-serif;
          max-width: 200px;
          box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);
        }
        
        /* Controls Styling */
        .globe-controls {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          position: relative;
          z-index: 1000;
        }
        
        .reset-button {
          border: none;
          border-radius: 30px;
          padding: 8px 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }
        
        .reset-button svg {
          margin-right: 6px;
        }
        
        /* Team Info Panel */
        .team-info-panel {
          border-radius: 8px;
          overflow: hidden;
          width: 280px;
          border: 1px solid;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        
        .team-info-header {
          padding: 10px 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
        }
        
        .team-info-content {
          padding: 12px 15px;
        }
        
        .info-row {
          margin-bottom: 6px;
          font-size: 14px;
        }
        
        .info-row:last-child {
          margin-bottom: 0;
        }
        
        /* Globe Instructions */
        .globe-instructions {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 12px 15px;
          margin-top: 10px;
        }
        
        .globe-instructions h4 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 16px;
        }
        
        .globe-instructions ul {
          padding-left: 20px;
          margin: 8px 0 0;
        }
        
        .globe-instructions li {
          margin-bottom: 4px;
          font-size: 14px;
          color: #333;
        }
        
        /* Responsive Styles */
        @media (max-width: 768px) {
          .globe-container {
            height: 400px;
          }
          
          .globe-controls {
            flex-direction: column;
            gap: 10px;
          }
          
          .team-info-panel {
            width: 100%;
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default RosterMap;