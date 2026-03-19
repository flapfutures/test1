export const BSC_CHAIN_ID = 56;
export const BSC_RPC = "https://bsc-dataseed1.binance.org";
export const BSC_RPCS = [
  BSC_RPC,
  "https://bsc-dataseed2.binance.org",
  "https://bsc-dataseed3.binance.org",
  "https://bsc-dataseed4.binance.org",
];

export const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export const FFX_CONTRACTS = {
  INSURANCE:   "",
  ORACLE:      "",
  VAULT:       "",
  FUNDING:     "",
  LIQUIDATION: "",
  PERPS:       "",
} as const;

export const FLAP_PANCAKE_POOL = "";

export const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

export const VAULT_ABI = [
  "function traderDeposit(uint256 amount) external",
  "function traderWithdraw(uint256 amount) external",
  "function traderBalances(address trader) external view returns (uint256)",
  "function hasOpenPosition(address trader) external view returns (bool)",
  "function getAvailableLiquidity() external view returns (uint256)",
  "function getVaultStats() external view returns (uint256 liquidity, uint256 vaultLocked, uint256 available, uint256 fees, uint256 pnlPaid, uint256 pnlReceived, uint256 actualBalance)",
  "function totalLiquidity() external view returns (uint256)",
  "function lockedCollateral() external view returns (uint256)",
  "function paused() external view returns (bool)",
];

export const PERPS_ABI = [
  "function openPosition(bool isLong, uint256 collateral, uint256 leverage, uint256 tp, uint256 sl) external",
  "function closePosition() external",
  "function updateTpSl(uint256 tp, uint256 sl) external",
  "function positions(address trader) external view returns (bool isOpen, bool isLong, uint256 collateral, uint256 size, uint256 entryPrice, uint256 liquidationPrice, int256 entryFundingRate, uint256 openTime, uint256 takeProfitPrice, uint256 stopLossPrice)",
  "function getPosition(address trader) external view returns (bool isOpen, bool isLong, uint256 collateral, uint256 size, uint256 entryPrice, uint256 liquidationPrice, int256 entryFundingRate)",
  "function getUnrealizedPnL(address trader) external view returns (int256)",
  "function getStats() external view returns (uint256 totalLongOI, uint256 totalShortOI, uint256 activePositions, uint256 totalFees)",
  "function checkTpSl(address trader) external view returns (bool shouldTrigger, bool isTakeProfit)",
  "function maxLeverage() external view returns (uint256)",
  "function maxPositionSize() external view returns (uint256)",
  "function maxTotalOI() external view returns (uint256)",
  "function tradingFeeBps() external view returns (uint256)",
  "function liquidationThresholdBps() external view returns (uint256)",
  "function paused() external view returns (bool)",
  "function totalLongOI() external view returns (uint256)",
  "function totalShortOI() external view returns (uint256)",
  "function activePositions() external view returns (uint256)",
  "function getOpenTraders() external view returns (address[])",
];

export const ORACLE_ABI = [
  "function getMarkPrice() external view returns (uint256)",
  "function twapPrice() external view returns (uint256)",
  "function lastUpdateTime() external view returns (uint256)",
  "function pushPrice(uint256 _price) external",
  "function ownerSetPrice(uint256 _price) external",
  "function maxPriceDeviation() external view returns (uint256)",
];

export const FUNDING_ABI = [
  "function getCurrentFundingRate() external view returns (int256)",
  "function getCumulativeFundingRate() external view returns (int256)",
  "function isFundingDue() external view returns (bool)",
  "function lastFundingTime() external view returns (uint256)",
  "function fundingInterval() external view returns (uint256)",
  "function updateFunding(uint256 totalLongOI, uint256 totalShortOI) external",
];

export const LIQUIDATION_ABI = [
  "function scanAll() external",
  "function scanAndLiquidate() external",
  "function scanAndTriggerTpSl() external",
  "function checkLiquidation(address trader) external view returns (bool)",
  "function liquidate(address trader) external",
];
