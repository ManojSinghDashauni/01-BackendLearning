//it is HOF which is take argument and return function  
// const asyncHandler = (func) => (async () => {})
    
const asyncHandler = (requestHandler) => (async (req, res, next) => {
    try {
        await requestHandler(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }
})

export {asyncHandler}

// other way with promises
// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
//     }
// }
