export type StepStatus = 'waiting' | 'pending' | 'loading' | 'completed' | 'failed';

export interface SigningStep {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
  needsSignature: boolean;
}

export interface SwapHistoryItem {
  id: number;
  type: 'success' | 'error';
  message: string;
  timestamp: Date;
}

export interface TokenInfo {
  name: string;
  icon: string;
  price: string;
}

export interface DetailedRouteInfo {
  route: {
    path: string;
    details: string;
  };
}

export interface AssetListProps {
  assets: any[];
  onSelect: (asset: any) => void;
  currentAsset: any;
  onClose: () => void;
}

export interface TokenButtonProps {
  token: string;
  icon: React.ReactNode;
  onClick: () => void;
  price: string;
}

export interface WalletMenuProps {
  address: string;
  onDisconnect: () => void;
  className?: string;
}

export interface WalletButtonProps {
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  setWalletAddress: (value: string) => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
} 