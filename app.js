/**
 * Rally Track Viewer - Simplified Application
 * Shows OSM map with KML tracks and icons
 */

import { KMLParser } from './modules/KMLParser.js';
import { MapManager } from './modules/MapManager.js';
import { CONFIG, updateTrackStyle, updateMapOpacity, updateIconScale } from './config.js';

class RallyTrackViewer {
    constructor() {
        // Initialize modules
        this.kmlParser = new KMLParser();
        this.mapManager = new MapManager('map');
        
        // Application state
        this.tracks = [];
        this.icons = [];
        this.isInitialized = false;
        
        // UI elements
        this.elements = {};
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize map
            this.mapManager.init({
                center: [47.69, 17.63],
                zoom: 13
            });
            
            // Initialize UI
            this.initializeUI();
            this.setupEventListeners();
            this.initializeUIValues();
            
            // Auto-load default KML file if it exists
            await this.autoLoadKML();
            
            this.isInitialized = true;
            console.log('RallyTrackViewer: Application initialized successfully');
            
        } catch (error) {
            console.error('RallyTrackViewer: Initialization error:', error);
        }
    }

    /**
     * Initialize UI element references
     */
    initializeUI() {
        this.elements = {
            toggleMenu: document.getElementById('toggleMenu'),
            optionsMenu: document.getElementById('optionsMenu'),
            kmlFile: document.getElementById('kmlFile'),
            mapType: document.getElementById('mapType'),
            transparentBg: document.getElementById('transparentBg'),
            showTracks: document.getElementById('showTracks'),
            showIcons: document.getElementById('showIcons'),
            trackColor: document.getElementById('trackColor'),
            trackWidth: document.getElementById('trackWidth'),
            trackWidthValue: document.getElementById('trackWidthValue'),
            trackOpacity: document.getElementById('trackOpacity'),
            trackOpacityValue: document.getElementById('trackOpacityValue'),
            mapOpacity: document.getElementById('mapOpacity'),
            mapOpacityValue: document.getElementById('mapOpacityValue'),
            iconSize: document.getElementById('iconSize'),
            iconSizeValue: document.getElementById('iconSizeValue'),
            clearCache: document.getElementById('clearCache'),
            trackCount: document.getElementById('trackCount'),
            iconCount: document.getElementById('iconCount'),
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle menu
        if (this.elements.toggleMenu) {
            this.elements.toggleMenu.addEventListener('click', () => {
                this.toggleOptionsMenu();
            });
        }

        // KML file input
        if (this.elements.kmlFile) {
            this.elements.kmlFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.loadKMLFile(file);
                }
            });
        }

        // Map type selector
        if (this.elements.mapType) {
            this.elements.mapType.addEventListener('change', (e) => {
                this.changeMapType(e.target.value);
            });
        }

        // Transparent background toggle
        if (this.elements.transparentBg) {
            this.elements.transparentBg.addEventListener('change', (e) => {
                this.toggleTransparentBackground(e.target.checked);
            });
        }

        // Show tracks toggle
        if (this.elements.showTracks) {
            this.elements.showTracks.addEventListener('change', (e) => {
                this.toggleTracks(e.target.checked);
            });
        }

        // Show icons toggle
        if (this.elements.showIcons) {
            this.elements.showIcons.addEventListener('change', (e) => {
                this.toggleIcons(e.target.checked);
            });
        }

        // Track color picker
        if (this.elements.trackColor) {
            this.elements.trackColor.addEventListener('change', (e) => {
                this.updateTrackColor(e.target.value);
            });
        }

        // Track width slider
        if (this.elements.trackWidth) {
            this.elements.trackWidth.addEventListener('input', (e) => {
                const width = parseInt(e.target.value);
                this.updateTrackWidth(width);
                if (this.elements.trackWidthValue) {
                    this.elements.trackWidthValue.textContent = width;
                }
            });
        }

        // Track opacity slider
        if (this.elements.trackOpacity) {
            this.elements.trackOpacity.addEventListener('input', (e) => {
                const opacity = parseInt(e.target.value);
                this.updateTrackOpacity(opacity);
                if (this.elements.trackOpacityValue) {
                    this.elements.trackOpacityValue.textContent = opacity + '%';
                }
            });
        }

        // Map opacity slider
        if (this.elements.mapOpacity) {
            this.elements.mapOpacity.addEventListener('input', (e) => {
                const opacity = parseInt(e.target.value);
                this.updateMapOpacity(opacity);
                if (this.elements.mapOpacityValue) {
                    this.elements.mapOpacityValue.textContent = opacity + '%';
                }
            });
        }

        // Icon size slider
        if (this.elements.iconSize) {
            this.elements.iconSize.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                this.updateIconSize(scale);
                if (this.elements.iconSizeValue) {
                    this.elements.iconSizeValue.textContent = scale + 'x';
                }
            });
        }

        // Clear cache button
        if (this.elements.clearCache) {
            this.elements.clearCache.addEventListener('click', () => {
                localStorage.removeItem('rallyTrackViewerConfig');
                window.location.reload();
            });
        }

    }

    /**
     * Auto-load default KML file
     */
    async autoLoadKML() {
        try {
            const kmlFile = CONFIG.kml.defaultFile;
            const { tracks, icons } = await this.kmlParser.loadKMLFromURL(kmlFile);
            this.handleKMLLoaded(tracks, icons);
            console.log(`RallyTrackViewer: Auto-loaded KML file: ${kmlFile}`);
        } catch (error) {
            console.log('RallyTrackViewer: Auto-load failed, use file input to load KML');
        }
    }

    /**
     * Load KML file from user input
     * @param {File} file - KML file
     */
    async loadKMLFile(file) {
        try {
            const { tracks, icons } = await this.kmlParser.loadKMLFile(file);
            this.handleKMLLoaded(tracks, icons);
            console.log('RallyTrackViewer: KML file loaded successfully');
        } catch (error) {
            console.error('RallyTrackViewer: Error loading KML file:', error);
            this.showMessage('Error loading KML file: ' + error.message, 'error');
        }
    }

    /**
     * Handle loaded KML data
     * @param {Array} tracks - Array of track objects
     * @param {Array} icons - Array of icon objects
     */
    handleKMLLoaded(tracks, icons) {
        this.tracks = tracks || [];
        this.icons = icons || [];
        
        // Update map visualization
        this.mapManager.displayTracks(this.tracks);
        this.mapManager.displayIcons(this.icons);
        this.mapManager.fitToContent(this.tracks, this.icons);
        
        // Update UI
        this.updateCounts();
        
        console.log(`RallyTrackViewer: Loaded ${this.tracks.length} tracks and ${this.icons.length} icons`);
    }

    /**
     * Toggle options menu visibility
     */
    toggleOptionsMenu() {
        if (this.elements.optionsMenu) {
            this.elements.optionsMenu.classList.toggle('hidden');
        }
    }

    /**
     * Change map type
     * @param {string} type - Map type ('osm', 'satellite', 'terrain', '3d', 'none')
     */
    changeMapType(type) {
        this.mapManager.setMapType(type);
        
        // Update transparent background checkbox if map type is 'none'
        if (type === 'none' && this.elements.transparentBg) {
            this.elements.transparentBg.checked = true;
            this.toggleTransparentBackground(true);
        }
    }

    /**
     * Toggle transparent background
     * @param {boolean} enabled - Whether to enable transparent background
     */
    toggleTransparentBackground(enabled) {
        const body = document.body;
        const html = document.documentElement;
        
        if (enabled) {
            body.classList.add('transparent-mode');
            html.classList.add('transparent-mode');
            body.style.background = 'transparent';
            html.style.background = 'transparent';
        } else {
            body.classList.remove('transparent-mode');
            html.classList.remove('transparent-mode');
            body.style.background = '';
            html.style.background = '';
        }
    }


    /**
     * Initialize UI values from configuration
     */
    initializeUIValues() {
        // Set track color from config
        if (this.elements.trackColor) {
            this.elements.trackColor.value = CONFIG.map.tracks.color;
        }
        
        // Set track width from config
        if (this.elements.trackWidth) {
            this.elements.trackWidth.value = CONFIG.map.tracks.weight;
        }
        
        // Update track width display
        if (this.elements.trackWidthValue) {
            this.elements.trackWidthValue.textContent = CONFIG.map.tracks.weight;
        }
        
        // Set track opacity from config
        if (this.elements.trackOpacity) {
            this.elements.trackOpacity.value = CONFIG.map.tracks.opacity;
        }
        
        // Update track opacity display
        if (this.elements.trackOpacityValue) {
            this.elements.trackOpacityValue.textContent = CONFIG.map.tracks.opacity + '%';
        }
        
        // Set map opacity from config
        if (this.elements.mapOpacity) {
            this.elements.mapOpacity.value = CONFIG.map.opacity;
        }
        
        // Update map opacity display
        if (this.elements.mapOpacityValue) {
            this.elements.mapOpacityValue.textContent = CONFIG.map.opacity + '%';
        }
        
        // Set icon size from config
        if (this.elements.iconSize) {
            this.elements.iconSize.value = CONFIG.kml.icons.scale;
        }
        
        // Update icon size display
        if (this.elements.iconSizeValue) {
            this.elements.iconSizeValue.textContent = CONFIG.kml.icons.scale + 'x';
        }
    }

    /**
     * Update track color
     * @param {string} color - New track color (hex format)
     */
    updateTrackColor(color) {
        updateTrackStyle({ color: color });
        this.refreshTracks();
        console.log(`Track color updated to: ${color}`);
    }

    /**
     * Update track width
     * @param {number} width - New track width
     */
    updateTrackWidth(width) {
        updateTrackStyle({ weight: width });
        this.refreshTracks();
        console.log(`Track width updated to: ${width}`);
    }

    /**
     * Update track opacity
     * @param {number} opacity - New track opacity (0-100)
     */
    updateTrackOpacity(opacity) {
        updateTrackStyle({ opacity: opacity });
        this.refreshTracks();
        console.log(`Track opacity updated to: ${opacity}%`);
    }

    /**
     * Update map opacity
     * @param {number} opacity - New map opacity (0-100)
     */
    updateMapOpacity(opacity) {
        updateMapOpacity(opacity);
        this.mapManager.setMapOpacity(opacity);
        console.log(`Map opacity updated to: ${opacity}%`);
    }

    /**
     * Update icon size
     * @param {number} scale - New icon scale (0.5-3.0)
     */
    updateIconSize(scale) {
        updateIconScale(scale);
        this.refreshIcons();
        console.log(`Icon size updated to: ${scale}x`);
    }

    /**
     * Refresh track display with current styling
     */
    refreshTracks() {
        if (this.tracks.length > 0) {
            this.mapManager.displayTracks(this.tracks);
        }
    }

    /**
     * Refresh icon display with current styling
     */
    refreshIcons() {
        if (this.icons.length > 0) {
            this.mapManager.displayIcons(this.icons);
        }
    }

    /**
     * Update track and icon counts in UI
     */
    updateCounts() {
        if (this.elements.trackCount) {
            this.elements.trackCount.textContent = this.tracks.length;
        }
        if (this.elements.iconCount) {
            this.elements.iconCount.textContent = this.icons.length;
        }
    }

    /**
     * Show a temporary message to the user
     * @param {string} message - Message text
     * @param {string} type - Message type ('success', 'error', 'info')
     * @param {number} duration - Display duration in milliseconds
     */
    showMessage(message, type = 'info', duration = 3000) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2000;
            padding: 10px 15px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        // Auto-remove after duration
        setTimeout(() => {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, duration);
    }

    /**
     * Toggle track visibility (works for both 2D and 3D)
     * @param {boolean} visible - Whether tracks should be visible
     */
    toggleTracks(visible) {
        this.mapManager.setTracksVisible(visible);
    }

    /**
     * Toggle icon visibility (works for both 2D and 3D)
     * @param {boolean} visible - Whether icons should be visible
     */
    toggleIcons(visible) {
        this.mapManager.setIconsVisible(visible);
    }

    /**
     * Get current application state
     * @returns {Object} Current application state
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            tracksLoaded: this.tracks.length,
            iconsLoaded: this.icons.length,
            mapType: this.elements.mapType?.value || 'osm',
            transparentBackground: this.elements.transparentBg?.checked || false,
            showTracks: this.elements.showTracks?.checked || true,
            showIcons: this.elements.showIcons?.checked || true,
        };
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.rallyApp = new RallyTrackViewer();
});

// Export for external use
export default RallyTrackViewer;