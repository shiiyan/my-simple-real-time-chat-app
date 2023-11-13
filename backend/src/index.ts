import bodyParser from "body-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { Redis } from "ioredis";

const app = express();
app.use(bodyParser.json());
app.use(cors());

interface Message {
  clientId: string;
  text: string;
  posted: number;
}

interface LongPollRequest extends Request {
  clientId: string;
}

interface PollingSubscriber {
  clientId: string;
  res: Response;
}

let pollingSubscribers: PollingSubscriber[] = [];

const redisClient = new Redis();
const messageChannel = "newMessageChannel";
const messageKey = "chatMessages";

const redisSubscriber = new Redis();
redisSubscriber.subscribe(messageChannel);
redisSubscriber.on("message", (channel: string, message: string) => {
  const parsedMessage = JSON.parse(message);
  pollingSubscribers.forEach((pollingSubscriber: PollingSubscriber) => {
    pollingSubscriber.res.json([parsedMessage]);
  });
  pollingSubscribers = [];
});

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
  const posted = Date.now();
  const message: Message = {
    ...req.body,
    clientId: (req as LongPollRequest).clientId,
    posted,
  };
  const messageString = JSON.stringify(message);
  await redisClient.zadd(messageKey, posted.toString(), messageString);
  redisClient.expire(messageKey, 3600 * 24); // Set TTL of 1 day
  redisClient.publish(messageChannel, messageString);
  res.status(204).end();
});

app.get("/messages", async (req: Request, res: Response) => {
  const lastFetched: string = <string>req.query.lastFetched || "-inf";
  const messageStrings: string[] = await redisClient.zrangebyscore(
    messageKey,
    `(${lastFetched}`,
    "+inf"
  );
  const messages: Message[] = messageStrings.map((message: string) =>
    JSON.parse(message)
  );
  if (messages.length > 0) {
    res.json(messages);
  } else {
    pollingSubscribers.push({
      clientId: (req as LongPollRequest).clientId,
      res,
    });

    req.on("close", () => {
      pollingSubscribers = pollingSubscribers.filter(
        (sub) => sub.clientId !== (req as LongPollRequest).clientId
      );
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
