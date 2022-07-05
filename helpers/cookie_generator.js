class generateTokenObject {
  constructor(
    tokenDatestamp,
    tokenDatestampSignature,
    tokenSignature,
    tokenSignatureGenerated,
    tokenSignatures,
    tokenValue
  ) {
    this.tokenDatestamp = tokenDatestamp || null;
    this.tokenDatestampSignature = tokenDatestampSignature || null;
    this.tokenSignature = tokenSignature || "";
    this.tokenSignatureGenerated = tokenSignatureGenerated || "";
    this.tokenSignatures = tokenSignatures || [];
    this.tokenValue = tokenValue || "";
  }

  signatureObject() {
    return {
      gen: this.tokenSignatureGenerated,
      sig: this.tokenSignature,
    };
  }

  tokenObject() {
    return {
      token: this.tokenValue,
      touched: this.tokenDatestamp,
      touchedSig: this.tokenDatestampSignature,
      signatures: this.tokenSignatures,
    };
  }
}

export { generateTokenObject };
