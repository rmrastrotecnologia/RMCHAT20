import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import { startQueueProcess } from "./queues";
import { TransferTicketQueue } from "./wbotTransferTicketQueue";
import cron from "node-cron";

// Mantemos a lógica de inicialização, mas adaptada
const startServer = async () => {
  const companies = await Company.findAll();
  const allPromises: any[] = [];
  companies.map(async c => {
    const promise = StartAllWhatsAppsSessions(c.id);
    allPromises.push(promise);
  });

  await Promise.all(allPromises);
  startQueueProcess();
  logger.info(`Backend RM Boot Inicializado com sucesso`);
};

// Executa a inicialização
startServer();

// Agendador de tarefas
cron.schedule("* * * * *", async () => {
  try {
    logger.info(`Serviço de transferencia de tickets iniciado`);
    await TransferTicketQueue();
  } catch (error) {
    logger.error(error);
  }
});

// CONFIGURAÇÃO PARA CLOUDFLARE WORKERS
// Em vez de app.listen, exportamos o fetch
export default {
  async fetch(request: any, env: any, ctx: any) {
    // Passamos as variáveis de ambiente da Cloudflare para o process.env do Node
    if (env) {
      Object.keys(env).forEach((key) => {
        process.env[key] = env[key];
      });
    }
    
    // Inicia o socket se necessário (ajuste técnico para Workers)
    const server = (app as any).listen ? (app as any) : app;
    initIO(server);

    return (app as any).fetch(request, env, ctx);
  },
};