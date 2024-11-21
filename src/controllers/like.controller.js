import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    // Check if user has already liked the video
    const existingLike = await Like.findOne({ likedBy: req.user._id, video: videoId });
    if (existingLike) {
        // Remove like
        await existingLike.remove();
        video.likes = video.likes.filter((likeId) => !likeId.equals(existingLike._id));
    } else {
        // Add new like
        const newLike = await Like.create({ likedBy: req.user._id, video: videoId });
        video.likes.push(newLike._id);
    }

    await video.save(); // Save updated video

    const updatedVideo = await Video.findById(videoId).populate("likes");
    res.status(200).json(new ApiResponse(200, updatedVideo, "Like toggled successfully"));
});


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    // Check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    const existingLike = await Like.findOne({ likedBy: req.user._id, comment: commentId });
    if (existingLike) {
        await existingLike.remove(); // Remove like
    } else {
        const newLike = await Like.create({ likedBy: req.user._id, comment: commentId });
        comment.likes.push(newLike._id);
        await comment.save(); // Save updated comment
    }

    res.status(200).json(new ApiResponse(200, {}, "Like toggled successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    // Check if tweet exists
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");

    const existingLike = await Like.findOne({ likedBy: req.user._id, tweet: tweetId });
    if (existingLike) {
        await existingLike.remove(); // Remove like
    } else {
        const newLike = await Like.create({ likedBy: req.user._id, tweet: tweetId });
        tweet.likes.push(newLike._id);
        await tweet.save(); // Save updated tweet
    }

    res.status(200).json(new ApiResponse(200, {}, "Like toggled successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.find({ likedBy: req.user._id, video: { $exists: true } })
        .populate("video");

    res.status(200).json(
        new ApiResponse(200, likedVideos.map((like) => like.video), "Liked videos fetched successfully")
    );
});


export { 
    toggleVideoLike, 
    toggleCommentLike, 
    toggleTweetLike, 
    getLikedVideos 
};
