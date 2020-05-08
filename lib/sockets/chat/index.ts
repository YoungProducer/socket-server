import { Server } from 'socket.io';

interface Chat {
    receiver: string;
    sender: string;
    messages: string[];
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

interface ChatListPayload {
    userId: string;
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
            receiver: 'foo',
            sender: 'bar',
            messages: ['123'],
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
                    .filter(chat => chat.receiver === userId)
                    .map(chat => ({
                        sender: chat.sender,
                        messages: chat.messages,
                    }));

                this.io.to(socket.id).emit('chat-list-response', chatList);
            });

            socket.on('add-message', async (message: AddMessagePayload) => {
                const messageExist = this.chatList.some(chat =>
                    chat.receiver === message.receiver &&
                    chat.sender === message.sender);

                if (messageExist) {
                    this.chatList = this.chatList.map(chat => {
                        if (chat.receiver === message.receiver &&
                            chat.sender === message.sender) {
                            return {
                                ...chat,
                                messages: [...chat.messages, message.body],
                            };
                        }

                        return chat;
                    });
                } else {
                    this.chatList.push({
                        receiver: message.receiver,
                        sender: message.sender,
                        messages: [message.body],
                    });
                }

                const receiverSocketId = this.users.find(user => user.id === message.receiver);

                if (receiverSocketId) {
                    this.io.emit('add-message-response', message);
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
