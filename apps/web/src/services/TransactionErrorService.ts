import { InvalidTxError } from 'polkadot-api';

export interface DispatchErrorInfo {
  type: string;
  message: string;
  details?: string;
  moduleError?: string;
  moduleName?: string;
}

// Enhanced Error interface with dispatch info
export interface EnhancedError extends Error {
  dispatchInfo: DispatchErrorInfo;
  type: string;
}

export class TransactionErrorService {
  /**
   * Extracts the most relevant error information from a dispatch error
   */
  private static getErrorInfo(error: any): { type: string; message: string } {
    // Handle string errors
    if (typeof error === 'string') {
      return { type: 'Unknown', message: error };
    }

    // Handle null/undefined
    if (!error) {
      return { type: 'Unknown', message: 'Unknown error occurred' };
    }

    // Get base error type
    const errorType = error.type || 'Unknown';

    // Handle module errors
    if (error.type === 'Module' && error.value) {
      const moduleName = error.value.type || 'Unknown';
      const moduleError = error.value?.value?.type;
      
      return {
        type: moduleName,
        message: moduleError ? `${moduleName}: ${moduleError}` : moduleName
      };
    }

    // Handle common error types
    if (['BadOrigin', 'CannotLookup', 'Token', 'Arithmetic', 'TooManyConsumers'].includes(errorType)) {
      const specificError = error.value?.type || error.value;
      return {
        type: errorType,
        message: specificError ? `${errorType}: ${specificError}` : errorType
      };
    }

    // Handle other error types
    const message = error.message || error.value?.message || error.value?.type || error.value || 'Unknown error';
    return {
      type: errorType,
      message: typeof message === 'string' ? message : JSON.stringify(message)
    };
  }

  /**
   * Parses a dispatch error into a standardized format
   */
  static parseDispatchError(error: any): DispatchErrorInfo {
    try {
      const { type, message } = this.getErrorInfo(error);
      
      const dispatchInfo: DispatchErrorInfo = {
        type,
        message,
        details: JSON.stringify(error)
      };

      // Add module-specific information if available
      if (error.type === 'Module' && error.value) {
        dispatchInfo.moduleName = error.value.type;
        dispatchInfo.moduleError = error.value?.value?.type;
      }

      return dispatchInfo;
    } catch (e) {
      console.error('Error parsing dispatch error:', e);
      return {
        type: 'ParseError',
        message: 'Failed to parse error',
        details: JSON.stringify(error)
      };
    }
  }

  /**
   * Creates an enhanced error from dispatch info
   */
  static createErrorFromDispatchInfo(info: DispatchErrorInfo): EnhancedError {
    const error = new Error(info.message) as EnhancedError;
    error.dispatchInfo = info;
    error.type = info.type;
    error.name = `${info.type}Error`;
    return error;
  }

  /**
   * Main error handler that processes all types of transaction errors
   */
  static handleTransactionError(error: any): Error {
    // Return existing enhanced errors as is
    if (error?.dispatchInfo) {
      return error;
    }

    // Handle InvalidTxError
    if (error instanceof InvalidTxError) {
      const { type, message } = this.getErrorInfo(error.error);
      const enhancedError = new Error(message) as EnhancedError;
      enhancedError.dispatchInfo = {
        type: 'InvalidTransaction',
        message,
        details: JSON.stringify(error.error)
      };
      enhancedError.type = type;
      return enhancedError;
    }

    // Handle dispatch errors
    if (error?.dispatchError) {
      const dispatchInfo = this.parseDispatchError(error.dispatchError);
      return this.createErrorFromDispatchInfo(dispatchInfo);
    }

    // Handle other errors
    const { type, message } = this.getErrorInfo(error);
    const enhancedError = new Error(message) as EnhancedError;
    enhancedError.dispatchInfo = {
      type,
      message,
      details: JSON.stringify(error)
    };
    enhancedError.type = type;
    return enhancedError;
  }
} 