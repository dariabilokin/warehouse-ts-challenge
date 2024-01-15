import axios from 'axios'
import { Product, Order, PType } from './interfaces'
const getOrders = async (): Promise<Order[]> => {
  const { data } = await axios.get<Order[]>('http://localhost:3000/orders')
  return data
}

const getProducts = async (type: PType): Promise<Product[]> => {
  const { data } = await axios.get<Product[]>(`http://localhost:3000/${type}`)
  return data
}

const getProductById = async (type: PType, id: string): Promise<Product> => {
  const { data } = await axios.get<Product>(
    `http://localhost:3000/${type}/${id}`
  )
  return data
}

const updateProduct = async (
  type: PType,
  productId: Product['id'],
  productData: Product
): Promise<void> => {
  await axios
    .put(`http://localhost:3000/${type}/${productId}`, productData)
    .then(function (response) {
      console.log(`Update product ${productId} status`, response?.statusText)
    })
    .catch(function (error) {
      console.log(error)
    })
}

export { getOrders, getProducts, getProductById, updateProduct }
