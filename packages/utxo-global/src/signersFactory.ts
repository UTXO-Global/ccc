import { ccc } from "@ckb-ccc/core";
import { Provider } from "./advancedBarrel";
import { SignerCkb } from "./ckb";
import { SignerBtc } from "./btc";

export function getUtxoGlobalSigners(
  client: ccc.Client
): ccc.SignerInfo[] | undefined {
  
  const windowRef = window as { 
    utxoGlobal?: {
      bitcoinSigner: Provider,
      ckbSigner: Provider,
    }
  };

  if (typeof windowRef.utxoGlobal === "undefined") {
    return;
  }
  
  return [
    {
      name: "CKB",
      signer: new SignerCkb(client, windowRef.utxoGlobal.ckbSigner),
    },
    {
      name: "BTC",
      signer: new SignerBtc(client, windowRef.utxoGlobal.bitcoinSigner)
    }
  ]
}