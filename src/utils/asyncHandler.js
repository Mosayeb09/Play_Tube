const asyncHandler = (requestHandler) => {
<<<<<<< HEAD
   return  (req, res, next) => {
=======
    (req, res, next) => {
>>>>>>> 7d8a2841c084d565675dd678aacbdf4f04ac7b1c
        Promise.resolve(requestHandler(req, res, next)).catch(err => next(err))
    }
}


<<<<<<< HEAD
export  {asyncHandler}
=======
export default {asyncHandler}
>>>>>>> 7d8a2841c084d565675dd678aacbdf4f04ac7b1c
