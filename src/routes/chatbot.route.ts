import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { sendChatMessage } from '../controllers/chatbot.controller.js';

const chatbotRouter = express.Router();

chatbotRouter.post('/', authenticateToken, sendChatMessage);


export { chatbotRouter };