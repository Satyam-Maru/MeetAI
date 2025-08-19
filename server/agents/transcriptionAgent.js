import { WorkerOptions, cli, defineAgent } from "@livekit/agents";
import { AudioStream, RoomEvent, TrackKind } from "@livekit/rtc-node";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { fileURLToPath } from "url";
import { writeFile, appendFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export default defineAgent({
  entry: async (ctx) => {
    await ctx.connect();
    console.log("✅ Agent connected to LiveKit");

    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

    // Create transcription file setup
    const transcriptsDir = './transcripts';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const roomName = ctx.room.name || 'unknown-room';
    const transcriptFile = path.join(transcriptsDir, `${roomName}_${timestamp}.txt`);

    // Ensure transcripts directory exists
    if (!existsSync(transcriptsDir)) {
      await mkdir(transcriptsDir, { recursive: true });
    }

    // Initialize transcript file with header
    const header = `=== TRANSCRIPT ===
Room: ${roomName}
Started: ${new Date().toLocaleString()}
=====================================

`;
    await writeFile(transcriptFile, header);
    console.log(`📝 Transcript will be saved to: ${transcriptFile}`);

    // Track participants and their transcripts
    const participantTranscripts = new Map();

    const saveToFile = async (text, isFinal, trackSid) => {
      try {
        const timestamp = new Date().toLocaleTimeString();

        if (isFinal) {
          // Only save final transcripts to avoid duplicates
          const entry = `[${timestamp}] Speaker ${trackSid.slice(-4)}: ${text}\n`;
          await appendFile(transcriptFile, entry);
          console.log(`💾 Saved to file: "${text}"`);

          // Also maintain full transcript in memory
          if (!participantTranscripts.has(trackSid)) {
            participantTranscripts.set(trackSid, []);
          }
          participantTranscripts.get(trackSid).push({
            timestamp: new Date(),
            text: text
          });
        }
      } catch (error) {
        console.error('❌ Error saving transcript:', error);
      }
    };

    const transcribeTrack = async (track) => {
      console.log(`🎤 Attempting to transcribe track: ${track.sid}`);

      // Wait a bit for the track to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const audioStream = new AudioStream(track);

      const dgConnection = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        punctuate: true,
        interim_results: true,
        endpointing: 300,
        utterance_end_ms: 1000,
        vad_events: true,
        // Audio format specifications for LiveKit audio
        encoding: "linear16",
        sample_rate: 48000,
        channels: 1,
      });

      let isConnectionOpen = false;
      let pumpingAudio = false;

      dgConnection.on(LiveTranscriptionEvents.Open, () => {
        console.log("✅ Deepgram connection opened.");
        isConnectionOpen = true;

        // Start pumping audio after connection is confirmed open
        if (!pumpingAudio) {
          pumpingAudio = true;
          pump();
        }
      });

      const pump = async () => {
        try {
          console.log(`🔄 Starting audio pump for track: ${track.sid}`);
          let frameCount = 0;

          for await (const frame of audioStream) {
            frameCount++;

            // Log first few frames to verify we're getting audio
            if (frameCount <= 3) {
              console.log(`📦 Frame ${frameCount}: ${frame.data.length} bytes`);
            }

            // Log every 100 frames to monitor ongoing activity
            if (frameCount % 100 === 0) {
              console.log(`🔄 Processed ${frameCount} frames so far...`);
            }

            if (isConnectionOpen && dgConnection.getReadyState() === 1) {
              dgConnection.send(frame.data);
            } else if (dgConnection.getReadyState() === 3) {
              // Connection closed
              console.log("🚪 Deepgram connection closed, stopping audio pump");
              break;
            }
          }

          console.log(`🏁 Audio stream finished for track: ${track.sid} (${frameCount} frames processed)`);

          // Only finish if connection is still open
          if (isConnectionOpen && dgConnection.getReadyState() === 1) {
            dgConnection.finish();
          }
        } catch (err) {
          console.error("❌ Error pumping audio:", err);
          if (isConnectionOpen) {
            dgConnection.finish();
          }
        } finally {
          pumpingAudio = false;
        }
      };

      dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
        try {
          const text = data.channel.alternatives[0].transcript;
          if (text) {
            console.log("📢 Transcription:", `"${text}"`, `(Final: ${data.is_final})`);

            // Save to file (only final transcripts)
            saveToFile(text, data.is_final, track.sid);

            const payload = JSON.stringify([{
              id: data.metadata?.request_id || Math.random().toString(36).substring(7),
              text: text,
              final: data.is_final,
              timestamp: Date.now(),
            }]);

            // Use the correct method to publish data with options
            ctx.room.localParticipant.publishData(
              new TextEncoder().encode(payload),
              { reliable: true, destinationSids: [] }
            );
          }
        } catch (err) {
          console.error("❌ Error processing transcript:", err);
        }
      });

      dgConnection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error("❌ Deepgram Error:", err);
        isConnectionOpen = false;
      });

      dgConnection.on(LiveTranscriptionEvents.Close, (closeEvent) => {
        console.log("🚪 Deepgram connection closed:", closeEvent);
        isConnectionOpen = false;
      });
    };

    // Handle room disconnection - save final summary
    ctx.room.on('disconnected', async () => {
      try {
        const footer = `\n=====================================
Session ended: ${new Date().toLocaleString()}
Total speakers: ${participantTranscripts.size}
=====================================`;

        await appendFile(transcriptFile, footer);
        console.log(`📝 Transcript session ended. File saved: ${transcriptFile}`);
      } catch (error) {
        console.error('❌ Error saving final transcript:', error);
      }
    });

    ctx.room.on(RoomEvent.TrackSubscribed, (track) => {
      console.log(`📥 Track subscribed: ${track.sid}, kind: ${track.kind}, source: ${track.source}`);
      if (track.kind === TrackKind.KIND_AUDIO) {
        transcribeTrack(track);
      }
    });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));