
const hre = require("hardhat");

async function main() {
  const NAME = 'CGDev Token'
  const SYMBOL = 'CGD'
  const MAX_SUPPLY = '1000000'
  const PRICE = ethers.utils.parseUnits('0.025', 'ether')

  const minPurchase = ethers.utils.parseEther('2', 'ether'); // Minimum purchase is 0.1 ETH
  const maxPurchase = ethers.utils.parseEther('10', 'ether');  // Maximum purchase is 10 ETH
  let startTime, endTime;


  startTime = Math.floor(Date.now() / 1000); // Crowdsale starts in 1 minute
  endTime = startTime + 3600; // Crowdsale lasts for 1 hour

  // Deploy Token
  const Token = await hre.ethers.getContractFactory('Token')
  const token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY)
  
  await token.deployed()
  console.log(`Token deployed to: ${token.address}\n`)

  // Deploy Crowdsale
  const Crowdsale = await hre.ethers.getContractFactory('Crowdsale')
  const crowdsale = await Crowdsale.deploy(
    token.address,
    PRICE,
    ethers.utils.parseUnits(MAX_SUPPLY, 'ether'),
    startTime,
    endTime, 
    minPurchase,
    maxPurchase
  )
  await crowdsale.deployed();

  console.log(`Crowdsale deployed to: ${crowdsale.address}\n`)

  const transaction = await token.transfer(crowdsale.address, ethers.utils.parseUnits(MAX_SUPPLY, 'ether'))
  await transaction.wait()

  console.log(`Tokens transferred to Crowdsale\n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
