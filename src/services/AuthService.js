import Axios from "../utilities/Axios"


class AuthService {
async Login (data){
    return Axios.post('',data,{
        headers:{
           "content-type":"Application/json" 
        }
    })
}
}

export default new AuthService()