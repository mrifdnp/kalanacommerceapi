import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { sendChatMessage, sendChatTrial } from '../controllers/chatbot.controller.js';

const chatbotRouter = express.Router();

chatbotRouter.post('/', authenticateToken, sendChatMessage);
chatbotRouter.post('/trial', sendChatTrial);

export { chatbotRouter };