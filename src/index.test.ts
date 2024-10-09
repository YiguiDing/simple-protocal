import { SimpleProtocalParser } from "./index";

function test() {
  let parser = new SimpleProtocalParser();
  let data = [0x01, 0x02, 0x03, 0x7d, 0x55, 0xaa];
  let encoded = parser.encoder(data);
  let decoded: number[] | null = null;

  console.log("Encoded:", Buffer.from(encoded));
  for (let byte of encoded) {
    decoded = parser.decoder(byte);
    if (decoded) console.log("Decoded:", Buffer.from(decoded));
  }
}

test();
