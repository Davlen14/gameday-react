import React, { useState, useEffect, useRef } from "react";
import { 
  FaMapMarkerAlt, 
  FaExclamationTriangle, 
  FaInfoCircle,
  FaWeight,
  FaRulerVertical,
  FaUser,
  FaIdCard,
  FaGraduationCap,
  FaCity,
  FaFlag,
  FaSearch,
  FaCompass,
  FaFilter,
  FaGlobeAmericas
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

// Gets player initials
const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
};

// Format height from inches to feet and inches
const formatHeight = (heightInInches) => {
  if (!heightInInches) return "N/A";
  
  const inches = parseInt(heightInInches, 10);
  if (isNaN(inches)) return "N/A";
  
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  
  return `${feet}'${remainingInches}"`;
};

const RosterMap = ({ teamName, teamColor, year = 2024 }) => {
  const [roster, setRoster] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [filterPosition, setFilterPosition] = useState('All');
  const [positionGroups, setPositionGroups] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stadiumLocation, setStadiumLocation] = useState(null);
  const [playersWithLocation, setPlayersWithLocation] = useState([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // THREE.js refs
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const globeRef = useRef(null);
  const markersRef = useRef({});
  const animationRef = useRef(null);
  const tooltipRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const targetPositionRef = useRef(null);
  const initialPositionRef = useRef(null);
  
  // Constants for the globe
  const GLOBE_RADIUS = 100;
  const MARKER_SIZE = 2;
  const MARKER_HEIGHT = 4;
  const TEAM_MARKER_SIZE = 4;
  const TEAM_MARKER_HEIGHT = 6;
  
  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };
  
  // Fetch roster data
  useEffect(() => {
    const fetchRoster = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await teamsService.getTeamRoster(teamName, year);
        setRoster(data);
        
        // Extract players with location data
        const playersWithCoords = data.filter(p => p.homeLatitude && p.homeLongitude);
        setPlayersWithLocation(playersWithCoords);
        
        // Extract unique position groups for filtering
        const positions = ['All', ...new Set(data.map(player => player.position))].filter(Boolean);
        setPositionGroups(positions);
        
        // Fetch team location data
        const teamsData = await teamsService.getTeams();
        const team = teamsData.find(t => t.school === teamName);
        
        if (team) {
          setTeamData(team);
          
          // Set stadium location using the team's actual location data
          if (team.location && team.location.latitude && team.location.longitude) {
            setStadiumLocation([team.location.latitude, team.location.longitude]);
            console.log("Set stadium location:", [team.location.latitude, team.location.longitude]);
          } else {
            console.warn("Team location data missing or incomplete:", team);
            // Use a default location for the team if not provided
            setStadiumLocation([39.8283, -98.5795]);
          }
        } else {
          console.warn("Team not found:", teamName);
        }
      } catch (err) {
        console.error("Error fetching roster:", err.message);
        setError("Failed to load roster information.");
        setRoster([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoster();
  }, [teamName, year]);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || isLoading || error) return;
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000510);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
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
    
    // Load earth textures (using NASA textures)
    Promise.all([
      new Promise(resolve => textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg', resolve)),
      new Promise(resolve => textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg', resolve)),
      new Promise(resolve => textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg', resolve)),
    ]).then(([earthMap, earthSpecular, earthNormal]) => {
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
      
      // Add markers when textures are loaded
      addMarkersToGlobe();
      
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
      
      // Start animation loop
      animate();
      
      // Start initial zoom animation to team location
      if (stadiumLocation) {
        const [lat, lon] = stadiumLocation;
        const targetVector = latLongToVector3(lat, lon, GLOBE_RADIUS);
        targetPositionRef.current = targetVector.clone().normalize().multiplyScalar(GLOBE_RADIUS * 1.5);
        
        // Start animation
        animateToTeam();
      }
    });
    
    // Cleanup on unmount
    return () => {
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
  
  // Add markers to globe when roster and team data are loaded
  const addMarkersToGlobe = () => {
    if (!sceneRef.current || !stadiumLocation || !playersWithLocation.length) return;
    
    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      sceneRef.current.remove(marker);
    });
    markersRef.current = {};
    
    // Add team stadium marker
    const [stadiumLat, stadiumLon] = stadiumLocation;
    const stadiumPosition = latLongToVector3(stadiumLat, stadiumLon, GLOBE_RADIUS);
    
    // Create team marker
    const teamMarkerGeometry = new THREE.CylinderGeometry(
      TEAM_MARKER_SIZE, // top radius
      TEAM_MARKER_SIZE / 2, // bottom radius
      TEAM_MARKER_HEIGHT, // height
      8 // radial segments
    );
    
    const teamMarkerMaterial = new THREE.MeshLambertMaterial({
      color: hexToThreeColor(teamColor),
      emissive: hexToThreeColor(lightenColor(teamColor, 20)),
      emissiveIntensity: 0.5
    });
    
    const teamMarker = new THREE.Mesh(teamMarkerGeometry, teamMarkerMaterial);
    
    // Position the marker
    const teamMarkerPosition = stadiumPosition.clone().normalize().multiplyScalar(GLOBE_RADIUS);
    teamMarker.position.copy(teamMarkerPosition);
    
    // Orient the marker to point away from center
    teamMarker.lookAt(teamMarkerPosition.clone().multiplyScalar(2));
    teamMarker.rotateX(Math.PI / 2);
    
    // Translate the marker so its base is at the globe surface
    const offset = teamMarkerPosition.clone().normalize().multiplyScalar(TEAM_MARKER_HEIGHT / 2);
    teamMarker.position.add(offset);
    
    // Add glow effect
    const teamGlowGeometry = new THREE.SphereGeometry(TEAM_MARKER_SIZE * 1.5, 16, 16);
    const teamGlowMaterial = new THREE.ShaderMaterial({
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
    
    const teamGlow = new THREE.Mesh(teamGlowGeometry, teamGlowMaterial);
    teamMarker.add(teamGlow);
    
    // Add to scene and store in ref
    sceneRef.current.add(teamMarker);
    markersRef.current.team = teamMarker;
    teamMarker.userData = { 
      type: 'team', 
      name: teamData?.school || teamName,
      location: teamData?.location?.name || 'Home Stadium',
      city: teamData?.location?.city,
      state: teamData?.location?.state
    };
    
    // Add player markers
    playersWithLocation.forEach(player => {
      if (!player.homeLatitude || !player.homeLongitude) return;
      
      // Only add markers for filtered players
      if (filterPosition !== 'All' && player.position !== filterPosition) return;
      
      // Search filter
      if (searchTerm) {
        const playerName = `${player.firstName || ''} ${player.lastName || ''}`.toLowerCase();
        const playerHometown = `${player.homeCity || ''} ${player.homeState || ''}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        if (!playerName.includes(searchLower) && 
            !playerHometown.includes(searchLower) && 
            !(player.position || '').toLowerCase().includes(searchLower)) {
          return;
        }
      }
      
      const playerPosition = latLongToVector3(player.homeLatitude, player.homeLongitude, GLOBE_RADIUS);
      
      // Create player marker
      const markerGeometry = new THREE.CylinderGeometry(
        MARKER_SIZE, // top radius
        MARKER_SIZE / 2, // bottom radius
        MARKER_HEIGHT, // height
        8 // radial segments
      );
      
      const markerMaterial = new THREE.MeshLambertMaterial({
        color: hexToThreeColor(teamColor),
        transparent: true,
        opacity: 0.8
      });
      
      const playerMarker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      // Position the marker
      const markerPosition = playerPosition.clone().normalize().multiplyScalar(GLOBE_RADIUS);
      playerMarker.position.copy(markerPosition);
      
      // Orient the marker to point away from center
      playerMarker.lookAt(markerPosition.clone().multiplyScalar(2));
      playerMarker.rotateX(Math.PI / 2);
      
      // Translate the marker so its base is at the globe surface
      const markerOffset = markerPosition.clone().normalize().multiplyScalar(MARKER_HEIGHT / 2);
      playerMarker.position.add(markerOffset);
      
      // Store player data with the marker
      playerMarker.userData = { player, type: 'player' };
      
      // Add to scene and store in ref
      sceneRef.current.add(playerMarker);
      markersRef.current[player.id] = playerMarker;
    });
  };
  
  // Create animation to zoom to the team location
  const animateToTeam = () => {
    if (!cameraRef.current || !targetPositionRef.current || !initialPositionRef.current) return;
    
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
      }
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animateFrame);
  };
  
  // Animation loop
  const animate = () => {
    if (!globeRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    
    // Gentle globe rotation only if animation is complete and no player is selected
    if (animationComplete && !selectedPlayer && globeRef.current) {
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
  
  // Update markers when filters change
  useEffect(() => {
    addMarkersToGlobe();
  }, [filterPosition, searchTerm, playersWithLocation]);
  
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
  
  // Handle mouse moves for interactive elements
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleMouseMove = (event) => {
      if (!containerRef.current || !sceneRef.current || !cameraRef.current || !tooltipRef.current) return;
      
      // Calculate mouse position in normalized device coordinates
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      
      // Update the raycaster
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      
      // Find intersections with markers
      const allMarkers = Object.values(markersRef.current);
      const intersects = raycasterRef.current.intersectObjects(allMarkers);
      
      if (intersects.length > 0 && intersects[0].object.userData) {
        const userData = intersects[0].object.userData;
        
        // Set tooltip content and position
        if (userData.type === 'team') {
          tooltipRef.current.innerHTML = `
            <div><strong>${userData.name}</strong></div>
            <div>${userData.location}</div>
            ${userData.city && userData.state ? `<div>${userData.city}, ${userData.state}</div>` : ''}
          `;
        } else if (userData.type === 'player' && userData.player) {
          const player = userData.player;
          tooltipRef.current.innerHTML = `
            <div><strong>${player.firstName} ${player.lastName}</strong></div>
            <div>${player.position || ''} #${player.jersey || ''}</div>
            <div>${player.homeCity}, ${player.homeState}</div>
          `;
        }
        
        // Position tooltip next to mouse
        tooltipRef.current.style.left = `${event.clientX + 15}px`;
        tooltipRef.current.style.top = `${event.clientY + 15}px`;
        tooltipRef.current.style.display = 'block';
        
        // Change cursor
        containerRef.current.style.cursor = 'pointer';
      } else {
        // Hide tooltip when not hovering over a marker
        tooltipRef.current.style.display = 'none';
        containerRef.current.style.cursor = 'default';
      }
    };
    
    const handleClick = (event) => {
      if (!containerRef.current || !sceneRef.current || !cameraRef.current) return;
      
      // Calculate mouse position in normalized device coordinates
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      
      // Update the raycaster
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      
      // Find intersections with markers
      const allMarkers = Object.values(markersRef.current);
      const intersects = raycasterRef.current.intersectObjects(allMarkers);
      
      if (intersects.length > 0 && intersects[0].object.userData) {
        const userData = intersects[0].object.userData;
        
        if (userData.type === 'player' && userData.player) {
          // Select player
          setSelectedPlayer(userData.player);
          
          // Animate camera to player location
          const player = userData.player;
          const playerPosition = latLongToVector3(player.homeLatitude, player.homeLongitude, GLOBE_RADIUS);
          const playerNormal = playerPosition.clone().normalize();
          
          // Set camera target and position
          const newPosition = playerNormal.clone().multiplyScalar(GLOBE_RADIUS * 1.8);
          cameraRef.current.position.copy(newPosition);
          cameraRef.current.lookAt(0, 0, 0);
          
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
        } else if (userData.type === 'team') {
          // Reset selection
          setSelectedPlayer(null);
          
          // Animate camera to team location
          const [lat, lon] = stadiumLocation;
          const teamPosition = latLongToVector3(lat, lon, GLOBE_RADIUS);
          const teamNormal = teamPosition.clone().normalize();
          
          // Set camera target and position
          const newPosition = teamNormal.clone().multiplyScalar(GLOBE_RADIUS * 1.8);
          cameraRef.current.position.copy(newPosition);
          cameraRef.current.lookAt(0, 0, 0);
          
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
        }
      }
    };
    
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('click', handleClick);
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [stadiumLocation]);
  
  // Toggle filter panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterPosition('All');
    setSearchTerm('');
    setSelectedPlayer(null);
    
    // Reset camera to initial view of globe
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 350);
      cameraRef.current.lookAt(0, 0, 0);
      
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  };
  
  // Close player info panel
  const closePlayerInfo = () => {
    setSelectedPlayer(null);
  };
  
  // Find home state distribution
  const stateDistribution = roster.reduce((acc, player) => {
    if (player.homeState) {
      acc[player.homeState] = (acc[player.homeState] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Sort states by count
  const topStates = Object.entries(stateDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="dashboard-card full-width-card">
      <div className="card-header" style={cardHeaderStyle}>
        <FaGlobeAmericas style={{ marginRight: "12px", color: teamColor }} />
        Roster Map - 3D Globe
      </div>
      <div className="card-body roster-map-container">
        {isLoading ? (
          <div className="loading-indicator">
            <LoadingSpinner color={teamColor} />
            <p>Loading roster map...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <FaExclamationTriangle color="red" style={{ marginRight: "8px" }} />
            {error}
          </div>
        ) : (
          <>
            <div className="roster-map-controls">
              <div className="control-buttons">
                <button 
                  className="filter-toggle-button" 
                  onClick={toggleFilters}
                  style={{
                    backgroundColor: teamColor,
                    boxShadow: `0 4px 10px ${teamColor}50`
                  }}
                >
                  <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                
                <button 
                  className="reset-button" 
                  onClick={resetFilters}
                  style={{
                    backgroundColor: '#ffffff',
                    color: teamColor,
                    border: `2px solid ${teamColor}`,
                    boxShadow: `0 4px 10px ${teamColor}30`
                  }}
                >
                  <FaCompass /> Reset View
                </button>
              </div>
              
              <div className="search-container">
                <div className="search-input-wrapper" style={{borderColor: teamColor}}>
                  <FaSearch style={{color: teamColor}} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search players or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {showFilters && (
                <div className="filter-panel" style={{borderColor: `${teamColor}30`}}>
                  <h3 style={{color: teamColor}}>Filter By Position</h3>
                  <div className="position-filters">
                    {positionGroups.map(position => (
                      <button
                        key={position}
                        className={`position-filter-button ${filterPosition === position ? 'active' : ''}`}
                        onClick={() => setFilterPosition(position)}
                        style={{
                          backgroundColor: filterPosition === position ? teamColor : '#ffffff',
                          color: filterPosition === position ? '#ffffff' : teamColor,
                          borderColor: teamColor
                        }}
                      >
                        {position}
                      </button>
                    ))}
                  </div>
                  
                  <div className="map-stats">
                    <h3 style={{color: teamColor}}>Roster Breakdown</h3>
                    <div className="stat-item">
                      <div className="stat-label">Total Players:</div>
                      <div className="stat-value">{roster.length}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">States Represented:</div>
                      <div className="stat-value">{Object.keys(stateDistribution).length}</div>
                    </div>
                    <h4 style={{color: teamColor}}>Top States</h4>
                    <div className="top-states">
                      {topStates.map(([state, count]) => (
                        <div key={state} className="state-item">
                          <div className="state-name">{state}</div>
                          <div className="state-count" style={{backgroundColor: teamColor}}>{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="globe-instructions">
                    <h4 style={{color: teamColor}}>Globe Controls</h4>
                    <ul>
                      <li>Click and drag to rotate the globe</li>
                      <li>Scroll to zoom in/out</li>
                      <li>Click on markers to view player details</li>
                      <li>Hover over markers for quick info</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="globe-container" ref={containerRef}></div>
            
            {/* Player Info Panel */}
            {selectedPlayer && (
              <div className="player-info-panel" style={{borderColor: teamColor}}>
                <div className="info-header" style={{backgroundColor: teamColor}}>
                  <h3>{selectedPlayer.firstName} {selectedPlayer.lastName}</h3>
                  <button 
                    className="close-btn"
                    onClick={closePlayerInfo}
                  >×</button>
                </div>
                <div className="info-body">
                  <div className="player-details">
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaIdCard />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Jersey</div>
                        <div className="detail-value">{selectedPlayer.jersey || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaUser />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Position</div>
                        <div className="detail-value">{selectedPlayer.position || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaGraduationCap />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Year</div>
                        <div className="detail-value">{selectedPlayer.year || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaRulerVertical />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Height</div>
                        <div className="detail-value">{formatHeight(selectedPlayer.height)}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaWeight />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Weight</div>
                        <div className="detail-value">{selectedPlayer.weight ? `${selectedPlayer.weight} lbs` : 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaCity />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Hometown</div>
                        <div className="detail-value">{selectedPlayer.homeCity}, {selectedPlayer.homeState}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaFlag />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Country</div>
                        <div className="detail-value">{selectedPlayer.homeCountry || 'USA'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CSS styles in component */}
      <style>{`
        /* Base Styles */
        .roster-map-container {
          position: relative;
          padding: 0;
          overflow: hidden;
        }
        
        .loading-indicator, .error-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }
        
        .error-message {
          color: #e53935;
          font-weight: 500;
        }
        
        /* Globe Container */
        .globe-container {
          height: 700px;
          width: 100%;
          overflow: hidden;
          position: relative;
          background-color: #000510;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        /* Globe Tooltip */
        .globe-tooltip {
          font-family: Arial, sans-serif;
          max-width: 200px;
          box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);
        }
        
        /* Controls Styling */
        .roster-map-controls {
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px 8px 0 0;
          border-bottom: 1px solid #eaeaea;
          position: relative;
          z-index: 1000;
        }
        
        .control-buttons {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .filter-toggle-button, .reset-button {
          border: none;
          border-radius: 30px;
          padding: 8px 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .filter-toggle-button:hover, .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }
        
        .filter-toggle-button svg, .reset-button svg {
          margin-right: 6px;
        }
        
        .search-container {
          margin-bottom: 15px;
        }
        
        .search-input-wrapper {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 30px;
          padding: 5px 15px;
          border: 2px solid;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        
        .search-input {
          border: none;
          outline: none;
          width: 100%;
          padding: 8px 10px;
          font-size: 16px;
        }
        
        /* Filter Panel */
        .filter-panel {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .filter-panel h3, .filter-panel h4 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 18px;
        }
        
        .position-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        
        .position-filter-button {
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 500;
          cursor: pointer;
          border: 2px solid;
          transition: all 0.2s ease;
        }
        
        .position-filter-button:hover {
          transform: translateY(-2px);
        }
        
        /* Stats Styling */
        .map-stats {
          border-top: 1px solid #eaeaea;
          padding-top: 15px;
          margin-bottom: 15px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-weight: 500;
        }
        
        .stat-value {
          font-weight: 600;
        }
        
        .top-states {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        
        .state-item {
          display: flex;
          align-items: center;
          background: #f5f5f5;
          border-radius: 20px;
          padding: 0 5px 0 10px;
          font-size: 14px;
        }
        
        .state-name {
          margin-right: 8px;
        }
        
        .state-count {
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }
        
        /* Globe Instructions */
        .globe-instructions {
          border-top: 1px solid #eaeaea;
          padding-top: 15px;
        }
        
        .globe-instructions ul {
          padding-left: 20px;
          margin: 10px 0;
        }
        
        .globe-instructions li {
          margin-bottom: 6px;
          font-size: 14px;
        }
        
        /* Player Info Panel */
        .player-info-panel {
          position: absolute;
          top: 80px;
          right: 20px;
          width: 300px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid;
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .info-header {
          padding: 15px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .info-header h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        
        .info-body {
          padding: 15px;
        }
        
        .player-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .detail-row {
          display: flex;
          align-items: center;
        }
        
        .detail-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }
        
        .detail-content {
          flex: 1;
        }
        
        .detail-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .detail-value {
          font-weight: 600;
          font-size: 16px;
        }
        
        /* Responsive Styles */
        @media (max-width: 768px) {
          .globe-container {
            height: 500px;
          }
          
          .player-info-panel {
            top: auto;
            right: auto;
            bottom: 10px;
            left: 10px;
            width: calc(100% - 20px);
          }
          
          .control-buttons {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default RosterMap;