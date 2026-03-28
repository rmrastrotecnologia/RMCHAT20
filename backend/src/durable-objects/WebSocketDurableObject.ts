import { DurableObject } from "cloudflare:workers";

export class WebSocketDurableObject extends DurableObject {
  private sessions: Set<WebSocket> = new Set();
  private ticketId: string = "";

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    this.ticketId = state.id.name;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    // Handle WebSocket upgrade using WebSocketPair
    try {
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      this.state.acceptWebSocket(server as any);

      return new Response(null, { status: 101, webSocket: client as any });
    } catch (error) {
      return new Response("WebSocket instantiation failed", { status: 400 });
    }
  }

  async webSocketMessage(ws: any, message: ArrayBuffer | string) {
    try {
      if (typeof message === "string") {
        const data = JSON.parse(message);

        // Broadcast to all connected clients
        this.broadcastMessage(data);
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  }

  async webSocketClose(ws: any, code: number, reason: string, wasClean: boolean) {
    this.sessions.delete(ws);
  }

  async webSocketError(ws: any, error: any) {
    console.error("WebSocket error:", error);
    this.sessions.delete(ws);
  }

  private broadcastMessage(data: any) {
    const message = JSON.stringify({
      timestamp: new Date().toISOString(),
      ticketId: this.ticketId,
      ...data,
    });

    for (const ws of this.state.getWebSockets()) {
      try {
        (ws as any).send(message);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  }

  // Update the user status
  async updateUserStatus(userId: string, status: "online" | "offline") {
    this.broadcastMessage({
      type: "user_status",
      userId,
      status,
    });
  }

  // Get active sessions count
  getSessionCount(): number {
    return this.state.getWebSockets().length;
  }
}
