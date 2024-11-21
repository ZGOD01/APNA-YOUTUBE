import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = -1, userId } = req.query;

    const matchStage = {
        isPublished: true,
        ...(query && { title: { $regex: query, $options: "i" } }),
        ...(userId && { owner: mongoose.Types.ObjectId(userId) }),
    };

    const sortStage = {
        [sortBy]: parseInt(sortType),
    };

    const aggregateQuery = Video.aggregate([
        { $match: matchStage },
        { $sort: sortStage },
    ]);

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    const videos = await Video.aggregatePaginate(aggregateQuery, options);

    res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
}); 

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const userId = req.user._id;

    if (!req.files || !req.files.video || !req.files.thumbnail) {
        throw new ApiError(400, "Video and thumbnail files are required");
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail[0];

    const uploadedVideo = await uploadOnCloudinary(videoFile.path);
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.path);

    if (!uploadedVideo || !uploadedThumbnail) {
        throw new ApiError(500, "Failed to upload files to Cloudinary");
    }

    const duration = req.body.duration || 0; // Optional duration

    const video = await Video.create({
        videofile: uploadedVideo.secure_url,
        thumbnail: uploadedThumbnail.secure_url,
        title,
        description,
        duration,
        owner: userId,
    });

    res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("owner", "username fullName avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const userId = req.user._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    if (req.file) {
        const uploadedThumbnail = await uploadOnCloudinary(req.file.path);
        if (!uploadedThumbnail) {
            throw new ApiError(500, "Failed to upload new thumbnail");
        }
        video.thumbnail = uploadedThumbnail.secure_url;
    }

    if (title) video.title = title;
    if (description) video.description = description;

    await video.save();

    res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    await video.remove();

    res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to toggle the publish status");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    res.status(200).json(new ApiResponse(200, video, "Video publish status updated successfully"));
});



export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}