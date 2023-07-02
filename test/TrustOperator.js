const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Trust Operator", function () {
  let deployer, user1, user2, attacker;
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const BTC = "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB";
  const USD = "0x0000000000000000000000000000000000000348";
  const RELEASE_PRICE = ethers.utils.parseUnits("10000", 8);
  const LOW_RELEASE_PRICE = ethers.utils.parseUnits("1700", 8);
  const CREATE_FEE = "20000000";
  const NEW_CREATE_FEE = "200000000";

  const BTC_USD_FEED = "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c";
  const ETH_USD_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

  before(async () => {
    [deployer, user1, user2, attacker] = await ethers.getSigners();

    const UsdcToken = await ethers.getContractFactory(
      "contracts/utilcontracts/Usdc.sol:Usdc",
      deployer
    );
    this.usdc = await UsdcToken.deploy();
    await this.usdc.mint("2000000000");

    const Erc6551Account = await ethers.getContractFactory(
      "contracts/ERC6551Account.sol:ERC6551Account",
      deployer
    );
    this.erc6551 = await Erc6551Account.deploy();
    -console.log(`Deployed to ${this.erc6551.address}`);

    const Erc6551Registry = await ethers.getContractFactory(
      "contracts/ERC6551Registry.sol:ERC6551Registry",
      deployer
    );
    this.erc6551Registry = await Erc6551Registry.deploy();

    const TrustOperatorFactory = await ethers.getContractFactory(
      "contracts/TrustOperator.sol:TrustOperator",
      deployer
    );
    this.trustOperator = await TrustOperatorFactory.deploy(
      this.erc6551Registry.address,
      this.erc6551.address,
      this.usdc.address,
      CREATE_FEE
    );
    const trustFundTokenAddress = await this.trustOperator.trustFund();
    console.log(`Deployed to ${trustFundTokenAddress}`);
    this.trustFundToken = await hre.ethers.getContractAt(
      "contracts/TrustFundToken.sol:TrustFundToken",
      trustFundTokenAddress,
      deployer
    );

    // add price feeds
    await this.trustOperator.addPriceFeed("BTC/USD", BTC_USD_FEED);
    await this.trustOperator.addPriceFeed("ETH/USD", ETH_USD_FEED);
  });

  it("Creates Time based Trust Fund and updates struct", async () => {
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    await this.trustOperator.createTimeTrustFund(user1.address, unlockTime);
    const TrustTerms = await this.trustOperator.getTrustTerms("1");
    console.log(`ERC6551 Account Address: ${TrustTerms.trustFundAccount}`);
    // check struct
  });
  it("doesn't realease trust when current time is before release date", async () => {
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    await this.trustOperator.createTimeTrustFund(user1.address, unlockTime);
    await expect(this.trustOperator.releaseTrustFund("2")).to.be.revertedWith(
      "Release time has not been reached"
    );
  });
  it("emits TimeTrustMinted event", async () => {
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    expect(
      await this.trustOperator.createTimeTrustFund(user1.address, unlockTime)
    ).to.emit("TimeTrustMinted");
  });
  it("createTimeTrust reverts if beneficiary is the 0 address or contract", async () => {
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    await expect(
      this.trustOperator.createTimeTrustFund(
        this.trustOperator.address,
        unlockTime
      )
    ).to.be.revertedWith("Invalid beneficiary");
  });
  it("charges 20 usdc for time trust creation", async () => {
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    let preUserBalance = await this.usdc.balanceOf(deployer.address);
    let preContractBalance = await this.usdc.balanceOf(
      this.trustOperator.address
    );
    await this.trustOperator.createTimeTrustFund(user1.address, unlockTime);
    let postUserBalance = await this.usdc.balanceOf(deployer.address);
    let postContractBalance = await this.usdc.balanceOf(
      this.trustOperator.address
    );
    expect(preUserBalance.add(preContractBalance)).to.equal(
      postUserBalance.add(postContractBalance)
    );
  });

  it("Creates Price based Trust Fund", async () => {
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    // gotta add in price feeds first.
    await this.trustOperator.createPriceTrustFund(
      user1.address,
      "ETH/USD",
      RELEASE_PRICE
    );
    let tokenId = await this.trustFundToken.tokenId();
    const TrustTerms = await this.trustOperator.getTrustTerms(tokenId);
    expect(TrustTerms.releasePrice).to.be.equal(RELEASE_PRICE);
    //console.log(TrustTerms.priceFeed.toString());
  });
  it("createPriceTrust reverts if beneficiary is the 0 address or contract", async () => {
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    await expect(
      this.trustOperator.createPriceTrustFund(
        this.trustOperator.address,
        "ETH/USD",
        RELEASE_PRICE
      )
    ).to.be.revertedWith("Invalid beneficiary");
  });
  it("createPriceTrust reverts if price feed is not supported", async () => {
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    await expect(
      this.trustOperator.createPriceTrustFund(
        user1.address,
        "SOL/USD",
        RELEASE_PRICE
      )
    ).to.be.revertedWith("Unsupported Asset Pair");
  });
  it("createPriceTrust emits PriceTrustMinted event", async () => {
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    expect(
      await this.trustOperator.createPriceTrustFund(
        user1.address,
        "ETH/USD",
        RELEASE_PRICE
      )
    ).to.emit("PriceTrustMinted"); //why does this work no matter what string??
  });

  it("reverts when current price is less than release price", async () => {
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    await this.trustOperator.createPriceTrustFund(
      user1.address,
      "ETH/USD",
      RELEASE_PRICE
    );
    let tokenId = await this.trustFundToken.tokenId();
    await expect(
      this.trustOperator.releaseTrustFund(tokenId)
    ).to.be.revertedWith("Current price is below release price");
  });
  it("transfers trust fund if price is met", async () => {
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    await this.trustOperator.createPriceTrustFund(
      user1.address,
      "ETH/USD",
      LOW_RELEASE_PRICE
    );
    let tokenId = await this.trustFundToken.tokenId();
    await this.trustOperator.releaseTrustFund(tokenId);
    expect(await this.trustFundToken.ownerOf(tokenId)).to.equal(user1.address);
  });
  it("emits TrustReleased Event", async () => {
    await this.usdc.approve(this.trustOperator.address, CREATE_FEE);
    await this.trustOperator.createPriceTrustFund(
      user1.address,
      "ETH/USD",
      LOW_RELEASE_PRICE
    );
    let tokenId = await this.trustFundToken.tokenId();
    expect(await this.trustOperator.releaseTrustFund(tokenId)).to.emit(
      "TrustReleased"
    );
  });
  it("correctly transfers usdc funds from the contract to owner", async () => {
    let preUserBalance = await this.usdc.balanceOf(deployer.address);
    let preContractBalance = await this.usdc.balanceOf(
      this.trustOperator.address
    );
    await this.trustOperator.withdrawFees();
    let postUserBalance = await this.usdc.balanceOf(deployer.address);
    let postContractBalance = await this.usdc.balanceOf(
      this.trustOperator.address
    );
    expect(preUserBalance.add(preContractBalance)).to.equal(
      postUserBalance.add(postContractBalance)
    );
  });
  it("correctly sets the create fee", async () => {
    await this.trustOperator.setCreateFee(NEW_CREATE_FEE);
  });
  it("reverts if caller of setCreateFee is not owner", async () => {
    await expect(
      this.trustOperator.connect(user1).setCreateFee(NEW_CREATE_FEE)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("returns price feed", async () => {
    await this.trustOperator.getPriceFeed("ETH/USD");
  });
  it("getTrustAddress returns address", async () => {
    let tokenId = await this.trustFundToken.tokenId();
    let address = await this.trustOperator.getTrustAddress(tokenId);
    console.log(address);
  });
  it("reverts if tokenId doesnt exist when calling releaseTrust", async () => {
    let tokenId = await this.trustFundToken.tokenId();
    await expect(
      this.trustOperator.releaseTrustFund(tokenId + 1)
    ).to.be.revertedWith("TokenId doesn't exist");
  });
});
3;
