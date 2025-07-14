import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Room,
  RoomEvent,
  createLocalAudioTrack,
  createLocalVideoTrack,
} from "livekit-client";

const RoomPage = () => {
  const { roomName } = useParams();
  const [searchParams] = useSearchParams();
  const isHost = searchParams.get("host") === "true";
  const prefilledIdentity = searchParams.get("identity") || "";

  const [identity, setIdentity] = useState(prefilledIdentity);
  const [showModal, setShowModal] = useState(!prefilledIdentity);
  const [room, setRoom] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const [remoteTracks, setRemoteTracks] = useState([]);

  const navigate = useNavigate();
  const url = import.meta.env.VITE_PLATFORM == 'dev' ? import.meta.env.VITE_LOCALHOST_URL : import.meta.env.VITE_BACKEND_URL;

  // Check authentication status on initial load
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${url}/api/auth/status`, {
        withCredentials: true
      });
      if (response.data.user) {
        console.log(`auth success, username: ${JSON.parse(response.data.user).name}`);
      }else{
        navigate('/', {replace:true})
      }
    } catch (error) {
      // alert("Auth check failed:", error);
      console.log(error)
      navigate('/', {replace:true})
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, [navigate]);

  useEffect(() => {
    if (prefilledIdentity) joinRoom(prefilledIdentity);
    return () => room?.disconnect();
  }, []);

  const joinRoom = async (userName = identity) => {

    console.log(`roomName: ${roomName}\n identity: ${userName}\n isHost: ${isHost}`)

    const res = await axios.post(
      `${url}/get-token`,
      {
        roomName,
        identity: userName,
        isHost,
      }
    );

    const token = res.data.token;
    const roomInstance = new Room();

    roomInstance.on(
      RoomEvent.TrackSubscribed,
      (track, publication, participant) => {
        if (participant.isLocal) return;

        const key = `${participant.identity}-${publication.source}`;

        if (track.kind === "audio") {
          const audioEl = track.attach();
          audioEl.autoplay = true;
          audioEl.muted = false;
          audioEl.play().catch((e) => console.warn("Audio autoplay failed:", e));
          document.body.appendChild(audioEl);
          return;
        }

        if (track.kind === "video") {
          setRemoteTracks((prev) => {
            if (prev.some((t) => t.key === key)) return prev;
            return [...prev, { key, track, identity: participant.identity }];
          });
        }
      }
    );

    roomInstance.on(RoomEvent.ParticipantDisconnected, (participant) => {
      setRemoteTracks((prev) =>
        prev.filter((t) => !t.key.startsWith(participant.identity))
      );
    });

    await roomInstance.connect(import.meta.env.VITE_LIVEKIT_URL, token);

    try {
      const videoTrack = await createLocalVideoTrack();
      await roomInstance.localParticipant.publishTrack(videoTrack);
      setLocalTrack({ track: videoTrack, identity: userName });
    } catch (err) {
      console.warn("Could not publish video:", err);
    }

    try {
      const audioTrack = await createLocalAudioTrack();
      await roomInstance.localParticipant.publishTrack(audioTrack);
    } catch (err) {
      console.warn("Could not publish audio:", err);
    }

    setRoom(roomInstance);
    setShowModal(false);
  };

  return (
    <div style={styles.pageContainer}>
      <div id="video-grid" style={styles.gridContainer}>
        {localTrack && (
          <VideoTile
            identity={localTrack.identity}
            track={localTrack.track}
            isLocal
          />
        )}
        {remoteTracks.map(({ key, track, identity }) => (
          <VideoTile key={key} identity={identity} track={track} />
        ))}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentWrapper}>
            <div style={styles.modalContent}>
              <h2>Live Room: {roomName}</h2>
              <h3>Enter your name to join</h3>
              <input
                style={styles.input}
                placeholder="Your name"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
              />
              <button
                style={styles.button}
                onClick={() => joinRoom()}
                disabled={!identity.trim()}
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VideoTile = ({ identity, track, isLocal = false }) => {
  const ref = useRef();

  useEffect(() => {
    const el = track.attach();
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.objectFit = "contain"; // ✅ Show full video without cropping
    if (isLocal) el.style.transform = "scaleX(-1)";
    ref.current?.appendChild(el);
    return () => {
      track.detach().forEach((el) => el.remove());
    };
  }, [track]);

  return (
    <div style={styles.videoTile}>
      <div ref={ref} style={styles.videoElement}></div>
      <div style={styles.nameTag}>
        {identity} {isLocal && "(You)"}
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    height: "100vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  gridContainer: {
    flex: 1,
    display: "grid",
    gap: "10px",
    padding: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    alignItems: "center",
    justifyItems: "center",
    overflowY: "auto",
    overflowX: "hidden",
  },
  videoTile: {
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    aspectRatio: "4 / 3", // ✅ Works well for both portrait & landscape
    backgroundColor: "#1e1e1e",
    borderRadius: "8px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  videoElement: {
    width: "100%",
    height: "100%",
    objectFit: "contain", // ✅ Prevent crop for mobile portrait users
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  nameTag: {
    position: "absolute",
    bottom: "8px",
    left: "8px",
    color: "white",
    background: "rgba(0, 0, 0, 0.5)",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "14px",
    zIndex: 1,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(8, 8, 8, 0.5)",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContentWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  modalContent: {
    background: "#1e1e1e",
    padding: "40px",
    borderRadius: "8px",
    textAlign: "center",
    width: "300px",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
    color: '#e1d9d9ff',
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    marginBottom: "20px",
    fontSize: "16px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default RoomPage;