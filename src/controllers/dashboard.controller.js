import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate the channel ID
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    // Aggregate stats
    const totalVideos = await Video.countDocuments({ owner: channelId });
    
    const totalViews = await Video.aggregate([
        { $match: { owner: mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalViews: { $sum: "$view" } } },
    ]);

    const totalLikes = await Like.aggregate([
        {
            $lookup: {
                from: "videos", // Collection name for `Video`
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
            },
        },
        { $unwind: "$videoDetails" },
        { $match: { "videoDetails.owner": mongoose.Types.ObjectId(channelId) } },
        { $count: "totalLikes" },
    ]);

    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    const stats = {
        totalVideos,
        totalViews: totalViews[0]?.totalViews || 0,
        totalLikes: totalLikes[0]?.totalLikes || 0,
        totalSubscribers,
    };

    return res
        .status(200)
        .json(new ApiResponse(stats, "Channel stats retrieved successfully"));
});


const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate the channel ID
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    // Get all videos by the channel
    const videos = await Video.find({ owner: channelId });

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this channel");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(videos, "Channel videos retrieved successfully")
    );
});


export {
    getChannelStats, 
    getChannelVideos
    }