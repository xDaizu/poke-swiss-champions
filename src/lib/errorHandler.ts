import { storageService } from '../services/storageService';
import { useToast } from '../hooks/use-toast';

/**
 * Error handler utility for data storage operations
 */
export const errorHandler = {
  /**
   * Handle an error during data operations
   * @param error The error that occurred
   * @param operation Description of what operation was being performed
   * @returns True if recovery was attempted, false otherwise
   */
  async handleStorageError(error: unknown, operation: string): Promise<boolean> {
    console.error(`Error during ${operation}:`, error);
    
    // Try to restore from backup
    const recovered = storageService.restoreFromBackup();
    
    if (recovered) {
      console.log(`Recovered from backup after error during ${operation}`);
    } else {
      console.error(`Could not recover from backup after error during ${operation}`);
    }
    
    return recovered;
  },
  
  /**
   * React hook for handling storage errors with toast notifications
   */
  useStorageErrorHandler() {
    const { toast } = useToast();
    
    return {
      /**
       * Handle a storage error and show appropriate toast notifications
       * @param error The error that occurred
       * @param operation Description of what operation was being performed
       */
      handleError(error: unknown, operation: string) {
        console.error(`Error during ${operation}:`, error);
        
        // Try to restore from backup
        const recovered = storageService.restoreFromBackup();
        
        if (recovered) {
          toast({
            title: "Data restored from backup",
            description: `Encountered an error during ${operation}. Your data has been restored from the latest backup.`,
            variant: "default"
          });
        } else {
          toast({
            title: "Error encountered",
            description: `There was a problem during ${operation}. No backup was available for recovery.`,
            variant: "destructive"
          });
        }
        
        return recovered;
      }
    };
  }
}; 