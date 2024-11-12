const asyncHandler = (requestHandler) =>{
    (req,res,next) =>{
        Promise.resolve(requestHandler).catch((err)=> next(err))
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

