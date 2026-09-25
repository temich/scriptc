import { createServer, get } from "node:http";

const server = createServer((_request, response) => {
  response.flushHeaders();
  setTimeout(() => { response.end("late"); }, 120);
});

server.listen(0, () => {
  get({ port: server.address().port }, (response) => {
    response.setTimeout(15, () => { console.log("timed out", response.complete); });
    let body = "";
    response.on("data", (chunk: Buffer) => { body += chunk.toString("utf8"); });
    response.on("end", () => {
      console.log("body", body, response.complete);
      server.close();
    });
  });
});
