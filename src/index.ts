import { buildPackage } from './buildPackage'
const { getOrders } = require('./apis')

async function main(): Promise<void> {
  const orders = await getOrders()
  const restockingThreshold = 5
  let restockList: { [key: string]: number } = {}

  for (let i = 0; i < orders.length; i++) {
    console.log(
      `\n___________________Processing Order #${i} ___________________`
    )
    const [packageStatus, totalPrice, packageBuild, restock] =
      await buildPackage(orders[i], restockingThreshold)
    Object.assign(restockList, restock)
    console.log('Package status: ', packageStatus)
    console.log(`Total price: ${totalPrice.toFixed(3)}`)
    // console.log('Package build: ', packageBuild)
  }
  console.log('Restock list: ', restockList)
}

main()
