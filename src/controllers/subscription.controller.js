import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id; 

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Check if the channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Prevent self-subscription
    if (subscriberId.toString() === channelId) {
        throw new ApiError(400, "Users cannot subscribe to themselves");
    }

    // Check if the subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    if (existingSubscription) {
        // Unsubscribe
        await existingSubscription.remove();
        res.status(200).json(
            new ApiResponse(200, {}, "Successfully unsubscribed from the channel")
        );
    } else {
        // Subscribe
        await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });
        res.status(201).json(
            new ApiResponse(201, {}, "Successfully subscribed to the channel")
        );
    }
});


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Check if the channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Get all subscribers for the channel
    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username fullName avatar")
        .exec();

    res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user._id; // Assuming `req.user` contains authenticated user's info

    // Get all channels the user is subscribed to
    const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username fullName avatar")
        .exec();

    res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    );
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}