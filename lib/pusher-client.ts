import Pusher from "pusher-js";

// Only instantiate on the browser — Pusher requires window
const pusherClient =
  typeof window !== "undefined"
    ? new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      })
    : (null as unknown as InstanceType<typeof Pusher>);

export default pusherClient;
