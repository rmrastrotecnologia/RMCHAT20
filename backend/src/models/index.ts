// Global types and interfaces for D1-based models

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  profile: "admin" | "agent" | "manager";
  companyId: number;
  online: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: number;
  name: string;
  planId?: number;
  subscriptionId?: string;
  status: "active" | "inactive" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

export interface Queue {
  id: number;
  name: string;
  companyId: number;
  color?: string;
  greetingMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: number;
  name: string;
  number: string;
  email?: string;
  companyId: number;
  profilePicUrl?: string;
  acceptAudioMessage: boolean;
  acceptAudioMessageGroupsIds?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Whatsapp {
  id: number;
  name: string;
  token: string;
  status: "qr" | "connected" | "disconnected";
  qrcode?: string;
  companyId: number;
  userId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: number;
  uuid: string;
  status: "open" | "closed" | "pending" | "resolved";
  contactId: number;
  userId?: number;
  whatsappId: number;
  companyId: number;
  queueId?: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: number;
  uuid: string;
  ticketId: number;
  contactId: number;
  body?: string;
  fromMe: boolean;
  mediaType?: string;
  mediaUrl?: string;
  status: "sent" | "received" | "read" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type TokenPayload = {
  id: number;
  email: string;
  companyId: number;
  profile: string;
};
