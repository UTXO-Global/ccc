import { ccc } from "@ckb-ccc/core";
import { Provider } from "./advancedBarrel";
import { UtxoGlobalSigner } from "./signer";

export function getUtxoGlobalSigner(client: ccc.Client): UtxoGlobalSigner | undefined {
  const windowRef = window as { utxoGlobal?: Provider };

  if (typeof windowRef.utxoGlobal === "undefined") {
    return;
  }

  // TODO
  // Currently only supports CKB, waiting for utxo wallet 
  // to support network switch and separate providers for CKB and BTC
  
  return new UtxoGlobalSigner(client, windowRef.utxoGlobal);
}