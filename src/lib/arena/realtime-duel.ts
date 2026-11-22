import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface FlashBlitzPulsePayload {
  sender: string;
  round: number;
  score: number;
}

export interface FlashBlitzConnection {
  transport: "supabase_realtime" | "simulated_match";
  sendPulse: (payload: FlashBlitzPulsePayload) => void;
  disconnect: () => void;
}

export function connectFlashBlitzChannel(
  roomCode: string,
  playerName: string,
  onRemotePulse: (payload: FlashBlitzPulsePayload) => void,
): FlashBlitzConnection {
  if (!isSupabaseConfigured()) {
    return {
      transport: "simulated_match",
      sendPulse: () => {},
      disconnect: () => {},
    };
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`flash-blitz:${roomCode}`, {
      config: {
        presence: { key: playerName },
      },
    });

    channel
      .on("broadcast", { event: "round_pulse" }, ({ payload }) => {
        if (
          payload &&
          typeof payload === "object" &&
          "sender" in payload &&
          payload.sender !== playerName
        ) {
          onRemotePulse(payload as FlashBlitzPulsePayload);
        }
      })
      .subscribe();

    return {
      transport: "supabase_realtime",
      sendPulse: (payload) => {
        void channel.send({
          type: "broadcast",
          event: "round_pulse",
          payload,
        });
      },
      disconnect: () => {
        void supabase.removeChannel(channel);
      },
    };
  } catch {
    return {
      transport: "simulated_match",
      sendPulse: () => {},
      disconnect: () => {},
    };
  }
}
