const hre = require("hardhat");
const config = require('../src/config.json')



const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
 

  accounts = await ethers.getSigners()
  deployer = accounts[0]
  const newMinPurchase = tokens(1)
  const newMaxPurchase = tokens(50000)


   // Fetch network

  console.log(`Fetching Network...\n`)
  const { chainId } = await ethers.provider.getNetwork()


  // Fetch Crowdsale Contract
  const crowdsale = await ethers.getContractAt('Crowdsale', config[chainId].crowdsale.address)

    // Update minPurchase
    transaction = await crowdsale.connect(deployer).setMinPurchase(newMinPurchase)
    result = await transaction.wait()

    // Update maxPurchase
    transaction = await crowdsale.connect(deployer).setMaxPurchase(newMaxPurchase)
    result = await transaction.wait()

    console.log(`minPurchase Limit set to ${newMinPurchase}\n`)
    console.log(`maxPurchase Limit set to ${newMaxPurchase}\n`)

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});