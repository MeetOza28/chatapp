import { relations } from "drizzle-orm/relations";
import { user, account, room, message, session, roomMember } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	rooms: many(room),
	messages: many(message),
	sessions: many(session),
	roomMembers: many(roomMember),
}));

export const roomRelations = relations(room, ({one, many}) => ({
	user: one(user, {
		fields: [room.ownerId],
		references: [user.id]
	}),
	messages: many(message),
	roomMembers: many(roomMember),
}));

export const messageRelations = relations(message, ({one}) => ({
	room: one(room, {
		fields: [message.roomId],
		references: [room.id]
	}),
	user: one(user, {
		fields: [message.senderId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const roomMemberRelations = relations(roomMember, ({one}) => ({
	room: one(room, {
		fields: [roomMember.roomId],
		references: [room.id]
	}),
	user: one(user, {
		fields: [roomMember.userId],
		references: [user.id]
	}),
}));