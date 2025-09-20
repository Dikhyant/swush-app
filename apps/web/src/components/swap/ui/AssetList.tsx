import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { TokenButton } from '../button/TokenButton';
import { AssetListProps, TokenInfo } from '../types';
import Image from 'next/image';

export const AssetList = ({ assets, onSelect, currentAsset, onClose }: AssetListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredAssets = assets.filter((asset: TokenInfo) => 
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (asset: any) => {
    onSelect(asset);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-davyGray w-8 h-8" />
        <Input
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 bg-woodsmoke text-white text-opacity-30 border-0 h-[54px]"
        />
      </div>
      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
        {filteredAssets?.length > 0 ? filteredAssets.map((token) => (
          <TokenButton
            key={token.name}
            symbol={token.symbol}
            token={token.name}
            icon={
              <div className={`w-full h-full ${
                token.name === currentAsset.name ? 'bg-blue-500' : 'bg-slate-600'
              } rounded-full flex items-center justify-center`}>
                <span className="text-white text-lg font-bold">{token.icon}</span>
              </div>
            }
            onClick={() => handleSelect(token)}
          />
        )) : (
          <div className="flex flex-col items-center mt-10" >
            <Image src="/images/nothing-found.png" alt="nothing-found" width={160} height={160} />
            <p className="text-white text-base font-medium mt-6 mb-1" >Token not found</p>
            <p className="text-greyBlue text-sm" >Try changing your search query</p>
          </div>
        )}
      </div>
    </div>
  );
}; 