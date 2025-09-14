/**
 * MapManager - Handles Leaflet map operations and visualization
 * Simplified version for track and icon display only
 */

import { CONFIG, getMapTypeConfig } from '../config.js';

export class MapManager {
    constructor(mapElementId = 'map') {
        this.map = null;
        this.currentTileLayer = null;
        this.currentMapType = 'osm';
        this.mapElementId = mapElementId;
        
        // Layer groups for organized display
        this.trackLayerGroup = null;
        this.iconLayerGroup = null;
        
        // Visibility states
        this.tracksVisible = true;
        this.iconsVisible = true;
    }

    /**
     * Initialize the Leaflet map
     * @param {Object} options - Map initialization options
     */
    init(options = {}) {
        const defaultOptions = {
            center: CONFIG.map.defaultCenter,
            zoom: CONFIG.map.defaultZoom,
            ...options
        };

        // Initialize Leaflet map with fine-grained zoom settings
        this.map = L.map(this.mapElementId, {
            zoomDelta: CONFIG.map.zoom.zoomDelta,
            zoomSnap: CONFIG.map.zoom.zoomSnap,
            wheelPxPerZoomLevel: CONFIG.map.zoom.wheelPxPerZoomLevel,
            maxZoom: CONFIG.map.zoom.maxZoom,
            minZoom: CONFIG.map.zoom.minZoom
        }).setView(defaultOptions.center, defaultOptions.zoom);
        
        // Create layer groups
        this.trackLayerGroup = L.layerGroup().addTo(this.map);
        this.iconLayerGroup = L.layerGroup().addTo(this.map);
        
        // Set initial map type
        this.setMapType('osm');
        
        // Add scale control
        L.control.scale().addTo(this.map);
        
        console.log('MapManager: Map initialized');
    }

    /**
     * Set map type
     * @param {string} mapType - Map type ('osm', 'satellite', 'terrain', 'none')
     */
    setMapType(mapType) {
        // Remove current tile layer
        if (this.currentTileLayer) {
            this.map.removeLayer(this.currentTileLayer);
            this.currentTileLayer = null;
        }
        
        // Don't add any tiles for 'none' type (transparent mode)
        if (mapType === 'none') {
            this.currentMapType = 'none';
            return;
        }
        
        // Get map type configuration
        const mapConfig = getMapTypeConfig(mapType);
        if (!mapConfig) {
            console.warn(`MapManager: Unknown map type: ${mapType}`);
            return;
        }
        
        // Create and add new tile layer
        this.currentTileLayer = L.tileLayer(mapConfig.url, {
            attribution: mapConfig.attribution,
            maxZoom: mapConfig.maxZoom,
            opacity: CONFIG.map.opacity / 100
        });
        
        this.currentTileLayer.addTo(this.map);
        this.currentMapType = mapType;
        
        console.log(`MapManager: Map type changed to ${mapType} with opacity ${CONFIG.map.opacity}%`);
    }

    /**
     * Display tracks on the map
     * @param {Array} tracks - Array of track objects
     */
    displayTracks(tracks) {
        // Clear existing tracks
        this.trackLayerGroup.clearLayers();
        
        if (!tracks || tracks.length === 0) {
            return;
        }
        
        // Create polylines for each track
        tracks.forEach((track, index) => {
            if (!track.points || track.points.length < 2) {
                return;
            }
            
            // Create polyline with configured style
            const polyline = L.polyline(track.points, {
                color: CONFIG.map.tracks.color,
                weight: CONFIG.map.tracks.weight,
                opacity: CONFIG.map.tracks.opacity / 100,
                smoothFactor: CONFIG.map.tracks.smoothFactor
            });
            
            // Add popup with track info
            if (track.name || track.description) {
                polyline.bindPopup(`
                    <div>
                        <strong>${track.name || `Track ${index + 1}`}</strong>
                        ${track.description ? `<br>${track.description}` : ''}
                        <br>Points: ${track.points.length}
                    </div>
                `);
            }
            
            // Add to track layer group
            this.trackLayerGroup.addLayer(polyline);
        });
        
        console.log(`MapManager: Displayed ${tracks.length} tracks`);
    }

    /**
     * Display icons/placemarks on the map
     * @param {Array} icons - Array of icon objects
     */
    displayIcons(icons) {
        // Clear existing icons
        this.iconLayerGroup.clearLayers();
        
        if (!icons || icons.length === 0) {
            return;
        }
        
        // Create markers for each icon
        icons.forEach((icon, index) => {
            if (!icon.position || typeof icon.position.lat !== 'number' || typeof icon.position.lon !== 'number') {
                return;
            }

            const latLng = [icon.position.lat, icon.position.lon];
            
            let marker;
            
            // Create marker with custom icon if available
            if (icon.iconUrl) {
                // Calculate scaled icon size
                const baseSize = icon.iconSize || CONFIG.kml.icons.defaultSize;
                const scaledSize = [
                    Math.round(baseSize[0] * CONFIG.kml.icons.scale),
                    Math.round(baseSize[1] * CONFIG.kml.icons.scale)
                ];
                const scaledAnchor = [
                    Math.round(scaledSize[0] / 2),
                    Math.round(scaledSize[1] / 2)
                ];
                
                const customIcon = L.icon({
                    iconUrl: icon.iconUrl,
                    iconSize: scaledSize,
                    iconAnchor: scaledAnchor,
                    popupAnchor: [0, -scaledSize[1] / 2],
                    className: 'custom-icon'
                });
                
                marker = L.marker(latLng, { icon: customIcon });
            } else {
                // Use default marker with custom styling
                const defaultIcon = L.divIcon({
                    className: 'kml-icon default-icon',
                    html: `<div style="
                        width: 16px; 
                        height: 16px; 
                        background: #ff1493; 
                        border: 2px solid white; 
                        border-radius: 50%;
                        box-shadow: 0 0 10px rgba(0,0,0,0.5);
                    "></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                
                marker = L.marker(latLng, { icon: defaultIcon });
            }
            
            // Add popup with icon info
            if (CONFIG.kml.icons.showPopups && (icon.name || icon.description)) {
                marker.bindPopup(`
                    <div>
                        <strong>${icon.name || `Point ${index + 1}`}</strong>
                        ${icon.description ? `<br>${icon.description}` : ''}
                        <br>Position: ${icon.position.lat.toFixed(6)}, ${icon.position.lon.toFixed(6)}
                    </div>
                `);
            }
            
            // Add to icon layer group
            this.iconLayerGroup.addLayer(marker);
        });
        
        console.log(`MapManager: Displayed ${icons.length} icons`);
    }

    /**
     * Set track visibility
     * @param {boolean} visible - Whether tracks should be visible
     */
    setTracksVisible(visible) {
        this.tracksVisible = visible;
        
        if (visible) {
            if (!this.map.hasLayer(this.trackLayerGroup)) {
                this.map.addLayer(this.trackLayerGroup);
            }
        } else {
            if (this.map.hasLayer(this.trackLayerGroup)) {
                this.map.removeLayer(this.trackLayerGroup);
            }
        }
        
        console.log(`MapManager: Tracks ${visible ? 'shown' : 'hidden'}`);
    }

    /**
     * Set icon visibility
     * @param {boolean} visible - Whether icons should be visible
     */
    setIconsVisible(visible) {
        this.iconsVisible = visible;
        
        if (visible) {
            if (!this.map.hasLayer(this.iconLayerGroup)) {
                this.map.addLayer(this.iconLayerGroup);
            }
        } else {
            if (this.map.hasLayer(this.iconLayerGroup)) {
                this.map.removeLayer(this.iconLayerGroup);
            }
        }
        
        console.log(`MapManager: Icons ${visible ? 'shown' : 'hidden'}`);
    }

    /**
     * Fit map view to show all content (tracks and icons)
     * @param {Array} tracks - Array of track objects
     * @param {Array} icons - Array of icon objects
     */
    fitToContent(tracks = [], icons = []) {
        const allPoints = [];
        
        // Collect all track points
        tracks.forEach(track => {
            if (track.points && track.points.length > 0) {
                allPoints.push(...track.points);
            }
        });
        
        // Collect all icon positions
        icons.forEach(icon => {
            if (icon.position && typeof icon.position.lat === 'number' && typeof icon.position.lon === 'number') {
                allPoints.push([icon.position.lat, icon.position.lon]);
            }
        });
        
        // Fit map to bounds if we have points
        if (allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints);
            this.map.fitBounds(bounds, { padding: [20, 20] });
        }
        
        console.log(`MapManager: Fitted map to ${allPoints.length} points`);
    }

    /**
     * Clear all layers
     */
    clearAll() {
        if (this.trackLayerGroup) {
            this.trackLayerGroup.clearLayers();
        }
        if (this.iconLayerGroup) {
            this.iconLayerGroup.clearLayers();
        }
        
        console.log('MapManager: All layers cleared');
    }

    /**
     * Get the Leaflet map instance
     * @returns {L.Map} Leaflet map instance
     */
    getMap() {
        return this.map;
    }

    /**
     * Get current map center
     * @returns {Object} {lat, lng} coordinates
     */
    getCenter() {
        return this.map ? this.map.getCenter() : null;
    }

    /**
     * Get current zoom level
     * @returns {number} Current zoom level
     */
    getZoom() {
        return this.map ? this.map.getZoom() : null;
    }

    /**
     * Set map view to specific coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {number} zoom - Zoom level
     */
    setView(lat, lon, zoom = CONFIG.map.defaultZoom) {
        if (this.map) {
            this.map.setView([lat, lon], zoom);
        }
    }

    /**
     * Get current map type
     * @returns {string} Current map type
     */
    getCurrentMapType() {
        return this.currentMapType;
    }

    /**
     * Check if tracks are visible
     * @returns {boolean} True if tracks are visible
     */
    areTracksVisible() {
        return this.tracksVisible;
    }

    /**
     * Check if icons are visible
     * @returns {boolean} True if icons are visible
     */
    areIconsVisible() {
        return this.iconsVisible;
    }

    /**
     * Set map opacity
     * @param {number} opacity - Opacity value (0-100)
     */
    setMapOpacity(opacity) {
        // Clamp opacity value between 0 and 100
        opacity = Math.max(0, Math.min(100, opacity));
        
        // Convert to 0-1 range for Leaflet
        const leafletOpacity = opacity / 100;
        
        // Update current tile layer opacity if it exists
        if (this.currentTileLayer) {
            this.currentTileLayer.setOpacity(leafletOpacity);
        }
        
        console.log(`MapManager: Map opacity set to ${opacity}%`);
    }

    /**
     * Get current map opacity
     * @returns {number} Current opacity (0-100)
     */
    getMapOpacity() {
        if (this.currentTileLayer) {
            return Math.round(this.currentTileLayer.options.opacity * 100);
        }
        return CONFIG.map.opacity;
    }
}