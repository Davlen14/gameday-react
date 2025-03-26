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
  const [zoomLevel, setZoomLevel] = useState(0); // 0: space, 1: continent, 2: country, 3: state, 4: stadium
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
  const initialCameraPositionRef = useRef(null);
  const targetCameraPositionRef = useRef(null);
  const textureLoaderRef = useRef(null);

  // Constants for the globe
  const GLOBE_RADIUS = 100;
  const MARKER_SIZE = 3.5;

  // Simplify - let's not rely on external textures that might fail

  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };

  // Direct team data use (skipping fetch when we already have the data)
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Skip API call if we already have explicit team data or just use the name to fetch
    if (teamName) {
      try {
        // For Ohio State hardcoded data
        if (teamName === "Ohio State") {
          const teamData = {
            school: "Ohio State",
            mascot: "Buckeyes",
            abbreviation: "OSU",
            conference: "Big Ten",
            color: "#ce1141",
            logos: ["http://a.espncdn.com/i/teamlogos/ncaa/500/194.png"],
            location: {
              name: "Ohio Stadium",
              city: "Columbus",
              state: "OH",
              latitude: 40.0016447,
              longitude: -83.0197266
            }
          };
          
          setTeamData(teamData);
          setStadiumLocation([teamData.location.latitude, teamData.location.longitude]);
          
          // Preload team logo
          if (teamData.logos && teamData.logos[0]) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.crossOrigin = "anonymous";
            textureLoader.load(
              teamData.logos[0],
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
          // Fetch team data from service for other teams
          const fetchTeam = async () => {
            try {
              const teamsData = await teamsService.getTeams();
              const team = teamsData.find(t => t.school === teamName);
              
              if (team) {
                setTeamData(team);
                
                if (team.location && team.location.latitude && team.location.longitude) {
                  setStadiumLocation([team.location.latitude, team.location.longitude]);
                } else {
                  console.warn("Team location data missing or incomplete:", team);
                  setStadiumLocation([39.8283, -98.5795]); // US center fallback
                }
                
                // Preload team logo
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
            }
          };
          
          fetchTeam();
        }
      } catch (err) {
        console.error("Error setting up team data:", err.message);
        setError("Failed to load team information.");
      }
    } else {
      setError("No team name provided");
    }
    
    setIsLoading(false);
  }, [teamName, year]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    console.log("Initializing Three.js scene");

    try {
      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0x000000);

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
      directionalLight.position.set(5, 3, 5);
      scene.add(directionalLight);

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        45, // FOV
        containerRef.current.clientWidth / containerRef.current.clientHeight, // aspect ratio
        0.1, // near plane
        10000 // far plane
      );
      camera.position.set(0, 0, 300);
      initialCameraPositionRef.current = new THREE.Vector3(0, 0, 300);
      cameraRef.current = camera;

      // Create renderer - explicitly handle WebGL support
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: document.createElement('canvas'),
          antialias: true,
          alpha: true,
          logarithmicDepthBuffer: false // Disable this to improve compatibility
        });
        
        console.log("WebGL renderer created successfully");
      } catch (err) {
        console.error("WebGL renderer creation failed:", err);
        setError("Your browser doesn't support WebGL properly. Please try a different browser.");
        return;
      }
      
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(1); // Force to 1 for reliability
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Add orbit controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.3;
      controls.enablePan = false;
      controls.minDistance = GLOBE_RADIUS * 1.1;
      controls.maxDistance = GLOBE_RADIUS * 10;
      controls.enabled = false; // Disabled until initial animation completes
      controlsRef.current = controls;

      // Create textureLoader for reuse
      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = "anonymous";
      textureLoaderRef.current = textureLoader;

      console.log("Creating initial earth and stars");
      
      // Create a simple earth immediately (guaranteed to work)
      const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 32, 32);
      const earthMaterial = new THREE.MeshBasicMaterial({
        color: 0x2244aa,
      });
      
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);
      earthRef.current = earth;
      globeRef.current = earth;
      
      // Create basic continents
      const continentsGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.2, 32, 32);
      const continentsMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x44aa66,
        wireframe: false 
      });
      const continents = new THREE.Mesh(continentsGeometry, continentsMaterial);
      scene.add(continents);
      
      // Create stars background
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
        size: 2,
      });
      
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(stars);
      
      // If we have stadium location, add marker right away with basic implementation
      if (stadiumLocation) {
        addSimpleTeamMarker();
      }
      
      // Start the animation loop
      const animateLoop = () => {
        if (!globeRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
        
        // Gentle earth rotation
        if (globeRef.current) {
          globeRef.current.rotation.y += 0.001;
        }
        
        // Update controls if enabled
        if (controlsRef.current && controlsRef.current.enabled) {
          controlsRef.current.update();
        }
        
        // Render scene
        renderer.render(scene, camera);
        
        // Continue animation loop
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

      // Cleanup on unmount
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
    } catch (err) {
      console.error("Error in THREE.js initialization:", err);
      setError("Failed to initialize 3D visualization");
    }
  }, []);

  // Create a basic Earth immediately for fast initial rendering
  const createBasicEarth = () => {
    if (!sceneRef.current) return;
    
    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2244aa,
      specular: 0x333333,
      shininess: 15,
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    sceneRef.current.add(earth);
    earthRef.current = earth;
    globeRef.current = earth;
  };

  // Create stars background
  const createStarsBackground = () => {
    if (!sceneRef.current) return;
    
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 7000;
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2000;
      positions[i + 1] = (Math.random() - 0.5) * 2000;
      positions[i + 2] = (Math.random() - 0.5) * 2000;

      // Randomize star colors for more realism
      const colorChoice = Math.random();
      if (colorChoice < 0.2) {
        // Bluish stars
        colors[i] = 0.7 + Math.random() * 0.3;
        colors[i + 1] = 0.7 + Math.random() * 0.3;
        colors[i + 2] = 1.0;
      } else if (colorChoice < 0.4) {
        // Yellow-white stars
        colors[i] = 1.0;
        colors[i + 1] = 0.9 + Math.random() * 0.1;
        colors[i + 2] = 0.7 + Math.random() * 0.3;
      } else {
        // White stars
        colors[i] = 0.9 + Math.random() * 0.1;
        colors[i + 1] = 0.9 + Math.random() * 0.1;
        colors[i + 2] = 0.9 + Math.random() * 0.1;
      }
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    sceneRef.current.add(stars);
  };

  // Load detailed Earth with textures
  const loadDetailedEarth = () => {
    if (!sceneRef.current || !textureLoaderRef.current) return;
    
    const textureLoader = textureLoaderRef.current;
    
    // Improved texture loading with better error handling
    const loadTexture = (url) => {
      return new Promise((resolve, reject) => {
        textureLoader.load(
          url, 
          (texture) => resolve(texture),
          undefined,  // progress callback
          (error) => {
            console.error(`Failed to load texture from ${url}:`, error);
            reject(error);
          }
        );
      });
    };

    // Load earth textures with realistic fallbacks
    Promise.all([
      loadTexture(TEXTURE_URLS.earth).catch(() => null),
      loadTexture(TEXTURE_URLS.specular).catch(() => null),
      loadTexture(TEXTURE_URLS.normal).catch(() => null),
      loadTexture(TEXTURE_URLS.clouds).catch(() => null),
    ]).then(([earthMap, earthSpecular, earthNormal, cloudsTexture]) => {
      // Remove the basic earth if it exists
      if (earthRef.current && sceneRef.current) {
        sceneRef.current.remove(earthRef.current);
      }

      // Create Earth globe with available textures
      const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
      const earthMaterialOptions = {
        shininess: 25,
      };
      
      // Add textures if they loaded successfully
      if (earthMap) earthMaterialOptions.map = earthMap;
      if (earthSpecular) earthMaterialOptions.specularMap = earthSpecular;
      if (earthNormal) earthMaterialOptions.normalMap = earthNormal;
      
      const earthMaterial = new THREE.MeshPhongMaterial(earthMaterialOptions);
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      
      earth.castShadow = true;
      earth.receiveShadow = true;
      earth.rotation.y = Math.PI; // Adjust initial rotation to align properly
      sceneRef.current.add(earth);
      earthRef.current = earth;
      globeRef.current = earth;

      // Add cloud layer if texture loaded
      if (cloudsTexture) {
        const cloudsGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.5, 64, 64);
        const cloudsMaterial = new THREE.MeshPhongMaterial({
          map: cloudsTexture,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        });

        const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        sceneRef.current.add(clouds);
        cloudsRef.current = clouds;
      }

      // Create atmosphere glow
      const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 32, 32);
      const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPositionNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPositionNormal;
          void main() {
            float intensity = pow(0.75 - dot(vPositionNormal, vec3(0.0, 0.0, 1.0)), 5.0);
            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });

      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      sceneRef.current.add(atmosphere);

      // Add team logo marker if we have the location
      if (stadiumLocation) {
        addTeamLogoMarker();
        
        // Start initial zoom animation after everything is loaded
        startZoomSequence();
      }
    }).catch(err => {
      console.error("Error in detailed Earth setup:", err);
      // The basic earth is already visible, so we can still continue
      
      // Add team logo marker with basic earth
      if (stadiumLocation) {
        addTeamLogoMarker();
        startZoomSequence();
      }
    });
  };

  // Add team marker when stadiumLocation changes
  useEffect(() => {
    if (stadiumLocation && sceneRef.current) {
      console.log("Stadium location set, adding marker:", stadiumLocation);
      addSimpleTeamMarker();
      
      // Only start zoom sequence if it hasn't been completed yet
      if (!animationComplete) {
        startZoomSequence();
      }
    }
  }, [stadiumLocation]);

  // Update marker when logoTexture changes
  useEffect(() => {
    if (logoTexture && stadiumLocation && sceneRef.current) {
      console.log("Logo texture loaded, updating marker");
      addFancyTeamMarker();
    }
  }, [logoTexture]);

  // Add simple team marker that's guaranteed to work
  const addSimpleTeamMarker = () => {
    if (!sceneRef.current || !stadiumLocation) return;

    console.log("Adding simple team marker at", stadiumLocation);

    // Remove existing marker if any
    if (teamMarkerRef.current) {
      sceneRef.current.remove(teamMarkerRef.current);
      teamMarkerRef.current = null;
    }

    const [stadiumLat, stadiumLon] = stadiumLocation;
    const stadiumPosition = latLongToVector3(stadiumLat, stadiumLon, GLOBE_RADIUS);

    // Create a simple and reliable marker
    const markerGeometry = new THREE.SphereGeometry(MARKER_SIZE * 2, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: teamColor || 0xff0000,
      transparent: true,
      opacity: 0.8
    });

    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Position on globe surface
    const markerPosition = stadiumPosition.clone().normalize().multiplyScalar(GLOBE_RADIUS + 1);
    marker.position.copy(markerPosition);
    
    // Add to scene
    sceneRef.current.add(marker);
    teamMarkerRef.current = marker;
    
    // After basic marker is added, try to add the fancy one
    if (logoTexture) {
      setTimeout(() => addFancyTeamMarker(), 500);
    }
  };
  
  // Add fancy team marker with logo and effects
  const addFancyTeamMarker = () => {
    if (!sceneRef.current || !stadiumLocation) return;

    // Remove existing marker if any
    if (teamMarkerRef.current) {
      sceneRef.current.remove(teamMarkerRef.current);
      teamMarkerRef.current = null;
    }

    try {
      const [stadiumLat, stadiumLon] = stadiumLocation;
      const stadiumPosition = latLongToVector3(stadiumLat, stadiumLon, GLOBE_RADIUS);

      // Create marker group
      const markerGroup = new THREE.Group();

      // Create a simple colored sphere (more reliable than glass effect)
      const sphereGeometry = new THREE.SphereGeometry(MARKER_SIZE * 1.5, 16, 16);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: hexToThreeColor(teamColor),
        transparent: true,
        opacity: 0.8
      });

      const sphereMarker = new THREE.Mesh(sphereGeometry, sphereMaterial);
      markerGroup.add(sphereMarker);

      // Create a team logo plane if we have a texture
      if (logoTexture) {
        const logoSize = MARKER_SIZE * 2;
        const logoGeometry = new THREE.PlaneGeometry(logoSize, logoSize);
        const logoMaterial = new THREE.MeshBasicMaterial({
          map: logoTexture,
          transparent: true,
          side: THREE.DoubleSide
        });

        const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
        logoMesh.position.z = MARKER_SIZE * 0.8; // Position slightly in front
        
        // Add logo to marker group
        markerGroup.add(logoMesh);
      }

      // Create beam pointing up from marker (simpler version)
      const beamGeometry = new THREE.CylinderGeometry(0.5, 0, 10, 8, 1);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: hexToThreeColor(teamColor),
        transparent: true,
        opacity: 0.5
      });

      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.y = 7;
      beam.rotation.x = Math.PI;
      markerGroup.add(beam);

      // Position the marker on the globe surface
      const markerPosition = stadiumPosition.clone().normalize().multiplyScalar(GLOBE_RADIUS + 1);
      markerGroup.position.copy(markerPosition);

      // Orient the marker to face outward
      const lookAtPoint = new THREE.Vector3().copy(markerPosition).multiplyScalar(2);
      markerGroup.lookAt(lookAtPoint);

      // Add marker to scene
      sceneRef.current.add(markerGroup);
      teamMarkerRef.current = markerGroup;
    } catch (err) {
      console.error("Error creating fancy marker:", err);
      // Fall back to simple marker
      addSimpleTeamMarker();
    }
  };

  // Simplified zoom sequence animation for better compatibility
  const startZoomSequence = () => {
    if (!stadiumLocation || !cameraRef.current) return;
    
    console.log("Starting zoom sequence to", stadiumLocation);
    
    // Cancel any existing zoom animation
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current);
    }

    setZoomLevel(0); // Start at space view

    try {
      // Get the stadium position in 3D space
      const [lat, lon] = stadiumLocation;
      
      // Rotate globe to show US (hard-coded rotation for reliability)
      if (globeRef.current) {
        // For US locations, this rotation works well as a starting point
        globeRef.current.rotation.y = Math.PI - Math.PI/4;
      }
      
      // Simple zoom animation that works reliably
      const startTime = performance.now();
      const duration = 3000; // 3 seconds
      const startPosition = new THREE.Vector3(0, 0, 300); // Start far out
      
      // End position looking at the stadium location
      const stadiumPosition = latLongToVector3(lat, lon, GLOBE_RADIUS);
      const endPosition = stadiumPosition.clone().normalize().multiplyScalar(GLOBE_RADIUS * 3);
      
      const animate = (time) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use simple linear animation for reliability
        const newPosition = new THREE.Vector3().lerpVectors(
          startPosition,
          endPosition,
          progress
        );

        if (cameraRef.current) {
          cameraRef.current.position.copy(newPosition);
          cameraRef.current.lookAt(0, 0, 0);
        }

        if (progress < 1) {
          zoomAnimationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          setAnimationComplete(true);
          setShowStadiumDetails(true);
          if (controlsRef.current) {
            controlsRef.current.enabled = true;
          }
        }
      };

      // Start the animation
      zoomAnimationRef.current = requestAnimationFrame(animate);
    } catch (err) {
      console.error("Error in zoom animation:", err);
      
      // If animation fails, just show the details panel anyway
      setAnimationComplete(true);
      setShowStadiumDetails(true);
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    }
  };

  // Animation loop
  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Gentle clouds rotation
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0002;
    }

    // Gentle earth rotation only if not in detailed zoom
    if (globeRef.current && zoomLevel < 3 && !animationComplete) {
      globeRef.current.rotation.y += 0.0003;
    }

    // Update team marker to always face camera if present
    if (teamMarkerRef.current && animationComplete) {
      // Find the logo plane within the marker group
      teamMarkerRef.current.children.forEach(child => {
        if (child.geometry instanceof THREE.PlaneGeometry) {
          // Make the logo look at the camera position
          const markerPosition = new THREE.Vector3();
          teamMarkerRef.current.getWorldPosition(markerPosition);
          
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
    if (cameraRef.current) {
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

      // Reset camera position
      cameraRef.current.position.set(0, 0, 300);
      cameraRef.current.lookAt(0, 0, 0);

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