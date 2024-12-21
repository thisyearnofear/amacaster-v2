import { ethers, run } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account:', deployer.address)

  const AMARegistry = await ethers.getContractFactory('AMARegistry')
  const amaRegistry = await AMARegistry.deploy()

  await amaRegistry.waitForDeployment()
  const contractAddress = await amaRegistry.getAddress()

  console.log('AMARegistry deployed to:', contractAddress)

  // Verify the contract on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log('Waiting for block confirmations...')
    await amaRegistry.deploymentTransaction()?.wait(6)

    console.log('Verifying contract...')
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: [],
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
