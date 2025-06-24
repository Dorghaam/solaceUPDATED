import NetInfo from '@react-native-community/netinfo';

class NetworkService {
  private isConnected: boolean = true;
  private listeners: ((isConnected: boolean) => void)[] = [];

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;
      
      // Only notify listeners if connection status changed
      if (wasConnected !== this.isConnected) {
        console.log(`[NetworkService] Connection changed: ${this.isConnected ? 'Online' : 'Offline'}`);
        this.notifyListeners();
      }
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.isConnected);
      } catch (error) {
        console.error('[NetworkService] Error notifying listener:', error);
      }
    });
  }

  /**
   * Get current connection status
   */
  isOnline(): boolean {
    return this.isConnected;
  }

  /**
   * Get current connection status (async for initial check)
   */
  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? false;
    return this.isConnected;
  }

  /**
   * Subscribe to connection changes
   */
  onConnectionChange(callback: (isConnected: boolean) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

export const networkService = new NetworkService(); 