# Templar Money Contracts

™️ Finest interest-bearing stablecoin that automatically earns APY yields just by holding it in your wallet

##  ⚙️ Local Development

Local Setup Steps:
1. git clone https://github.com/Crown-Labs/templar-money-contracts.git
1. Install dependencies: `yarn install` 
1. Compile Solidity: `yarn compile`

## 🟡 BSC Mainnet Contracts

|Contract       | Addresss                                                                                                            | Notes   |
|:-------------:|:-------------------------------------------------------------------------------------------------------------------:|-------|
|TM            |[0x194d1D62d8d798Fcc81A6435e6d13adF8bcC2966](https://bscscan.com/address/0x194d1D62d8d798Fcc81A6435e6d13adF8bcC2966)| Templay Money Token Contract|
|Treasury           |[0x49F368dF114f85b458966119f699487F8Ae248dD](https://bscscan.com/address/0x49F368dF114f85b458966119f699487F8Ae248dD)| Treasury Contract is responsible for managing the minting and redemption of TM|
|ReserveFund       |[0xEbe9da74D7d5dc5203776264E7610aE76D7c9f93](https://bscscan.com/address/0xEbe9da74D7d5dc5203776264E7610aE76D7c9f93)| Contract to store a partial reserve, allowing users to redeem their funds |
|ManagerFund |[0x8049fFeaBD65d043895de3c70634F328B294B6fA](https://bscscan.com/address/0x8049fFeaBD65d043895de3c70634F328B294B6fA)| Handle the rebalancing between the Reserve Fund and Vault
|TemplarRouter  |[0x12266820147fCca397F3607a814df6982557dB5e](https://bscscan.com/address/0x12266820147fCca397F3607a814df6982557dB5e)| Enable routing for seamless swapping between stablecoin assets to facilitate the process of minting and redeeming TM |