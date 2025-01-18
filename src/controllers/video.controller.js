import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  // const videos = await Video.aggregate(
  //   [
  //     {
  //       $match:{

  //       }
  //     }
  //   ]
  // )
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  //validation
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All field are required");
  }

  //multer give files access
  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "video File and thumbnail is required");
  }

  //upload them to cloudnary,  check
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!videoFile || !thumbnail) {
    throw new ApiError(400, "videoFile file and thumbnailFile is required");
  }

  //create userVedio object - create entry in db mad check
  const userVideo = await Video.create({
    owner: req.user._id,
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile.duration,
  });

  if (!userVideo) {
    throw new ApiError(500, "something went wrong when making a document");
  }

  //return res
  return res
    .status(201)
    .json(new ApiResponse(200, userVideoUpdate, "publish A Video sucessfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId?.trim()) {
    throw new ApiError(400, "videoId is nt present");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId), // Convert string to ObjectId
      },
    },

    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },

    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },

        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "owner", //it is video elment
        foreignField: "_id",
        as: "owner", //create field in getvideoByID
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              foreignField: "channel",
              localField: "_id",
              as: "subscribers",
            },
          },

          {
            //add additional fields
            $addFields: {
              subscriberCount: {
                $size: "$subscribers",
              },

              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },

          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              subscriberCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },

    {
      $lookup: {
        from: "comments",
        foreignField: "video",
        localField: "_id",
        as: "comments",
      },
    },

    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        owner: 1,
        createdAt: 1,
        comments: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(404, "Video is not found");
  }

  const videoViews = await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: { views: 1 },
    },

    {
      new: true,
    }
  );

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $addToSet: { watchHistory: videoId },
    },

    {
      new: true,
    }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        video: video[0],
        videoViews: videoViews,
        user: user,
      },

      "Video fetched successfully"
    )
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Valid video id is required");
  }
  //TODO: update video details like title, description, thumbnail

  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(401, "title and description is required");
  }

  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(401, "please provide thumbnailLocalPath");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail.url) {
    throw new ApiError(400, "please provide thumbnail");
  }

  const oldThumbnail = await Video.findById(videoId);

  const oldThumbnail_public_id = oldThumbnail.url;

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    }
  );

  await deleteFromCloudinary(oldThumbnail_public_id)
    .then((res) => {
      console.log("Deletion response:", response);
      return new ApiResponse(200, {}, "Old file has been deleted");
    })
    .catch((error) => {
      console.error("Deletion failed:", error);
      throw new ApiError(400, "error deleting the old file from cloudinary");
    });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "update video details succesfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Valid video id is required");
  }

  const video = await Video.findById(videoId);
  if (!(video?.owner).equals(req.user?._id)) {
    throw new ApiError(400, "You cannot Update the details");
  }
  const videoDelete = await deleteFromCloudinary(video.videoFile);

  const thumdDelete = await deleteFromCloudinary(video.thumbnail);

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  return res
    .status(204)
    .json(new ApiResponse(204, { deletedVideo }, "video and details deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!(video?.owner).equals(req.user?._id)) {
    throw new ApiError(400, "You cannot Update the details");
  }
  
  const videoChanged = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, videoChanged, "Changed View of the Publication")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
