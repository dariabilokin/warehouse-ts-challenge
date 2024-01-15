import { buildPackage } from './buildPackage'
const { getOrders } = require('./apis')

async function main(): Promise<void> {
  const orders = await getOrders()
  // 5 is the default restocking threshold for the warehouse in the challenge
  // Ideally, I would put it in env variables. But I didn't have time to do it.
  const restockingThreshold = 5
  let restockList = new Map<string, number>()

  for (let i = 0; i < orders.length; i++) {
    console.log(
      `\n___________________Processing Order #${i} ___________________`
    )
    const [packageStatus, totalPrice, packageBuild, restock] =
      await buildPackage(orders[i], restockingThreshold)
    restockList = new Map([...restockList.entries(), ...restock.entries()])

    console.log('Package status: ', packageStatus)
    console.log(`Total price: ${totalPrice.toFixed(3)}`)
    console.log('Package build: ', packageBuild)
  }
  console.log('Restock list: ', restockList)
}

main()
