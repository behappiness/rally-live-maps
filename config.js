/**
 * Rally Track Viewer Configuration
 * 
 * Simplified configuration for the track viewer application.
 */

export const CONFIG = {
    // Configuration version - increment to force cache reset
    version: '1.2.0',
    
    // Map Settings
    map: {
        // Default map center (lat, lon)
        defaultCenter: [47.69, 17.63],
        
        // Default zoom level
        defaultZoom: 13,
        
        // Zoom settings for fine-grained control
        zoom: {
            zoomDelta: 0.25,        // Zoom step size (default: 1)
            zoomSnap: 0.25,         // Zoom snap interval (default: 1)
            wheelPxPerZoomLevel: 120, // Mouse wheel sensitivity (default: 60)
            maxZoom: 20,            // Maximum zoom level
            minZoom: 8              // Minimum zoom level
        },
        
        // Map opacity (0-100)
        opacity: 100,
        
        // Available map types
        mapTypes: {
            osm: {
                name: 'OpenStreetMap',
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            },
            satellite: {
                name: 'Satellite',
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
                maxZoom: 18
            },
            terrain: {
                name: 'Terrain',
                url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                attribution: '© OpenTopoMap (CC-BY-SA)',
                maxZoom: 17
            }
        },
        
        // Track visualization settings
        tracks: {
            color: '#e20074',       // Magenta color for tracks
            weight: 10,             // Line thickness
            opacity: 100,           // Line opacity (0-100)
            smoothFactor: 1         // Line smoothing
        },
        
    },

    // KML File Settings
    kml: {
        // Default KML file to auto-load
        defaultFile: '2025gyor-2025-09-14_GE_SS_only.kml',
        
        // Icon settings
        icons: {
            defaultSize: [32, 32],      // Default icon size [width, height]
            defaultAnchor: [16, 16],    // Default anchor point
            scale: 2.0,                 // Icon scale multiplier (0.5 - 3.0)
            showPopups: true,           // Show popups on click
            cluster: false              // Cluster nearby icons
        }
    },

    // UI Settings
    ui: {
        // Options menu settings
        optionsMenu: {
            position: 'top-right',      // Position of options menu
            autoHide: true,             // Auto-hide menu after selection
            showToggleButton: true      // Show toggle button
        },
        
        // Info panel settings
        info: {
            position: 'bottom-left',    // Position of info panel
            showCounts: true            // Show track/icon counts
        }
    },

    // Development and Debug Settings
    debug: {
        // Enable console logging
        enableLogging: true,
        
        // Log levels: 'error', 'warn', 'info', 'debug'
        logLevel: 'info'
    }
};

/**
 * Get map type configuration
 * @param {string} mapType - Map type key
 * @returns {Object|null} Map type configuration or null if not found
 */
export function getMapTypeConfig(mapType) {
    return CONFIG.map.mapTypes[mapType] || null;
}

/**
 * Update configuration at runtime
 * @param {Object} updates - Configuration updates (nested object)
 */
export function updateConfig(updates) {
    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    
    deepMerge(CONFIG, updates);
    console.log('Configuration updated:', updates);
}

/**
 * Load configuration from localStorage
 */
export function loadConfigFromStorage() {
    try {
        const stored = localStorage.getItem('rallyTrackViewerConfig');
        if (stored) {
            const storedConfig = JSON.parse(stored);
            
            // Check version compatibility
            if (storedConfig.version !== CONFIG.version) {
                console.log(`Configuration version mismatch (stored: ${storedConfig.version || 'unknown'}, current: ${CONFIG.version}). Clearing cache.`);
                localStorage.removeItem('rallyTrackViewerConfig');
                return;
            }
            
            updateConfig(storedConfig);
            console.log('Configuration loaded from localStorage');
        }
    } catch (error) {
        console.warn('Failed to load configuration from localStorage:', error);
        // Clear corrupted config
        localStorage.removeItem('rallyTrackViewerConfig');
    }
}

/**
 * Save current configuration to localStorage
 */
export function saveConfigToStorage() {
    try {
        // Ensure version is included when saving
        const configToSave = { ...CONFIG, version: CONFIG.version };
        localStorage.setItem('rallyTrackViewerConfig', JSON.stringify(configToSave));
        console.log('Configuration saved to localStorage');
    } catch (error) {
        console.warn('Failed to save configuration to localStorage:', error);
    }
}

/**
 * Reset configuration to defaults
 */
export function resetConfig() {
    if (confirm('Reset configuration to defaults? This will reload the page.')) {
        localStorage.removeItem('rallyTrackViewerConfig');
        window.location.reload();
    }
}

/**
 * Update track styling configuration
 * @param {Object} trackStyle - Track style updates {color, weight, opacity, smoothFactor}
 */
export function updateTrackStyle(trackStyle) {
    const updates = {
        map: {
            tracks: trackStyle
        }
    };
    updateConfig(updates);
    saveConfigToStorage();
}

/**
 * Update map opacity configuration
 * @param {number} opacity - Map opacity (0-100)
 */
export function updateMapOpacity(opacity) {
    const updates = {
        map: {
            opacity: opacity
        }
    };
    updateConfig(updates);
    saveConfigToStorage();
}

/**
 * Update icon scale configuration
 * @param {number} scale - Icon scale multiplier (0.5-3.0)
 */
export function updateIconScale(scale) {
    const updates = {
        kml: {
            icons: {
                scale: scale
            }
        }
    };
    updateConfig(updates);
    saveConfigToStorage();
}

// Auto-load configuration on module import
loadConfigFromStorage();

// Export default configuration
export default CONFIG;