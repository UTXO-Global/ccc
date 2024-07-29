import blake2b from "blake2b";
import { BytesLike } from "../../bytes";
import { hexFrom } from "../../hex";
import { ecdsaVerify } from "secp256k1";

const PERSONAL = new Uint8Array([99, 107, 98, 45, 100, 101, 102, 97, 117, 108, 116, 45, 104, 97, 115, 104])
export function verifyMessageUtxoGlobal(
  message: string | BytesLike,
  signature: string,
  publicKey: string,
): boolean {
  const challenge = typeof message === "string" ? message : hexFrom(message).slice(2);
  
  
  const encoder = new TextEncoder();
  const _message = encoder.encode(challenge as string);

  const messageHash = blake2b(16, undefined, undefined, PERSONAL).update(_message).digest("hex");
  const _messageHash = encoder.encode(messageHash as string);

  const pubKeyHash = Buffer.from(publicKey, 'hex');
  const _signature = Buffer.from(signature as string, 'hex');
  const result = ecdsaVerify(_signature, _messageHash, pubKeyHash);
  return result;
}
