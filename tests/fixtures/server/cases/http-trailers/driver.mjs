import { connect } from "node:net";

const port = Number(process.argv[2]);

function exchange(path, body = "") {
  return new Promise((resolve, reject) => {
    let wire = "";
    const socket = connect(port, "127.0.0.1", () => {
      const headers = [
        `${body ? "POST" : "GET"} ${path} HTTP/1.1`,
        "Host: test",
        "Connection: close",
        ...(body ? ["X-Head: one", "X-Head: two", "Transfer-Encoding: chunked", "Trailer: X-Note, Cookie, Authorization"] : []),
        "",
        "",
      ].join("\r\n");
      socket.write(headers + body);
    });
    socket.on("data", (chunk) => { wire += chunk.toString("latin1"); });
    socket.on("end", () => resolve(wire));
    socket.on("error", reject);
    socket.setTimeout(5000, () => reject(new Error(`timeout on ${path}`)));
  });
}

function summarize(path, wire) {
  const split = wire.indexOf("\r\n\r\n");
  const head = wire.slice(0, split);
  const body = wire.slice(split + 4);
  const status = head.split("\r\n")[0];
  console.log(`${path} ${status} chunked=${/Transfer-Encoding: chunked/i.test(head)} length=${/Content-Length: 2/i.test(head)} wire=${body.replaceAll("\r\n", "|")}`);
}

const chunked = "4\r\ndata\r\n0\r\nX-Note: first\r\nx-NoTe: second\r\nCookie: a=1\r\ncookie: b=2\r\nAuthorization: first\r\nAuthorization: second\r\n\r\n";
for (const [path, body] of [["/incoming", chunked], ["/fixed", ""], ["/replace", ""], ["/explicit", ""], ["/declared", ""], ["/invalid-framing", ""], ["/invalid", ""], ["/quit", ""]]) {
  summarize(path, await exchange(path, body));
}
console.log("driver done");
