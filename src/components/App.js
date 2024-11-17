import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap';
import { ethers } from 'ethers'


import Navigation from './Navigation';
import Buy from './Buy';
import Info from './Info';
import Loading from './Loading';
import Progress from './Progress';

import TOKEN_ABI from '../abis/Token.json';
import CROWDSALE_ABI from '../abis/Crowdsale.json';

import config from '../config.json'

function App() {

    const [provider, setProvider] = useState(null);
    const [crowdsale, setCrowdsale] = useState(null);
	
    const [account, setAccount] = useState(null);
    const [accountBalance, setAccountBalance] = useState(null)

    const [price, setPrice] = useState(0)
    const [minPurchase, setMinPurchase] = useState(0)
    const [maxPurchase, setMaxPurchase] = useState(0)

    const [maxTokens, setMaxTokens] = useState(0)
    const [tokenSold, setTokenSold] = useState(0)

    const [isLoading, setIsLoading] = useState(true);

    const [isWhiteListed, setIswhitelisted] = useState(null);

    const LoadBlockchainData = async () => {

	const provider = new ethers.providers.Web3Provider(window.ethereum)
	setProvider(provider)

	const token = new ethers.Contract(config[31337].token.address, TOKEN_ABI, provider)
	const crowdsale = new ethers.Contract(config[31337].crowdsale.address, CROWDSALE_ABI, provider)
	setCrowdsale(crowdsale)

	console.log(token)

	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts'})
	const account = ethers.utils.getAddress(accounts[0])

	setAccount(account)

	const accountBalance = ethers.utils.formatUnits(await token.balanceOf(account), 18)
	setAccountBalance(accountBalance)


	const price = ethers.utils.formatUnits(await crowdsale.price(), 18)
	setPrice(price)

	// Fetch the minPurchase value from the contract
	const minPurchase = ethers.utils.formatUnits(await crowdsale.minPurchase(), 18)
	setMinPurchase(minPurchase);

	const maxPurchase = ethers.utils.formatUnits(await crowdsale.maxPurchase(), 18)
	setMaxPurchase(maxPurchase);

	const maxTokens = ethers.utils.formatUnits(await crowdsale.maxTokens(), 18) 
	setMaxTokens(maxTokens)

	const tokenSold = ethers.utils.formatUnits(await crowdsale.tokenSold(), 18) 
	setTokenSold(tokenSold)

	setIsLoading(false)

}

useEffect(() => {
	if (isLoading) {
LoadBlockchainData()

	}

}, [isLoading]);


return(
    <Container>
	<Navigation />

	    <h1 className='my-4 text-center'>Get your CGDev Token Now</h1>
		{isLoading ? (
			<Loading />
			) : (
		<>
		<p className='text-center'><strong>Current Price:</strong> {price} ETH </p>
		<p className='text-center'><strong>Min Purchase:</strong>{minPurchase}</p>
		<p className='text-center'><strong>Max Purchase:</strong>{maxPurchase}</p>
		<Buy provider={provider} price={price} crowdsale={crowdsale} setIsLoading={setIsLoading} />
		<Progress maxTokens={maxTokens} tokenSold={tokenSold}/>
		</>			
		)}

		<hr />
		{account && (
			<Info account={account} accountBalance={accountBalance}/>
			)}
		
    </Container>
)

}

export default App;
