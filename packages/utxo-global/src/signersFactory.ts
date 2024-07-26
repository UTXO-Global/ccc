import { SignerInfo, ccc } from "@ckb-ccc/core";
import { Provider } from "./advancedBarrel";
import { UtxoGlobalCKBSigner } from "./ckb";
import { UtxoGlobalBTCSigner } from "./btc";

export function getUtxoGlobalSigners(
  client: ccc.Client
): SignerInfo[] | undefined {
  
  const windowRef = window as { 
    utxoGlobal?: {
      bitcoinSigner: Provider,
      ckbSigner: Provider,
    }
  };

  if (typeof windowRef.utxoGlobal === "undefined") {
    return;
  }

  // TODO
  // Currently only supports CKB, waiting for utxo wallet 
  // to support network switch and separate providers for CKB and BTC
  
  return [
    {
      name: "CKB",
      signer: new UtxoGlobalCKBSigner(client, windowRef.utxoGlobal.ckbSigner),
    },
    {
      name: "BTC",
      signer: new UtxoGlobalBTCSigner(client, windowRef.utxoGlobal.bitcoinSigner)
    }
  ]
}