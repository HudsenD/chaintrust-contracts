const { hre, network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

async function main() {
  //   const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  //   const unlockTime = currentTimestampInSeconds + 60;

  //   const lockedAmount = hre.ethers.utils.parseEther("0.001");

  const ErcAccount = await ethers.getContractFactory("ERC6551Account");
  const ercAccount = await ErcAccount.deploy();

  await ercAccount.deployed();

  console.log(`ERCAccount deployed to ${ercAccount.address}`);

  // if (
  //   !developmentChains.includes(network.name) &&
  //   process.env.ETHERSCAN_API_KEY
  // ) {
  //   console.log("Verifying...");
  //   await verify(ercAccount.address);
  // }
  console.log("-------------------------------------");

  const ErcRegistry = await ethers.getContractFactory("ERC6551Registry");
  const ercRegistry = await ErcRegistry.deploy();

  await ercRegistry.deployed();

  console.log(`ERCRegistry deployed to ${ercRegistry.address}`);

  // if (
  //   !developmentChains.includes(network.name) &&
  //   process.env.ETHERSCAN_API_KEY
  // ) {
  //   console.log("Verifying...");
  //   await verify(ercRegistry.address);
  // }
  console.log("-------------------------------------");

  // let args = [ercRegistry.address, ercAccount.address];
  const TrustOperator = await ethers.getContractFactory("TrustOperator");
  const trustOperator = await TrustOperator.deploy(
    ercRegistry.address,
    ercAccount.address,
    "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
    "20000000"
  );

  await trustOperator.deployed();

  console.log(`TrustOperator deployed to ${trustOperator.address}`);

  //   if (
  //     !developmentChains.includes(network.name) &&
  //     process.env.ETHERSCAN_API_KEY
  //   ) {
  //     console.log("Verifying...");
  //     await verify(trustOperator.address, args);
  //   }
  //   console.log("-------------------------------------");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
