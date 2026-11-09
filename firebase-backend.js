import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { get, getDatabase, onValue, ref, runTransaction } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const configured = Object.values(firebaseConfig).every(value => typeof value === "string" && value.trim());
const backend = {
  configured,
  ready: Promise.resolve(false),
  getRoom: async () => { throw new Error("Firebase is not configured."); },
  saveRoom: async () => { throw new Error("Firebase is not configured."); },
  leaveRoom: async () => { throw new Error("Firebase is not configured."); },
  watchRoom: () => { throw new Error("Firebase is not configured."); }
};

window.tinssPartyBackend = backend;

if (configured) {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);

    backend.ready = signInAnonymously(auth).then(() => true);
    backend.ready.catch(error => console.error("Firebase party sign-in failed.", error));

    backend.getRoom = async code => {
      await backend.ready;
      const snapshot = await get(ref(database, `partyRooms/${code}`));
      return snapshot.exists() ? snapshot.val() : null;
    };

    backend.saveRoom = async (room, playerId) => {
      await backend.ready;
      const roomRef = ref(database, `partyRooms/${room.code}`);
      const result = await runTransaction(roomRef, current => {
        if (!current) return room;

        const isHost = current.hostId === playerId;
        const startsRace = isHost && current.status !== "racing" && room.status === "racing";
        const changesText = isHost && current.text !== room.text;
        let players;

        if (startsRace || changesText) {
          players = room.players;
        } else {
          players = Array.isArray(current.players) ? [...current.players] : [];
          const updatedPlayer = room.players.find(player => player.id === playerId);
          if (updatedPlayer) {
            const index = players.findIndex(player => player.id === playerId);
            if (index === -1) players.push(updatedPlayer);
            else players[index] = { ...players[index], ...updatedPlayer };
          }
        }

        const status = current.status === "finished" || room.status === "finished"
          ? "finished"
          : isHost ? room.status : current.status;

        const updatedRoom = {
          ...current,
          ...(isHost ? { difficulty: room.difficulty, hostId: room.hostId, text: room.text } : {}),
          status,
          ...(isHost && Number.isFinite(room.startedAt) ? { startedAt: room.startedAt } : {}),
          players
        };
        if (isHost && room.status === "lobby") delete updatedRoom.startedAt;
        return updatedRoom;
      });

      if (!result.committed) throw new Error("Firebase did not save the party room.");
    };

    backend.leaveRoom = async (code, playerId) => {
      await backend.ready;
      const roomRef = ref(database, `partyRooms/${code}`);
      const result = await runTransaction(roomRef, current => {
        if (!current || !Array.isArray(current.players)) return;
        const players = current.players.filter(player => player.id !== playerId);
        if (!players.length) return null;
        return {
          ...current,
          hostId: current.hostId === playerId ? players[0].id : current.hostId,
          players
        };
      });

      if (!result.committed) {
        const snapshot = await get(roomRef);
        if (snapshot.exists()) throw new Error("Firebase did not remove the party player.");
      }
    };

    backend.watchRoom = (code, onRoom, onError) => {
      return onValue(ref(database, `partyRooms/${code}`), snapshot => {
        onRoom(snapshot.exists() ? snapshot.val() : null);
      }, onError);
    };
  } catch (error) {
    backend.ready = Promise.reject(error);
    backend.ready.catch(reason => console.error("Firebase party setup failed.", reason));
  }
}
