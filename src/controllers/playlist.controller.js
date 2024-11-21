import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const { userId } = req.user;

    //TODO: create playlist

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    const newPlaylist = new Playlist({
        name,
        description,
        owner: userId,
    });

    await newPlaylist.save();

    return res
    .status(200)
    .json(
        200,
        new ApiResponse(newPlaylist, "Playlist created successfully")
    )


});


const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if(!isValidObjectId(userId)){
        throw new ApiError("Invalid User ID")
    }

    const playlists = await Playlist.find({owner: userId})

    if (!playlists || playlists.length === 0) {
        throw new ApiError(404, "No playlists found for this user");
    }

    return res
   .status(200)
   .json(
    200,
    new ApiResponse(playlists, "Playlists retrieved successfully")
   )



});


const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError("Invalid Playlist ID")
    }
    const playlist = await Playlist.findById(playlistId).populate("videos")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
   .status(200)
   .json(
    200,
    new ApiResponse(playlist, "Playlist retrieved successfully")
   )

});


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or Video ID");
    }

    // Find playlist and check if video already exists
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist");
    }

    // Add video to playlist
    playlist.videos.push(videoId);
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(playlistId).populate("videos");

    return res
        .status(200)
        .json(new ApiResponse(updatedPlaylist, "Video added to playlist successfully"));
});


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or Video ID");
    }

    // Remove video from playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    ).populate("videos");

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(updatedPlaylist, "Video removed from playlist successfully"));
});


const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate Playlist ID
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    // Find and delete playlist
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(deletedPlaylist, "Playlist deleted successfully"));
});


const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    if (!name ||!description) {
        throw new ApiError(400, "Name and description are required");
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name, description },
        { new: true }
    ).populate("videos");

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
       .status(200)
       .json(new ApiResponse(updatedPlaylist, "Playlist updated successfully"));
    
})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}

