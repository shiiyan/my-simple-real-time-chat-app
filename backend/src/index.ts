import bodyParser from "body-parser";
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

let messages: Message[] = [];
let subscribers: Subscriber[] = [];

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
  messages.push(message);
  subscribers.forEach((subscriber) => subscriber.res.json(message));
  subscribers = [];
  res.status(204).end();
});

app.get("/messages", (req: Request, res: Response) => {
  if (messages.length > 0) {
    res.json(messages);
    messages = [];
  } else {
    subscribers.push({ clientId: (req as LongPollRequest).clientId, res });
  }
});

app.delete("/messages", (req: Request, res: Response) => {
  subscribers = subscribers.filter(
    (subscriber) => subscriber.clientId !== (req as LongPollRequest).clientId
  );
  res.status(204).end();
});

const PORT: number = parseInt(process.env.PORT as string, 10) || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
