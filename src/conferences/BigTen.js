import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import teamsService from '../services/teamsService';

/**
 *  This TopoJSON file is a good, minimal US map projection.
 *  It's from: https://github.com/deldersveld/topojson/tree/master/countries/united-states
 *  Feel free to customize or replace with another geoUrl if you prefer a different map style.
 */
const geoUrl =
  'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/united-states/us-albers.json';

const BigTen = () => {
  const [bigTenTeams, setBigTenTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBigTenTeams = async () => {
      try {
        const allTeams = await teamsService.getTeams();
        const filtered = allTeams.filter(
          (team) =>
            team.conference === 'Big Ten' &&
            team.location?.latitude &&
            team.location?.longitude
        );
        setBigTenTeams(filtered);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Big Ten teams:', error);
        setIsLoading(false);
      }
    };

    fetchBigTenTeams();
  }, []);

  if (isLoading) {
    return <div>Loading Big Ten Map...</div>;
  }

  // --- Inline "CSS" styling ---
  // Container around the map
  const containerStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '1000px',
    margin: '0 auto',
    backgroundColor: '#1C1C1C', // dark background to mimic the "stylized" look
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  };

  // The actual map styling
  const mapStyle = {
    width: '100%',
    height: 'auto',
  };

  // Footer label in the corner
  const footerLabelStyle = {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '10px',
    borderRadius: '5px',
    fontWeight: 'bold',
    color: '#000',
  };

  return (
    <div style={containerStyle}>
      {/* 
        ComposableMap automatically handles your projection for you.
        `projection="geoAlbersUsa"` is great for a US map.
      */}
      <ComposableMap projection="geoAlbersUsa" style={mapStyle}>
        {/* 
          Draw the underlying US geographies.
          You can customize fill/stroke to mimic the style in your second image.
        */}
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#2f2f2f"       // fill color of states
                stroke="#ffffff"     // white state lines
                strokeWidth={0.5}
              />
            ))
          }
        </Geographies>

        {/* 
          Place your Big Ten team logos as markers on the map. 
          We use an <svg> <image> with a clipPath to create a circular logo. 
        */}
        {bigTenTeams.map((team) => {
          const { latitude, longitude } = team.location;
          const logoUrl = team.logos?.[0] || '/photos/default-team.png';

          return (
            <Marker key={team.id} coordinates={[longitude, latitude]}>
              {/* 
                We shift by half the width/height so the marker is centered. 
                We also define a circular clipPath for the logo. 
              */}
              <g transform="translate(-25, -25)">
                <defs>
                  <clipPath id={`clip-${team.id}`}>
                    <circle cx="25" cy="25" r="20" />
                  </clipPath>
                </defs>
                {/* The circle "border" behind the logo */}
                <circle
                  cx="25"
                  cy="25"
                  r="25"
                  fill={team.color || '#fff'} // team color or white
                  stroke="#fff"
                  strokeWidth="2"
                />
                {/* The logo image, clipped to a circle */}
                <image
                  href={logoUrl}
                  width="50"
                  height="50"
                  clipPath={`url(#clip-${team.id})`}
                />
              </g>
            </Marker>
          );
        })}
      </ComposableMap>

      <div style={footerLabelStyle}>Big Ten Conference Map - 2024 Season</div>
    </div>
  );
};

export default BigTen;