class ApiError extends Error {
    constructor(
        statuscode,
        message = "Something went Wrong",
        errors = [],
        stack = ""
    ){
        super(message),
        this.statuscode =statuscode,
        this.data = null
        this.message
        this.errors = errors

        if (stack) {
            this.stack = statck 
        } else {
            Error.captureStackTrace(this , this.constructor)
        }


    }
} 

export {ApiError}