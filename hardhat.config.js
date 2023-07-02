require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const FANTOM_RPC_URL = process.env.FANTOM_MAINNET;
const FANTOM_TESTNET_RPC_URL = process.env.FANTOM_TESTNET;

// if (process.argv[3] != undefined) {
//   scriptName = process.argv[3];
// } else {

const BLOCK_HEIGHT = 17372700;

// if (
//   scriptName.includes("reentrancy-3") ||
//   scriptName.includes("reentrancy-4") ||
//   scriptName.includes("erc20-2")
// ) {
//console.log(`Forking Mainnet Block Height ${BLOCK_HEIGHT}`);
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET,
        blockNumber: BLOCK_HEIGHT,
      },
    },
    rinkeby: {
      url: RINKEBY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 4,
      blockConfirmations: 6,
      saveDeployments: true,
    },
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
      blockConfirmations: 6,
      saveDeployments: true,
    },
    fantom: {
      url: FANTOM_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 250,
      blockConfirmations: 6,
      saveDeployments: true,
    },
    ftmTestnet: {
      url: FANTOM_TESTNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 4002,
      blockConfirmations: 6,
      saveDeployments: true,
    },
    localhost: {
      chainId: 31337,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
      },
      {
        version: "0.5.12",
      },
      {
        version: "0.8.4",
      },
      {
        version: "0.8.13",
      },
      {
        version: "0.7.0",
      },
      {
        version: "0.6.0",
      },
      {
        version: "0.4.24",
      },
    ],
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      rinkeby: ETHERSCAN_API_KEY,
      ftmTestnet: "https://api-testnet.ftmscan.com/",
      //fantom: "https://api.ftmscan.com/",
    },
  },
};
// // } else {
// module.exports = {
//   networks: {
//     hardhat: {
//       //loggingEnabled: true,
//     },
//   },
//   solidity: {
//     compilers: [
//       {
//         version: "0.6.12",
//       },
//       {
//         version: "0.5.12",
//       },
//       {
//         version: "0.8.4",
//       },
//       {
//         version: "0.8.13",
//       },
//       {
//         version: "0.7.0",
//       },
//       {
//         version: "0.6.0",
//       },
//       {
//         version: "0.4.24",
//       },
//     ],
//   },
// };
