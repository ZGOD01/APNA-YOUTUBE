const asyncHandler = (requestHandler) =>{
    return (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}

export {asyncHandler}





// const asyncHandler = (fn) => async ()=>{
//     try {
//         await fn(req, res , next)
//     } catch (error) {
//         res.send(err.code || 500).josn({
//             success : false,
//             message : err.message
//         })
//     }
// }

