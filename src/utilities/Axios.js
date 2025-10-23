
import axios from 'axios'

const instance = axios.create({
    baseURL: "http://localhost:8277/login"  // Fixed: baseURL instead of baseUrl
})

export default instance;