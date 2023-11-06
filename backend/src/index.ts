import bodyParser from "body-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { Redis } from "ioredis";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const redis = new Redis();

interface Message {
  clientId: string;
  text: string;
}

interface LongPollRequest extends Request {
  clientId: string;
}

interface Subscriber {
  clientId: string;
  res: Response;
}

let unfetchedMessages: Message[] = [];
let pollingSubscribers: Subscriber[] = [];

app.use((req: Request, res: Response, next: NextFunction) => {
  const clientId = req.get("X-Client-ID");
  if (!clientId) {
    res.status(400).send("Client ID is required");
    return;
  }

  (req as LongPollRequest).clientId = clientId;
  next();
});

app.post("/messages", async (req: Request, res: Response) => {
  const message: Message = {
    ...req.body,
    clientId: (req as LongPollRequest).clientId,
  };
  await redis.lpush("messages", JSON.stringify(message));
  // pub/sub logic
  pollingSubscribers.forEach((subscriber) => {
    subscriber.res.json([message]);
    unfetchedMessages = unfetchedMessages.filter(
      (unfetchedMessages) => unfetchedMessages !== message
    );
  });
  pollingSubscribers = [];
  res.status(204).end();
});

app.get("/messages", async (req: Request, res: Response) => {
  const messageStrings: string[] = await redis.lrange("messages", 0, -1);
  const messages: Message[] = messageStrings.map((message) =>
    JSON.parse(message)
  );
  if (messages.length > 0) {
    await redis.del("messages");
    res.json(messages);
  } else {
    pollingSubscribers.push({
      clientId: (req as LongPollRequest).clientId,
      res,
    });
  }
});

// app.delete("/messages", (req: Request, res: Response) => {
//   const clientId = (req as LongPollRequest).clientId;
//   const index = pollingSubscribers.findIndex(
//     (subscriber) => subscriber.clientId === clientId
//   );
//   if (index !== -1) {
//     pollingSubscribers[index].res.status(204).end();
//     pollingSubscribers.splice(index, 1);
//   }

//   res.status(204).end();
// });

const PORT: number = parseInt(process.env.PORT as string, 10) || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
