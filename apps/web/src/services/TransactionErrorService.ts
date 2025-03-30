import { InvalidTxError } from 'polkadot-api';

export interface SwushError extends Error {
  type: string;
  details?: string;
  moduleError?: string;
  moduleName?: string;
}

// Common base dispatch error type that all chains share
interface BaseDispatchError {
  type: string;
  value?: {
    type: string;
    value?: {
      type: string;
    };
  };
}

export class TransactionErrorService {
  /**
   * Common error message handler for all chains
   */
  private static getCommonErrorMessage(error: BaseDispatchError): string {
    if (typeof error !== 'object' || !('type' in error)) {
      return 'Unknown error';
    }

    // Handle common error types across all chains
    switch (error.type) {
      case 'Token':
      case 'Arithmetic':
      case 'Transactional':
        return 'value' in error && error.value && typeof error.value === 'object' && 'type' in error.value ? 
          `${error.type}: ${error.value.type}` : error.type;
      case 'Other':
        return 'An unexpected error occurred';
      case 'CannotLookup':
        return 'Unable to lookup the requested information';
      case 'BadOrigin':
        return 'The origin is not authorized to perform this action';
      case 'ConsumerRemaining':
        return 'There are still consumers remaining';
      case 'NoProviders':
        return 'No providers available';
      case 'TooManyConsumers':
        return 'Too many consumers';
      case 'Exhausted':
        return 'Resources exhausted';
      case 'Corruption':
        return 'State corruption detected';
      case 'Unavailable':
        return 'Resource unavailable';
      case 'RootNotAllowed':
        return 'Root operation not allowed';
      default:
        return String(error.type);
    }
  }

  /**
   * Creates a SwushError from error information
   */
  private static createSwushError(
    message: string,
    type: string = 'Unknown',
    details?: string,
    moduleError?: string,
    moduleName?: string
  ): SwushError {
    const error = new Error(message) as SwushError;
    error.type = type;
    error.name = `${type}Error`;
    if (details) error.details = details;
    if (moduleError) error.moduleError = moduleError;
    if (moduleName) error.moduleName = moduleName;
    return error;
  }

  /**
   * Parses a dispatch error into a SwushError
   */
  static parseDispatchError(error: any): SwushError {
    try {
      // If we have a valid dispatch error
      if (error && typeof error === 'object' && 'type' in error) {
        const baseError = error as BaseDispatchError;
        
        // Handle Module errors
        if (baseError.type === 'Module' && baseError.value) {
          const moduleInfo = baseError.value;
          if (typeof moduleInfo === 'object' && 'type' in moduleInfo) {
            const moduleName = String(moduleInfo.type);
            const moduleError = moduleInfo.value && typeof moduleInfo.value === 'object' && 'type' in moduleInfo.value
              ? String(moduleInfo.value.type)
              : undefined;
            
            return this.createSwushError(
              `${moduleName}: ${moduleError || 'Unknown module error'}`,
              'Module',
              JSON.stringify(error),
              moduleError,
              moduleName
            );
          }
        }
        
        // Handle common errors
        return this.createSwushError(
          this.getCommonErrorMessage(baseError),
          baseError.type,
          JSON.stringify(error)
        );
      }

      // Handle string errors
      if (typeof error === 'string') {
        return this.createSwushError(error, 'String', error);
      }

      // Handle null/undefined
      if (!error) {
        return this.createSwushError('Unknown error occurred');
      }

      // Handle other error types
      return this.createSwushError(
        error.message || 'Unknown error occurred',
        error.type || 'Unknown',
        JSON.stringify(error)
      );
    } catch (e) {
      console.error('Error parsing dispatch error:', e);
      return this.createSwushError(
        'Failed to parse error',
        'ParseError',
        JSON.stringify(error)
      );
    }
  }

  /**
   * Main error handler that processes all types of transaction errors
   */
  static handleTransactionError(error: any): SwushError {
    // Return existing SwushErrors as is
    if (error instanceof Error && 'type' in error) {
      return error as SwushError;
    }

    // Handle InvalidTxError
    if (error instanceof InvalidTxError) {
      const swushError = this.parseDispatchError(error.error);
      swushError.type = 'InvalidTransaction';
      return swushError;
    }

    // Handle dispatch errors
    if (error?.dispatchError) {
      return this.parseDispatchError(error.dispatchError);
    }

    // Handle other errors
    return this.parseDispatchError(error);
  }
} 