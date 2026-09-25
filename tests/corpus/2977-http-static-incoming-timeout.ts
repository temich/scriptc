import { createServer, get } from "node:http";

let releaseResponse: (() => void) | undefined;
let timedOut = false;
const server = createServer((_request, response) => {
  response.flushHeaders();
  const fallback = setTimeout(() => { response.end("late"); }, 2000);
  releaseResponse = () => { clearTimeout(fallback); response.end("late"); };
  if (timedOut) releaseResponse();
});

server.listen(0, () => {
  get({ port: server.address().port }, (response) => {
    response.setTimeout(15, () => {
      console.log("timed out", response.complete);
      timedOut = true;
      if (releaseResponse) releaseResponse();
    });
    let body = "";
    response.on("data", (chunk: Buffer) => { body += chunk.toString("utf8"); });
    response.on("end", () => {
      console.log("body", body, response.complete);
      server.close();
    });
  });
});
