const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('Crowdsale', () => {
  let crowdsale, token
  let accounts, deployer, user1

	beforeEach(async () => {
      const Crowdsale = await ethers.getContractFactory('Crowdsale')
      const Token = await ethers.getContractFactory('Token')

      token = await Token.deploy('CGDev Token', 'CGD', '1000000')

      accounts = await ethers.getSigners()
      deployer = accounts[0]
      user1 = accounts[1]

      const startTime = Math.floor(Date.now() / 1000); // Crowdsale starts in 60 seconds
			const endTime = startTime + 3600; // Crowdsale ends 1 hour later
			const minPurchase = tokens(1); // Minimum purchase of 1 token
			const maxPurchase = tokens(100); // Maximum purchase of 100 tokens

			crowdsale = await Crowdsale.deploy(
		    token.address, 
		    ether(1), 
		    '1000000', 
		    startTime, 
		    endTime, 
		    minPurchase, 
		    maxPurchase
			);

	  let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens(1000000))
      await transaction.wait()
	})

	describe('Deployment', () => {
	  it('sends tokens to the Crowdsale contract', async () => {
      expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000))
      })

      it('returns the price', async () => {
      expect(await crowdsale.price()).to.equal(ether(1))
      })

      it('returns token address', async () => {
  	  expect(await crowdsale.token()).to.equal(token.address)
	  })
	})

	describe('Buying Tokens', () => {
        let transaction, result, event
        let amount = tokens(10)

		describe('Success', () => {

		  beforeEach(async () => {

		  	transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address, true)
        await transaction.wait()

		    transaction = await crowdsale.connect(user1).buyTokens(amount, { value: ether(10) })
	      result = await transaction.wait()
		  })
			it('transfers tokens', async () => {
		        expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(999990))
      			expect(await token.balanceOf(user1.address)).to.equal(amount)
	   		})
	   		it('updates contracts ether balance', async () => {
		        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount)
	   		})
	   		it('updates tokensSold', async () => {
		        expect(await crowdsale.tokenSold()).to.equal(amount)
	   		})
	   		it('emits a buy event', async () => {
		        // --> https://hardhat.org/hardhat-chai-matchers/docs/reference#.emit
		        await expect(transaction).to.emit(crowdsale, 'Buy')
		          .withArgs(amount, user1.address)
			})
		})


		describe('Failure', () => {
	        it('rejects insufficent ETH', async () => {

	        transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address, true)
          await transaction.wait()

	        await expect(crowdsale.connect(user1).buyTokens(tokens(10), { value: 0 })).to.be.reverted
	        })

        })
	})

	describe('Sending ETH', () => {
	    let transaction, result
	    let amount = ether(10)

	    describe('Success', () => {

	      beforeEach(async () => {

	        transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address, true)
          await transaction.wait()

	        transaction = await user1.sendTransaction({ to: crowdsale.address, value: amount })
	        result = await transaction.wait()
	      })

	      it('updates contracts ether balance', async () => {
	        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount)
	      })

	      it('updates user token balance', async () => {
	        expect(await token.balanceOf(user1.address)).to.equal(amount)
	      })
	    })
    })

	describe('Updating Price', () => {
	    let transaction, result
	    let price = ether(2)

	    describe('Success', () => {

	      beforeEach(async () => {
	        transaction = await crowdsale.connect(deployer).setPrice(ether(2))
	        result = await transaction.wait()
	      })

	      it('updates the price', async () => {
	        expect(await crowdsale.price()).to.equal(ether(2))
	      })

    	})
    	describe('Failure', () => {
	      it('prevents non-owner from updating price', async () => {
	        await expect(crowdsale.connect(user1).setPrice(price)).to.be.reverted
	      })

   		})
	})

	describe('Updating Purchase Limits', () => {
    let transaction, result
    const newMinPurchase = tokens(5)
    const newMaxPurchase = tokens(50)

    describe('Success', () => {
        beforeEach(async () => {
            // Update minPurchase
            transaction = await crowdsale.connect(deployer).setMinPurchase(newMinPurchase)
            result = await transaction.wait()

            // Update maxPurchase
            transaction = await crowdsale.connect(deployer).setMaxPurchase(newMaxPurchase)
            result = await transaction.wait()
        })

        it('updates the minPurchase limit', async () => {
            expect(await crowdsale.minPurchase()).to.equal(newMinPurchase)
        })

        it('updates the maxPurchase limit', async () => {
            expect(await crowdsale.maxPurchase()).to.equal(newMaxPurchase)
        })
    })

    describe('Failure', () => {
        it('prevents non-owner from updating minPurchase', async () => {
            await expect(crowdsale.connect(user1).setMinPurchase(newMinPurchase)).to.be.reverted
        })

        it('prevents non-owner from updating maxPurchase', async () => {
            await expect(crowdsale.connect(user1).setMaxPurchase(newMaxPurchase)).to.be.reverted
        })
    })
  })


	describe('Finalzing Sale', () => {
	    let transaction, result
	    let amount = tokens(10)
	    let value = ether(10)

	    describe('Success', () => {

	      beforeEach(async () => {

	        transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address, true)
          await transaction.wait()
	      	
	        transaction = await crowdsale.connect(user1).buyTokens(amount, { value: value })
	        result = await transaction.wait()

	        transaction = await crowdsale.connect(deployer).finalize()
	        result = await transaction.wait()
	      })

	      it('transfers remaining tokens to owner', async () => {
	        expect(await token.balanceOf(crowdsale.address)).to.equal(0)
	        expect(await token.balanceOf(deployer.address)).to.equal(tokens(999990))
	      })

	      it('transfers ETH balance to owner', async () => {
	        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(0)
	      })

	      it('emits Finalize event', async () => {
	        // --> https://hardhat.org/hardhat-chai-matchers/docs/reference#.emit
	        await expect(transaction).to.emit(crowdsale, "Finalize")
	          .withArgs(amount, value)
	      })
	    })

	    describe('Failure', () => {

	      it('prevents non-owner from finalizing', async () => {
	        await expect(crowdsale.connect(user1).finalize()).to.be.reverted
	      })
   		})
    })
})