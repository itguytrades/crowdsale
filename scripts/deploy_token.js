
const hre = require("hardhat");

async function main() {
  const NAME = 'CGDev Token'
  const SYMBOL = 'CGD'
  const MAX_SUPPLY = '1000000'


  // Deploy Token
  const Token = await hre.ethers.getContractFactory('Token')
  const token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY)
  
  await token.deployed()
  console.log(`Token deployed to: ${token.address}\n`)

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
