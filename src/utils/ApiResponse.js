class ApiResponse extends Error{
    constructor(statusCode, message,data= "success"){
        this.statusCode = statusCode
        this.message = message
        this.data = data
        this.success = statusCode < 400

    }
<<<<<<< HEAD
}
export {ApiResponse}
=======
}
>>>>>>> 7d8a2841c084d565675dd678aacbdf4f04ac7b1c
