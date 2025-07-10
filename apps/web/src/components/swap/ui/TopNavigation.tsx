import Image from 'next/image'

interface TopNavigationProps {
  activeTab: string
  onTabChange: (value: string) => void
}

export const TopNavigation = ({
  activeTab,
  onTabChange
}: TopNavigationProps) => {
  const menuItems = [
    { id: 'swap', label: 'Swap' },
    { id: 'bridge', label: 'Bridge' },
    { id: 'onramp', label: 'On-Ramp' }
  ]

  return (
    <div className="fixed top-4 md:top-0 left-4 z-20 flex gap-4 md:gap-6">
      {/* Logo - Hidden on mobile */}
      <div className="relative hidden md:block">
        <Image
          src="/swush-logo.png"
          alt="Swush"
          width={55}
          height={55}
          className="drop-shadow-lg opacity-90 hover:opacity-100 transition-opacity duration-300"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-flame-400/15 to-flame-500/10 rounded-full filter blur-lg -z-10"></div>
      </div>

      {/* Horizontal Menu - Responsive */}
      <nav className="flex items-center gap-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-lg transition-all duration-300
              ${activeTab === item.id
                ? 'bg-gradient-to-r from-flame-500 to-flame-400 text-white shadow-lg shadow-flame-500/25'
                : 'text-forest-300 hover:text-white hover:bg-forest-800/50'
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
} 