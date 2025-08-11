import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    room_name: {
        type: String,
        unique: true,
    },
    room_host: String,
    active: Boolean // integrate cron jobs to delete the docs with active: false
})

export default mongoose.model('Room', roomSchema)