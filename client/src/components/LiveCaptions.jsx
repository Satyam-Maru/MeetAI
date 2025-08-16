// client/src/components/LiveCaptions.jsx
import { useEffect, useState } from "react";
import { RoomEvent } from "livekit-client";
import { useMaybeRoomContext } from "@livekit/components-react";
import "../styles/LiveCaptions.css";

export default function LiveCaptions() {
  const room = useMaybeRoomContext();
  const [transcriptions, setTranscriptions] = useState({});

  useEffect(() => {
    if (!room) {
      return;
    }

    const updateTranscriptions = (segments) => {
      // --- DEBUG LOGGING ---
      // This will print the raw transcription data to your browser's developer console
      console.log("LiveKit transcription segments received:", segments); 
      // --- END DEBUG LOGGING ---

      setTranscriptions((prev) => {
        const newTranscriptions = { ...prev };
        // The data from broadcastData is a Uint8Array, we need to decode it
        const decodedString = new TextDecoder().decode(segments);
        const segmentsArray = JSON.parse(decodedString);

        for (const segment of segmentsArray) {
          newTranscriptions[segment.id] = segment;
        }
        return newTranscriptions;
      });
    };

    // Note: The event for broadcasted data is DataReceived, not TranscriptionReceived
    room.on(RoomEvent.DataReceived, updateTranscriptions);

    return () => {
      room.off(RoomEvent.DataReceived, updateTranscriptions);
    };
  }, [room]);

  return (
    <div className="live-captions-container">
      {Object.values(transcriptions)
        .sort((a, b) => a.startTime - b.startTime)
        .map((segment) => (
          <li key={segment.id}>{segment.text}</li>
        ))}
    </div>
  );
}