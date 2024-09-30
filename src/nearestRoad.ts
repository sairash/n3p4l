interface Node {
    id: number;
    lat: number;
    lon: number;
}

// Define the response format from Overpass
interface OverpassResponse {
    elements: Array<{
        type: string;
        id: number;
        lat?: number;
        lon?: number;
        nodes?: number[];
    }>;
}

// Haversine distance formula to calculate the distance between two lat/lon points
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => value * Math.PI / 180;
    const R = 6371; // Earth radius in kilometers

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

// Fetch the nearest road data using the Overpass API
export async function findNearestRoad(lat: number, lon: number, meters: number = 500): Promise<Node | null> {
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];way(around:${meters},${lat},${lon})["highway"];out body;>;out skel qt;`;

    try {
        const response = await fetch(overpassUrl);
        const data: OverpassResponse = await response.json();

        // Extract nodes (coordinates) from the response
        const nodes: Record<number, Node> = {};
        data.elements.forEach((element) => {
            if (element.type === 'node' && element.lat !== undefined && element.lon !== undefined) {
                nodes[element.id] = {
                    id: element.id,
                    lat: element.lat,
                    lon: element.lon
                };
            }
        });

        // Find the closest road node to the input coordinates
        let nearestNode: Node | null = null;
        let nearestDistance = Infinity;

        Object.values(nodes).forEach((node) => {
            const distance = haversineDistance(lat, lon, node.lat, node.lon);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestNode = node;
            }
        });
        

        if (nearestNode) {
            return nearestNode
        } else {
            console.log('No road found nearby in', meters, "meters distance.");
        }
    } catch (error) {
        console.error('Error fetching Overpass data:', error);
    }

    return null
}
