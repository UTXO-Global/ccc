import { ccc } from "@ckb-ccc/core";
import { Provider } from "./advancedBarrel";
import { BTCSigner } from "./signer";

export function getUtxoGlobalSigner(client: ccc.Client): BTCSigner | undefined {
  const windowRef = window as { utxoGlobal?: Provider };

  if (typeof windowRef.utxoGlobal === "undefined") {
    return;
  }

  return new BTCSigner(client, windowRef.utxoGlobal);
}