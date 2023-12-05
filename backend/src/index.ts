import * as bcrypt from "bcrypt";
import bodyParser from "body-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { Redis } from "ioredis";
import * as jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(bodyParser.json());
app.use(cors());

interface LongPollRequest extends Request {
  clientId: string;
}

interface AuthenticatedRequest extends LongPollRequest {
  user: {
    username: string;
  };
}

interface Message {
  text: string;
  username: string;
  clientId: string;
  posted: number;
}

interface PollingSubscriber {
  clientId: string;
  res: Response;
}

let pollingSubscribers: PollingSubscriber[] = [];

const redisClient = new Redis(process.env.REDISCLOUD_URL as string);
const messageChannel = "newMessageChannel";
const messageKey = "messages";
const userKey = "users";

// TODO: set JWT_SECRET in env
const JWT_SECRET = "my_jwt_secret";

const redisSubscriber = new Redis(process.env.REDISCLOUD_URL as string);
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

app.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const userString = await redisClient.get(`${userKey}:${username}`);
  const user = userString ? JSON.parse(userString) : null;
  if (user === null) {
    return res.status(401).send("Invalid credentials");
  }

  const result = await bcrypt.compare(password, user.password);
  if (!result) {
    return res.status(401).send("Invalid credentials");
  }

  const token = jwt.sign({ username: user.username }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ token });
});

// validating JWT for all auth-required routes below this middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ message: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    if (!decoded || typeof decoded === "string") {
      return res.status(403).json({ message: "Invalid token" });
    }

    (req as AuthenticatedRequest).user = { username: decoded.username };
    next();
  });
});

app.post("/messages", async (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;

  const posted = Date.now();
  const messageId: string = `${messageKey}:${uuidv4()}`;
  const message: Message = {
    text: authenticatedReq.body.message,
    username: authenticatedReq.user.username,
    clientId: authenticatedReq.clientId,
    posted,
  };
  const messageString = JSON.stringify(message);
  const expirationTime = 7 * 24 * 60 * 60;

  await Promise.all([
    redisClient.set(messageId, messageString, "EX", expirationTime),
    redisClient.zadd(messageKey, posted.toString(), messageId),
  ]);

  redisClient.publish(messageChannel, messageString);
  res.status(204).end();
});

app.get("/messages", async (req: Request, res: Response) => {
  const lastFetched: string = <string>req.query.lastFetched || "-inf";
  const messageIds: string[] = await redisClient.zrangebyscore(
    messageKey,
    `(${lastFetched}`,
    "+inf"
  );
  const messages: Message[] = (
    await Promise.all(
      messageIds.map((messageId: string) => redisClient.get(messageId))
    )
  )
    .filter(
      (messageString: string | null): messageString is string =>
        messageString !== null
    )
    .map((messageString: string) => JSON.parse(messageString));

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
