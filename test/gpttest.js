const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdsale", function () {
    let Crowdsale, crowdsale;
    let owner, addr1, addr2, addr3;
    const rate = 1000; // 1000 tokens per 1 ETH
    const minPurchase = ethers.utils.parseEther("0.1"); // Minimum purchase is 0.1 ETH
    const maxPurchase = ethers.utils.parseEther("10");  // Maximum purchase is 10 ETH
    let startTime, endTime;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        // Set startTime to 1 minute from now and endTime to 1 hour from startTime
        startTime = Math.floor(Date.now() / 1000) + 60; // Crowdsale starts in 1 minute
        endTime = startTime + 3600; // Crowdsale lasts for 1 hour

        Crowdsale = await ethers.getContractFactory("Crowdsale");
        crowdsale = await Crowdsale.deploy(rate, startTime, endTime, minPurchase, maxPurchase);
        await crowdsale.deployed();
    });

    describe("Deployment", function () {
        it("should set the right owner", async function () {
            expect(await crowdsale.owner()).to.equal(owner.address);
        });

        it("should initialize with correct rate, time limits, and purchase limits", async function () {
            expect(await crowdsale.rate()).to.equal(rate);
            expect(await crowdsale.startTime()).to.equal(startTime);
            expect(await crowdsale.endTime()).to.equal(endTime);
            expect(await crowdsale.minPurchase()).to.equal(minPurchase);
            expect(await crowdsale.maxPurchase()).to.equal(maxPurchase);
        });
    });

    describe("Whitelist management", function () {
        it("should allow only the owner to add address to whitelist", async function () {
            expect(await crowdsale.whitelist(addr1.address)).to.be.false;

            await crowdsale.updateWhitelist(addr1.address, true);

            expect(await crowdsale.whitelist(addr1.address)).to.be.true;

            // addr1 (non-owner) tries to update the whitelist, it should fail
            await expect(
                crowdsale.connect(addr1).updateWhitelist(addr2.address, true)
            ).to.be.revertedWith("Caller is not the owner");
        });

        it("should emit WhitelistUpdated event when an address is added", async function () {
            await expect(crowdsale.updateWhitelist(addr1.address, true))
                .to.emit(crowdsale, "WhitelistUpdated")
                .withArgs(addr1.address, true);
        });
    });

    describe("Crowdsale timing", function () {
        it("should not allow buying tokens before the start time", async function () {
            await crowdsale.updateWhitelist(addr1.address, true);
            await expect(crowdsale.connect(addr1).buyTokens({ value: ethers.utils.parseEther("1") }))
                .to.be.revertedWith("Crowdsale is not active");
        });

        it("should allow buying tokens after the start time", async function () {
            await crowdsale.updateWhitelist(addr1.address, true);

            // Move forward in time to start the crowdsale
            await ethers.provider.send("evm_increaseTime", [60]); // move 60 seconds forward
            await ethers.provider.send("evm_mine");

            await expect(crowdsale.connect(addr1).buyTokens({ value: ethers.utils.parseEther("1") }))
                .to.emit(crowdsale, "TokensPurchased")
                .withArgs(addr1.address, ethers.utils.parseEther("1"), 1000 * 1);
        });

        it("should not allow buying tokens after the end time", async function () {
            await crowdsale.updateWhitelist(addr1.address, true);

            // Move forward in time to after the end of the crowdsale
            await ethers.provider.send("evm_increaseTime", [3601]); // move 1 hour and 1 second forward
            await ethers.provider.send("evm_mine");

            await expect(crowdsale.connect(addr1).buyTokens({ value: ethers.utils.parseEther("1") }))
                .to.be.revertedWith("Crowdsale is not active");
        });
    });

    describe("Purchase Limits", function () {
        beforeEach(async function () {
            // Move to the crowdsale start time and whitelist addr1
            await ethers.provider.send("evm_increaseTime", [60]); // move 60 seconds forward
            await ethers.provider.send("evm_mine");

            await crowdsale.updateWhitelist(addr1.address, true);
        });

        it("should reject purchases below the minimum purchase limit", async function () {
            await expect(crowdsale.connect(addr1).buyTokens({ value: ethers.utils.parseEther("0.05") }))
                .to.be.revertedWith("Purchase amount is below minimum limit");
        });

        it("should reject purchases above the maximum purchase limit", async function () {
            await expect(crowdsale.connect(addr1).buyTokens({ value: ethers.utils.parseEther("11") }))
                .to.be.revertedWith("Purchase amount exceeds maximum limit");
        });

        it("should allow purchases within the valid range", async function () {
            await expect(crowdsale.connect(addr1).buyTokens({ value: ethers.utils.parseEther("5") }))
                .to.emit(crowdsale, "TokensPurchased")
                .withArgs(addr1.address, ethers.utils.parseEther("5"), 1000 * 5);
        });
    });

    describe("Token Purchase", function () {
        beforeEach(async function () {
            // Move to the crowdsale start time and whitelist addr1
            await ethers.provider.send("evm_increaseTime", [60]); // move 60 seconds forward
            await ethers.provider.send("evm_mine");

            await crowdsale.updateWhitelist(addr1.address, true);
        });

        it("should only allow whitelisted addresses to buy tokens", async function () {
            await expect(crowdsale.connect(addr2).buyTokens({ value: ethers.utils.parseEther("1") }))
                .to.be.revertedWith("Address is not whitelisted");

            await crowdsale.updateWhitelist(addr2.address, true);

            await expect(crowdsale.connect(addr2).buyTokens({ value: ethers.utils.parseEther("1") }))
                .to.emit(crowdsale, "TokensPurchased")
                .withArgs(addr2.address, ethers.utils.parseEther("1"), 1000 * 1);
        });

        it("should correctly calculate the number of tokens for ETH sent", async function () {
            const purchaseAmount = ethers.utils.parseEther("2"); // 2 ETH
            const expectedTokens = purchaseAmount.mul(rate);

            await expect(crowdsale.connect(addr1).buyTokens({ value: purchaseAmount }))
                .to.emit(crowdsale, "TokensPurchased")
                .withArgs(addr1.address, purchaseAmount, expectedTokens);
        });
    });

    describe("Withdraw Ether", function () {
        beforeEach(async function () {
            // Move to the crowdsale start time and whitelist addr1
            await ethers.provider.send("evm_increaseTime", [60]); // move 60 seconds forward
            await ethers.provider.send("evm_mine");

            await crowdsale.updateWhitelist(addr1.address, true);
        });

        it("should allow the owner to withdraw the ether", async function () {
            const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

            // addr1 buys tokens
            await crowdsale.connect(addr1).buyTokens({ value: ethers.utils.parseEther("2") });

            // Owner withdraws the ether
            await crowdsale.withdraw();

            const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

            // Check that owner's balance has increased by the value sent
            expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
        });

        it("should not allow non-owner to withdraw ether", async function () {
            await expect(crowdsale.connect(addr1).withdraw()).to.be.revertedWith("Caller is not the owner");
        });
    });
});
