const hre = require("hardhat");
const config = require('../src/config.json')



const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
 

  accounts = await ethers.getSigners()
  deployer = accounts[0]
  const newPrice = ethers.utils.parseUnits('0.025', 'ether')



   // Fetch network

  console.log(`Fetching Network...\n`)
  const { chainId } = await ethers.provider.getNetwork()


  // Fetch Crowdsale Contract
  const crowdsale = await ethers.getContractAt('Crowdsale', config[chainId].crowdsale.address)

    // Update minPurchase
    transaction = await crowdsale.connect(deployer).setPrice(newPrice)
    result = await transaction.wait()

    console.log(`CGD price set to ${newPrice}\n`)

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});