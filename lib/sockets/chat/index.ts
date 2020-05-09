import { Server } from 'socket.io';

interface UserMessage {
    body: string;
    owner: string;
}

interface Chat {
    user1: string;
    user2: string;
    messages: UserMessage[];
}

interface User {
    id: string;
    socketId: string;
}

interface Message {
    receiver: string;
    sender: string;
    body: string;
}

interface OutComingMessage {
    contact: string;
    body: string;
    owner: string;
}

interface ChatListPayload {
    userId: string;
}

interface CreateChatPayload {
    userId: string;
    receiverId: string;
}

interface JoinPayload {
    userId: string;
}

type AddMessagePayload = Message;

interface LeaveChatPayload {
    userId: string;
}

export class ChatSocket {
    users: User[];
    chatList: Chat[];
    io: Server;

    constructor(socket: Server) {
        this.chatList = [{
            user1: 'foo',
            user2: 'bar',
            messages: [],
        }];
        this.users = [];
        this.io = socket;
    }

    socketEvents() {
        this.io.on('connection', async (socket) => {
            socket.on('join', async ({ userId }: JoinPayload) => {
                this.users.push({
                    id: userId,
                    socketId: socket.id,
                });

                this.io.to(socket.id).emit('join-response', { status: 'Success!' });
            });

            socket.on('chat-list', async ({ userId }: ChatListPayload) => {
                const chatList = this.chatList
                    .filter(chat => chat.user1 === userId || chat.user2 === userId)
                    .map(chat => ({
                        contact: chat.user1 === userId ? chat.user2 : chat.user1,
                        messages: chat.messages,
                    }));

                this.io.to(socket.id).emit('chat-list-response', chatList);
            });

            socket.on('create-chat', async ({ userId, receiverId }: CreateChatPayload) => {
                const indexOfChat = this.chatList.findIndex(chat =>
                    (chat.user1 === userId && chat.user2 === receiverId) ||
                    (chat.user1 === receiverId && chat.user1 === userId));

                if (indexOfChat === -1) {
                    const newChat: Chat = {
                        user1: userId,
                        user2: receiverId,
                        messages: [],
                    };

                    this.chatList.push(newChat);
                }

                const sender = this.users.find(user => user.id === userId);

                if (sender) {
                    this.io.to(sender.socketId).emit('create-chat-response', {
                        contact: receiverId,
                        messages: [],
                    });
                }
            });

            socket.on('add-message', async (message: AddMessagePayload) => {
                const chatExists = this.chatList.some(chat =>
                    (chat.user1 === message.receiver &&
                    chat.user2 === message.sender) ||
                    (chat.user1 === message.sender &&
                    chat.user2 === message.receiver));

                let createdChat: Chat | undefined = undefined;
                let hasMessages: boolean = true;

                if (chatExists) {
                    this.chatList = this.chatList.map(chat => {
                        if ((chat.user1 === message.receiver &&
                            chat.user2 === message.sender) ||
                            (chat.user1 === message.sender &&
                            chat.user2 === message.receiver)) {
                            hasMessages = chat.messages.length > 0;
                            createdChat = {
                                ...chat,
                                messages: [...chat.messages, {
                                    body: message.body,
                                    owner: message.sender,
                                }],
                            };

                            return createdChat;
                        }

                        return chat;
                    });
                } else {
                    createdChat = {
                        user1: message.receiver,
                        user2: message.sender,
                        messages: [{
                            body: message.body,
                            owner: message.sender,
                        }],
                    };

                    this.chatList.push(createdChat);
                }

                const receiver = this.users.find(user => user.id === message.receiver);
                const sender = this.users.find(user => user.id === message.sender);

                if (receiver && chatExists && hasMessages) {
                    const outComingMessage: OutComingMessage = {
                        body: message.body,
                        contact: message.sender,
                        owner: message.sender,
                    };

                    this.io.to(receiver.socketId).emit('add-message-response', {
                        status: 'Received!',
                        data: outComingMessage,
                    });
                }

                if (sender) {
                    const outComingMessage: OutComingMessage = {
                        body: message.body,
                        contact: message.receiver,
                        owner: message.sender,
                    };

                    this.io.to(sender.socketId).emit('add-message-response', {
                        status: 'Sent!',
                        data: outComingMessage,
                    });
                }

                if (receiver && chatExists && createdChat && !hasMessages) {
                    this.io.to(receiver.socketId).emit('create-chat-response', {
                        contact: message.sender,
                        messages: createdChat.messages,
                    });
                }
            });

            socket.on('disconnect', async () => {
                this.users = this.users.filter(user => user.socketId !== socket.id);
            });
        });
    }

    socketConfig() {
        // this.io.use(async (socket, next) => {
        //     const userId = socket.request._query.userId;

        //     this.users.push({
        //         id: userId,
        //         socketId: socket.id,
        //     });

        //     next();
        // });

        this.socketEvents();
    }
}
