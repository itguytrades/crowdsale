const hre = require("hardhat");
const config = require('../src/config.json')

async function main() {
 

  accounts = await ethers.getSigners()
  deployer = accounts[0]
  user1 = accounts[1]
  user2 = accounts[2]


   // Fetch network

  console.log(`Fetching Network...\n`)
  const { chainId } = await ethers.provider.getNetwork()


  // Fetch Crowdsale Contract
  const crowdsale = await ethers.getContractAt('Crowdsale', config[chainId].crowdsale.address)

    transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address, true)
    await transaction.wait()

    console.log(`Investor ${user1.address} added to whitelist: \n`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});