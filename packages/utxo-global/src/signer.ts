import { BytesLike, Script, Signature, SignerSignType, ccc } from "@ckb-ccc/core";
import { Provider } from "./advancedBarrel";
import { encodeToAddress } from "@ckb-lumos/helpers";
import { predefined } from "@ckb-lumos/config-manager";

export class UtxoGlobalSigner extends ccc.Signer {
  
  get type(): ccc.SignerType {
    return ccc.SignerType.CKB;
  }

  /**
   * Gets the sign type.
   * @returns {ccc.SignerSignType} The sign type.
   */
  get signType(): ccc.SignerSignType {
    return ccc.SignerSignType.UtxoGlobalCKB;
  }

  constructor(
    client: ccc.Client,
    public readonly provider: Provider,
  ) {
    super(client);
  }

  async isCKBNetwork() {
    const address = await this.getInternalAddress();
    return address.startsWith("ckb") || address.startsWith("ckt");
  }

  getInternalAddress(): Promise<string> {
    return this.getAccount()
  }

  async getIdentity(): Promise<string> {
    return (await this.getPublicKey()).slice(2);
  }

  async getAddressObj(): Promise<ccc.Address | undefined> {
    const address = await this.getInternalAddress();
    return await ccc.Address.fromString(address, this.client);
  }

  async getAddressObjs(): Promise<ccc.Address[]> {
    const address = await this.getAddressObj()
    if (!!address) { 
      return [address]
    }
    return []
  }

  async getAccount() {
    const accounts = await this.provider.getAccount();
    return accounts[0];
  }

  async getPublicKey(): Promise<ccc.Hex> {
    const pubKeys = await this.provider.getPublicKey();
    const account = await this.getAccount();
    const pubKey = pubKeys.find(_pubKey => _pubKey.address === account)
    return ccc.hexFrom(pubKey?.publicKey!);
  }

  async connect(): Promise<void> {
    await this.provider.connect();
  }

  async isConnected(): Promise<boolean> {
    return await this.provider.isConnected();
  }

  async signMessageRaw(message: string | ccc.BytesLike): Promise<string> {
    const challenge = typeof message === "string" ? message : ccc.hexFrom(message).slice(2);
    const account = await this.getAccount();
    return this.provider.signMessage(challenge, account);
  }

  async signMessage(message: ccc.BytesLike): Promise<ccc.Signature> {
    return {
      signature: await this.signMessageRaw(message),
      identity: await this.getIdentity(),
      signType: SignerSignType.UtxoGlobalCKB,
    };
  }

  async verifyMessage(
    message: string | BytesLike,
    signature: string | Signature,
  ): Promise<boolean> {
    if (typeof signature === "string") {
      return this.verifyMessageRaw(message, signature);
    }

    if (
      signature.identity !== (await this.getIdentity()) ||
      ![SignerSignType.Unknown, this.signType, SignerSignType.UtxoGlobalCKB].includes(signature.signType)
    ) {
      return false;
    }

    return this.verifyMessageRaw(message, signature.signature);
  }

  async verifyMessageRaw(message: ccc.BytesLike, signature: string | ccc.Signature): Promise<boolean> {
    if (await this.isCKBNetwork()) {
      const pubKey = await this.getPublicKey();
      return ccc.verifyMessageUtxoGlobal(message, signature as string, pubKey.slice(2))
    }
    
    return super.verifyMessage(message, signature as ccc.Signature)
  }

  async signOnlyTransaction(
    txLike: ccc.TransactionLike,
  ): Promise<ccc.Transaction> {
    // TODO: waiting utxo-wallet support sign transaction

    console.log("signOnlyTransaction txLike:", txLike)
    if (await this.isCKBNetwork()) {
      if (txLike.outputs) {
        const config = this.client.addressPrefix === "ckb" ? predefined.LINA : predefined.AGGRON4;
        const toAddress = encodeToAddress(txLike.outputs[0].lock as Script, {config})
        const toAmount = Number(txLike.outputs[0].capacity) / 10 **8;

        const rawTx = await this.provider.createTx({ to: toAddress, amount: toAmount, feeRate: 14, receiverToPayFee: false })
        const tx = JSON.parse(rawTx) as ccc.TransactionLike
        console.log("signed", tx)
        return ccc.Transaction.from(tx);
      }
    }
    return super.signOnlyTransaction(txLike)
  }

  async prepareTransaction(
    txLike: ccc.TransactionLike,
  ): Promise<ccc.Transaction> {
    const tx = ccc.Transaction.from(txLike);
    console.log("prepareTransaction", tx)
    return tx;
  }
}