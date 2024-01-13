import { Product, Order, ProductType, PType, PackageStatus } from './interfaces'
const { getProducts, updateProduct } = require('./apis')

function searchProductById(
  products: Product[],
  productId: string
): Product | undefined {
  let product = products.find((product: Product) => {
    return product.id === productId
  })
  return product
}

export async function buildPackage(
  order: Order,
  restockingThreshold: number
): Promise<[string, number, Product[], { [key: string]: number }]> {
  console.log('___________________ Building package ___________________')
  // Defining variables
  let items: { [key: string]: number } = {}
  let restock: { [key: string]: number } = {}
  let packageBuild: Product[] = []
  let totalPrice = 0
  let packageStatus: PackageStatus = 'complete'
  // Generating a list of items to be packed

  for (let i = 0; i < order.articles.length; i++) {
    if (items.hasOwnProperty(order.articles[i])) {
      items[order.articles[i]] += 1
    } else {
      items[order.articles[i]] = 1
    }
  }
  console.log('Items to be packed:', items)
  // for each order I want to fetch all products. Later we can just fetch it once in a main function and then mutate it.
  const [tools, heatPumps, installationMaterials] = await Promise.all([
    getProducts(ProductType.TOOLS),
    getProducts(ProductType.HEAT_PUMPS),
    getProducts(ProductType.INSTALLATION_MATERIALS),
  ])
  // I go through each item in the order and search for it in the products list.
  // If found, I add it to the package list, check stock and update the products DB.
  // If not found, I throw an error/warning that we need to add it.
  // If we run out of stock soon, I will add id and type of product to restock list.
  for (let i = 0; i < order.articles.length; i++) {
    const item = order.articles[i]

    // First, we search article in products. we need to know what type of product it is to update it in the DB
    let product = searchProductById(tools, item)
    let productType: PType | undefined = ProductType.TOOLS
    if (!product) {
      product = searchProductById(heatPumps, item)
      productType = ProductType.HEAT_PUMPS
    }
    if (!product) {
      product = searchProductById(installationMaterials, item)
      productType = ProductType.INSTALLATION_MATERIALS
    }

    // if we found it we add it to the package list
    if (product) {
      if (product.stock >= items[item]) {
        packageBuild.push(product)
        totalPrice += product?.unitPrice || 0 * items[item]
        product.stock -= items[item]
        await updateProduct(productType, item, product)
        console.log(
          `-------- Item with id: ${item} and name: ${product.name} added to package --------\n`
        )
      } else if (Math.max(items[item], restockingThreshold) > product.stock) {
        console.log(`!!! It's time to restock Item with id: ${item} \n`)
        restock[item] = restock.hasOwnProperty(item)
          ? restock[item] + items[item]
          : items[item]
      } else {
        packageStatus = 'incomplete'
        console.log(`!!!!! Item with id: ${item} out of stock !!!!!\n`)
      }
    } else {
      console.log('!-------- Item not found --------!\n', item)
    }
  }
  return [packageStatus, totalPrice, packageBuild, restock]
}
