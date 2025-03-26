export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const mockBlockchainTransaction = async (): Promise<boolean> => {
  const success = Math.random() > 0.1;
  return success;
};

export const calculateOutputAmount = (inputAmount: string): string => {
  const inputValue = parseFloat(inputAmount);
  return isNaN(inputValue) ? '0' : (inputValue * 2).toFixed(4);
};

export const calculateMinimumReceived = (outputAmount: string): string => {
  return (parseFloat(outputAmount) * 0.995).toFixed(4);
}; 


// Helper function to format balance display
export function formatBalance(balance: string | undefined, isLoading: boolean | undefined): string {
  if (isLoading === true) return '...';
  if (!balance || balance === '0') return '0';
  
  const numBalance = parseFloat(balance);
  if (numBalance < 0.0001 && numBalance > 0) return '< 0.0001';
  
  // For numbers less than 1, show more decimals
  if (numBalance < 1) {
    return numBalance.toFixed(4);
  }
  
  // For larger numbers, show fewer decimals
  if (numBalance > 1000000) {
    return `${(numBalance / 1000000).toFixed(2)}M`;
  }
  if (numBalance > 1000) {
    return `${(numBalance / 1000).toFixed(2)}K`;
  }
  
  return numBalance.toFixed(2);
}