import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//fibonaccifire cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull
    // console.log("file is uploaded on cloudinary ", response.url);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove file locally saved
    return null;
  }
};

const deleteFromCloudinary = async(FilePath) => {
  try {

      if (!FilePath) {
          console.log("File not found");
          return null;
      }

      const response = await cloudinary.uploader.destroy(FilePath, {
          resource_type: "auto"
      });

      if (response.result === "ok") {
          console.log(`Successfully deleted file with public ID: ${FilePath}`);
      } else {
          console.log(`Failed to delete file: ${response.result}`);
      }

      return response;
      
  } catch (error) {
      console.log("error while deleting the file");
      throw error;
  }
}

// const cloudinaryDeleteOldFile = async (FilePath) => {
//   try {
//     // Delete the old file (if a public_id is provided)
//     if (FilePath) {
//       const deleteResponse = await cloudinary.uploader.destroy(FilePath);
//       console.log("Old file deleted:", deleteResponse);
//     }

//     return true

//   } catch (error) {
//     console.error("Error during upload or delete:", error);
//     throw error;
//   }
// };

export { uploadOnCloudinary };
