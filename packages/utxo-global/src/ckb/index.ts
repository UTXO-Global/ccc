import { BytesLike, Script, Signature, SignerSignType, ccc } from "@ckb-ccc/core";
import { Provider } from "../advancedBarrel";
import { BI } from "@ckb-lumos/lumos";
import { TransactionSkeleton } from "@ckb-lumos/lumos/helpers";

export class UtxoGlobalCKBSigner extends ccc.Signer {

  
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
    const pubKey = await this.getPublicKey();
    return ccc.verifyMessageUtxoGlobal(message, signature as string, pubKey.slice(2))
  }

  async signOnlyTransaction(
    txLike: ccc.TransactionLike,
  ): Promise<ccc.Transaction> {

    let txSkeleton = new TransactionSkeleton({});
    const tx = ccc.Transaction.from(txLike)
    tx.inputs?.forEach((input: any) => {
        txSkeleton = txSkeleton.update('inputs', (inputs) => inputs.push({
          outPoint: {
            txHash: input.previousOutput.txHash,
            index: this.toHexString(Number(input.previousOutput.index)),
          },
          data: input.outputData || "0x",
          cellOutput: {
            capacity: this.toHexString(Number(input.cellOutput.capacity)),
            lock: input.cellOutput.lock,
            type: input.cellOutput.type || null 
          },

        }));
    });

    tx.outputs?.forEach((output: any, index: number) => {
        txSkeleton = txSkeleton.update('outputs', (outputs) => outputs.push({
          cellOutput: {
            capacity: this.toHexString(Number(output.capacity)),
            lock: output.lock,
            type: output.type || null
          },
          data: "0x"
        }));
    });

    tx.cellDeps?.forEach((cellDep:any) => {
        txSkeleton = txSkeleton.update('cellDeps', (cellDeps) => cellDeps.push({
          outPoint: {
              txHash: cellDep.outPoint.txHash,
              index: this.toHexString(Number(cellDep.outPoint.index)),
          },
          depType: cellDep.depType
      }));
    });

    tx.headerDeps?.forEach((headerDep:any) => {
        txSkeleton = txSkeleton.update('headerDeps', (headerDeps) => headerDeps.push(headerDep));
    });

    tx.witnesses?.forEach((witness:any) => {
        txSkeleton = txSkeleton.update('witnesses', (witnesses) => witnesses.push(witness));
    });

    const rawTx = JSON.stringify(txSkeleton, (key, value) => {
      if (typeof value === 'bigint') {
          return value.toString();
      }
      return value;
    });

    const txSigned = await this.provider.signTransaction(JSON.parse(rawTx))
    return JSON.parse(txSigned) as ccc.Transaction;
  }

  async prepareTransaction(
    txLike: ccc.TransactionLike,
  ): Promise<ccc.Transaction> {
    const tx = ccc.Transaction.from(txLike);
    return tx;
  }

  toHexString(value: any) {
    if (typeof value === 'number') {
      return `0x${value.toString(16)}`;
    } else if (typeof value === 'string') {
      return value.startsWith('0x') ? value : `0x${value}`;
    }
    return value;
  }
}