import { IUser } from '../models/user';
import { UserService } from './user.service';

/**
 * UserCacheService provides efficient in-memory caching of user data
 * to avoid repeated database calls during face matching operations.
 */
export class UserCacheService {
    private static instance: UserCacheService;
    private userCache: Map<string, IUser> = new Map();
    private campusCache: Map<string, string> = new Map(); // campusId -> campusName mapping
    private isInitialized: boolean = false;
    private userService: UserService;

    private constructor() {
        this.userService = new UserService();
    }

    /**
     * Get singleton instance of UserCacheService
     */
    public static getInstance(): UserCacheService {
        if (!UserCacheService.instance) {
            UserCacheService.instance = new UserCacheService();
        }
        return UserCacheService.instance;
    }

    /**
     * Initialize the user cache by fetching all users from the API
     * This should be called at application startup
     */
    public async initializeCache(): Promise<void> {
        if (this.isInitialized) {
            console.log('User cache already initialized');
            return;
        }

        console.log('Initializing user cache...');
        try {
            let page = 1;
            let hasMoreUsers = true;
            let totalUsers = 0;

            while (hasMoreUsers) {
                try {
                    const users = await this.fetchUsersPage(page, 100);
                    
                    if (users.length === 0) {
                        hasMoreUsers = false;
                        break;
                    }

                    // Add users to cache
                    for (const user of users) {
                        this.userCache.set(user._id.toString(), user);
                        
                        // Cache campus information if available
                        if (user.campusId && user.campusName) {
                            this.campusCache.set(user.campusId, user.campusName);
                        }
                    }

                    totalUsers += users.length;
                    console.log(`Cached ${users.length} users from page ${page}. Total: ${totalUsers}`);
                    page++;

                    // If we got less than the page size, we've reached the end
                    if (users.length < 100) {
                        hasMoreUsers = false;
                    }
                } catch (error) {
                    console.error(`Error fetching users page ${page}:`, error);
                    // Continue to next page or stop if this is a persistent error
                    if (page === 1) {
                        throw error; // If first page fails, throw error
                    }
                    hasMoreUsers = false;
                }
            }

            this.isInitialized = true;
            console.log(`User cache initialized successfully with ${totalUsers} users and ${this.campusCache.size} campuses`);
        } catch (error) {
            console.error('Failed to initialize user cache:', error);
            throw error;
        }
    }

    /**
     * Fetch a page of users from the API
     */
    private async fetchUsersPage(page: number, pageSize: number): Promise<IUser[]> {
        // Use the existing getUsers method but make it public or create a new method
        return await (this.userService as any).getUsers(page, pageSize);
    }

    /**
     * Get user by ID from cache
     */
    public getUserById(userId: string): IUser | undefined {
        return this.userCache.get(userId);
    }

    /**
     * Get campus name by campus ID
     */
    public getCampusNameById(campusId: string): string | undefined {
        return this.campusCache.get(campusId);
    }

    /**
     * Get user's campus information by user ID
     */
    public getUserCampusInfo(userId: string): { campusId?: string; campusName?: string } {
        const user = this.getUserById(userId);
        if (user) {
            return {
                campusId: user.campusId,
                campusName: user.campusName
            };
        }
        return {};
    }

    /**
     * Add or update a user in the cache
     */
    public updateUserInCache(user: IUser): void {
        this.userCache.set(user._id.toString(), user);
        
        // Update campus cache if campus info is available
        if (user.campusId && user.campusName) {
            this.campusCache.set(user.campusId, user.campusName);
        }
    }

    /**
     * Remove a user from the cache
     */
    public removeUserFromCache(userId: string): void {
        this.userCache.delete(userId);
    }

    /**
     * Clear the entire cache
     */
    public clearCache(): void {
        this.userCache.clear();
        this.campusCache.clear();
        this.isInitialized = false;
        console.log('User cache cleared');
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { userCount: number; campusCount: number; isInitialized: boolean } {
        return {
            userCount: this.userCache.size,
            campusCount: this.campusCache.size,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Refresh the cache by clearing and reinitializing
     */
    public async refreshCache(): Promise<void> {
        console.log('Refreshing user cache...');
        this.clearCache();
        await this.initializeCache();
    }
}