import bodyParser from "body-parser";
import { subscribe } from "diagnostics_channel";
import express, { NextFunction, Request, Response } from "express";

const app = express();
app.use(bodyParser.json());

interface Message {
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

app.post("/messages", (req: Request, res: Response) => {
  const message: Message = req.body;
  unfetchedMessages.push(message);
  pollingSubscribers.forEach((subscriber) => {
    subscriber.res.json(message);
    unfetchedMessages = unfetchedMessages.filter(
      (persistedMessage) => persistedMessage !== message
    );
  });
  pollingSubscribers = [];
  res.status(204).end();
});

app.get("/messages", (req: Request, res: Response) => {
  if (unfetchedMessages.length > 0) {
    res.json(unfetchedMessages);
    unfetchedMessages = [];
  } else {
    pollingSubscribers.push({
      clientId: (req as LongPollRequest).clientId,
      res,
    });
  }
});

app.delete("/messages", (req: Request, res: Response) => {
  const clientId = (req as LongPollRequest).clientId;
  const index = pollingSubscribers.findIndex(
    (subscriber) => subscriber.clientId === clientId
  );
  if (index !== -1) {
    pollingSubscribers[index].res.status(204).end();
    pollingSubscribers.splice(index, 1);
  }

  res.status(204).end();
});

const PORT: number = parseInt(process.env.PORT as string, 10) || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
