import { Server } from 'socket.io';

interface Chat {
    user1: string;
    user2: string;
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
            user1: 'foo',
            user2: 'bar',
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
                    .filter(chat => chat.user1 === userId || chat.user2 === userId)
                    .map(chat => ({
                        contact: chat.user1 === userId ? chat.user2 : chat.user1,
                        messages: chat.messages,
                    }));

                this.io.to(socket.id).emit('chat-list-response', chatList);
            });

            socket.on('add-message', async (message: AddMessagePayload) => {
                const messageExist = this.chatList.some(chat =>
                    (chat.user1 === message.receiver &&
                    chat.user2 === message.sender) ||
                    (chat.user1 === message.sender &&
                    chat.user2 === message.receiver));

                if (messageExist) {
                    this.chatList = this.chatList.map(chat => {
                        if ((chat.user1 === message.receiver &&
                            chat.user2 === message.sender) ||
                            (chat.user1 === message.sender &&
                            chat.user2 === message.receiver)) {
                            return {
                                ...chat,
                                messages: [...chat.messages, message.body],
                            };
                        }

                        return chat;
                    });
                } else {
                    this.chatList.push({
                        user1: message.receiver,
                        user2: message.sender,
                        messages: [message.body],
                    });
                }

                const receiver = this.users.find(user => user.id === message.receiver);

                if (receiver) {
                    console.log(receiver);
                    this.io.to(receiver.socketId).emit('add-message-response', message);
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
