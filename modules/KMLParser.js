/**
 * KMLParser - Handles parsing of KML files and coordinate conversion
 * Enhanced to extract both tracks and icons/placemarks
 */
export class KMLParser {
    constructor() {
        this.tracks = [];
        this.icons = [];
    }

    /**
     * Parse KML document and extract track data and icons
     * @param {Document} kmlDoc - Parsed KML document
     * @returns {Object} Object containing tracks and icons arrays
     */
    parseKML(kmlDoc) {
        this.tracks = [];
        this.icons = [];
        
        // Parse tracks (LineString elements)
        this.parseLineStrings(kmlDoc);
        
        // Parse icons/placemarks (Point elements)
        this.parsePoints(kmlDoc);
        
        console.log(`KMLParser: Loaded ${this.tracks.length} tracks and ${this.icons.length} icons`);
        return {
            tracks: this.tracks,
            icons: this.icons
        };
    }

    /**
     * Parse LineString elements for tracks
     * @param {Document} kmlDoc - Parsed KML document
     */
    parseLineStrings(kmlDoc) {
        const lineStrings = kmlDoc.getElementsByTagName('LineString');
        
        for (let i = 0; i < lineStrings.length; i++) {
            const lineString = lineStrings[i];
            const coordinatesElement = lineString.getElementsByTagName('coordinates')[0];
            
            if (coordinatesElement && coordinatesElement.textContent.trim()) {
                const coordinatesText = coordinatesElement.textContent.trim();
                const points = this.parseCoordinates(coordinatesText);
                
                if (points.length > 0) {
                    // Get track info from parent Placemark
                    const placemark = lineString.closest('Placemark');
                    const trackInfo = this.extractPlacemarkInfo(placemark, i);
                    
                    this.tracks.push({
                        name: trackInfo.name || `Track ${i + 1}`,
                        description: trackInfo.description,
                        points: points,
                        originalIndex: i,
                        style: trackInfo.style
                    });
                }
            }
        }
    }

    /**
     * Parse Point elements for icons/placemarks
     * @param {Document} kmlDoc - Parsed KML document
     */
    parsePoints(kmlDoc) {
        const points = kmlDoc.getElementsByTagName('Point');
        
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const coordinatesElement = point.getElementsByTagName('coordinates')[0];
            
            if (coordinatesElement && coordinatesElement.textContent.trim()) {
                const coordinatesText = coordinatesElement.textContent.trim();
                const coords = this.parseCoordinates(coordinatesText);
                
                if (coords.length > 0) {
                    // Get icon info from parent Placemark
                    const placemark = point.closest('Placemark');
                    const iconInfo = this.extractPlacemarkInfo(placemark, i);
                    
                    // Extract icon style information
                    const iconStyle = this.extractIconStyle(placemark);
                    
                    this.icons.push({
                        name: iconInfo.name || `Point ${i + 1}`,
                        description: iconInfo.description,
                        position: coords[0], // First coordinate pair
                        originalIndex: i,
                        iconUrl: iconStyle.iconUrl,
                        iconSize: iconStyle.iconSize,
                        iconAnchor: iconStyle.iconAnchor,
                        style: iconInfo.style
                    });
                }
            }
        }
    }

    /**
     * Extract placemark information (name, description, style)
     * @param {Element} placemark - Placemark element
     * @param {number} index - Default index for naming
     * @returns {Object} Placemark information
     */
    extractPlacemarkInfo(placemark, index) {
        const info = {
            name: null,
            description: null,
            style: null
        };
        
        if (placemark) {
            // Extract name
            const nameElement = placemark.getElementsByTagName('name')[0];
            if (nameElement) {
                info.name = nameElement.textContent.trim();
            }
            
            // Extract description
            const descElement = placemark.getElementsByTagName('description')[0];
            if (descElement) {
                info.description = descElement.textContent.trim();
            }
            
            // Extract style reference
            const styleUrlElement = placemark.getElementsByTagName('styleUrl')[0];
            if (styleUrlElement) {
                info.style = styleUrlElement.textContent.trim();
            }
        }
        
        return info;
    }

    /**
     * Extract icon style information from placemark
     * @param {Element} placemark - Placemark element
     * @returns {Object} Icon style information
     */
    extractIconStyle(placemark) {
        const style = {
            iconUrl: null,
            iconSize: null,
            iconAnchor: null
        };
        
        if (!placemark) {
            return style;
        }
        
        // Look for inline style first
        const styleElement = placemark.getElementsByTagName('Style')[0];
        if (styleElement) {
            const iconStyle = styleElement.getElementsByTagName('IconStyle')[0];
            if (iconStyle) {
                // Extract icon URL
                const icon = iconStyle.getElementsByTagName('Icon')[0];
                if (icon) {
                    const href = icon.getElementsByTagName('href')[0];
                    if (href) {
                        style.iconUrl = href.textContent.trim();
                    }
                }
                
                // Extract scale (for icon size)
                const scale = iconStyle.getElementsByTagName('scale')[0];
                if (scale) {
                    const scaleValue = parseFloat(scale.textContent);
                    if (!isNaN(scaleValue)) {
                        const baseSize = 32; // Default icon size
                        style.iconSize = [baseSize * scaleValue, baseSize * scaleValue];
                        style.iconAnchor = [baseSize * scaleValue / 2, baseSize * scaleValue / 2];
                    }
                }
            }
        }
        
        // If no inline style, look for style reference
        if (!style.iconUrl) {
            const styleUrl = placemark.getElementsByTagName('styleUrl')[0];
            if (styleUrl) {
                const styleId = styleUrl.textContent.trim().replace('#', '');
                const referencedStyle = placemark.ownerDocument.getElementById(styleId);
                
                if (referencedStyle) {
                    const iconStyle = referencedStyle.getElementsByTagName('IconStyle')[0];
                    if (iconStyle) {
                        const icon = iconStyle.getElementsByTagName('Icon')[0];
                        if (icon) {
                            const href = icon.getElementsByTagName('href')[0];
                            if (href) {
                                style.iconUrl = href.textContent.trim();
                            }
                        }
                        
                        const scale = iconStyle.getElementsByTagName('scale')[0];
                        if (scale) {
                            const scaleValue = parseFloat(scale.textContent);
                            if (!isNaN(scaleValue)) {
                                const baseSize = 32;
                                style.iconSize = [baseSize * scaleValue, baseSize * scaleValue];
                                style.iconAnchor = [baseSize * scaleValue / 2, baseSize * scaleValue / 2];
                            }
                        }
                    }
                }
            }
        }
        
        return style;
    }

    /**
     * Parse coordinate string into lat/lng points
     * @param {string} coordinatesText - Raw coordinates from KML
     * @returns {Array} Array of [lat, lng] points
     */
    parseCoordinates(coordinatesText) {
        const points = [];
        const coords = coordinatesText.split(/\s+/);
        
        for (const coord of coords) {
            if (coord.trim()) {
                const parts = coord.split(',');
                if (parts.length >= 2) {
                    const lon = parseFloat(parts[0]);
                    const lat = parseFloat(parts[1]);
                    const alt = parts.length > 2 ? parseFloat(parts[2]) : 0; // Default altitude to 0 if not present
                    
                    // Validate that all parts of the coordinate are valid numbers
                    if (!isNaN(lon) && !isNaN(lat) && !isNaN(alt)) {
                        points.push({ lat, lon, alt });
                    }
                }
            }
        }
        
        return points;
    }

    /**
     * Load and parse KML file
     * @param {File} file - KML file object
     * @returns {Promise<Object>} Promise resolving to {tracks, icons}
     */
    async loadKMLFile(file) {
        try {
            const text = await file.text();
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(text, 'text/xml');
            
            // Check for parsing errors
            const parseError = kmlDoc.getElementsByTagName('parsererror')[0];
            if (parseError) {
                throw new Error('Invalid KML file format');
            }
            
            return this.parseKML(kmlDoc);
        } catch (error) {
            console.error('KMLParser: Error loading KML file:', error);
            throw error;
        }
    }

    /**
     * Load KML from URL
     * @param {string} url - URL to KML file
     * @returns {Promise<Object>} Promise resolving to {tracks, icons}
     */
    async loadKMLFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(text, 'text/xml');
            
            // Check for parsing errors
            const parseError = kmlDoc.getElementsByTagName('parsererror')[0];
            if (parseError) {
                throw new Error('Invalid KML file format');
            }
            
            return this.parseKML(kmlDoc);
        } catch (error) {
            console.error('KMLParser: Error loading KML from URL:', error);
            throw error;
        }
    }

    /**
     * Get all parsed tracks
     * @returns {Array} Array of track objects
     */
    getTracks() {
        return this.tracks;
    }

    /**
     * Get all parsed icons
     * @returns {Array} Array of icon objects
     */
    getIcons() {
        return this.icons;
    }

    /**
     * Get track by index
     * @param {number} index - Track index
     * @returns {Object|null} Track object or null if not found
     */
    getTrack(index) {
        return this.tracks[index] || null;
    }

    /**
     * Get icon by index
     * @param {number} index - Icon index
     * @returns {Object|null} Icon object or null if not found
     */
    getIcon(index) {
        return this.icons[index] || null;
    }

    /**
     * Get track by name
     * @param {string} name - Track name
     * @returns {Object|null} Track object or null if not found
     */
    getTrackByName(name) {
        return this.tracks.find(track => track.name === name) || null;
    }

    /**
     * Get icon by name
     * @param {string} name - Icon name
     * @returns {Object|null} Icon object or null if not found
     */
    getIconByName(name) {
        return this.icons.find(icon => icon.name === name) || null;
    }

    /**
     * Clear all parsed data
     */
    clear() {
        this.tracks = [];
        this.icons = [];
    }
}