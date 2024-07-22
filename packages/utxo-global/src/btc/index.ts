import { ccc } from "@ckb-ccc/core";
import { Provider } from "../advancedBarrel";

export class UtxoGlobalBTCSigner extends ccc.SignerBtc {
  constructor(
    client: ccc.Client,
    public readonly provider: Provider,
  ) {
    super(client);
  }

  async getBtcAccount() {
    const accounts = await this.provider.getAccount();
    return accounts[0];
  }

  async getBtcPublicKey(): Promise<ccc.Hex> {
    const pubKeys = await this.provider.getPublicKey();
    const account = await this.getBtcAccount();
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
    const account = await this.getBtcAccount();
    return this.provider.signMessage(challenge, account);
  }

  async signMessage(message: ccc.BytesLike): Promise<ccc.Signature> {
    return {
      signature: await this.signMessageRaw(message),
      identity: await this.getIdentity(),
      signType: this.signType,
    };
  }
}