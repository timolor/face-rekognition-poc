import axios from 'axios';

const COZA_API_BASE_URL = process.env.COZA_API_BASE_URL || "http://localhost:7003/api/v1/"

interface ICampus {
    _id: string;
    name: string;
    location?: string;
    // Add other campus fields as needed
}

/**
 * CampusService handles fetching campus information from the API
 */
export class CampusService {
    private static instance: CampusService;
    private campusCache: Map<string, ICampus> = new Map();
    private isInitialized: boolean = false;

    private constructor() {}

    /**
     * Get singleton instance of CampusService
     */
    public static getInstance(): CampusService {
        if (!CampusService.instance) {
            CampusService.instance = new CampusService();
        }
        return CampusService.instance;
    }

    /**
     * Initialize campus cache by fetching all campuses from the API
     */
    public async initializeCampusCache(): Promise<void> {
        if (this.isInitialized) {
            console.log('Campus cache already initialized');
            return;
        }

        console.log('Initializing campus cache...');
        try {
            const response = await axios.get(`${COZA_API_BASE_URL}campuses`, {
                headers: {
                    'accept': '*/*'
                }
            });

            const campuses: ICampus[] = response.data.data;
            console.log(campuses)
            for (const campus of campuses) {
                this.campusCache.set(campus._id, campus);
            }

            this.isInitialized = true;
            console.log(`Campus cache initialized successfully with ${campuses.length} campuses`);
        } catch (error) {
            console.error('Failed to initialize campus cache:', error);
            throw error;
        }
    }

    /**
     * Get campus by ID
     */
    public getCampusById(campusId: string): ICampus | undefined {
        return this.campusCache.get(campusId);
    }

    /**
     * Get campus name by ID
     */
    public getCampusNameById(campusId: string): string | undefined {
        const campus = this.getCampusById(campusId);
        return campus?.name;
    }

    /**
     * Get all campuses
     */
    public getAllCampuses(): ICampus[] {
        return Array.from(this.campusCache.values());
    }

    /**
     * Clear campus cache
     */
    public clearCache(): void {
        this.campusCache.clear();
        this.isInitialized = false;
        console.log('Campus cache cleared');
    }

    /**
     * Refresh campus cache
     */
    public async refreshCache(): Promise<void> {
        console.log('Refreshing campus cache...');
        this.clearCache();
        await this.initializeCampusCache();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { campusCount: number; isInitialized: boolean } {
        return {
            campusCount: this.campusCache.size,
            isInitialized: this.isInitialized
        };
    }
}

export { ICampus };