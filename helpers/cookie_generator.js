class generateTokenObject {
  constructor(
    tokenDatestamp,
    tokenDatestampSignature,
    tokenSignature,
    tokenValue
  ) {
    this.tokenDatestamp = tokenDatestamp;
    this.tokenDatestampSignature = tokenDatestampSignature;
    this.tokenSignature = tokenSignature;
    this.tokenValue = tokenValue;
  }

  tokenObject() {
    return {
      token: this.tokenValue,
      signatures: this.tokenSignature,
      datestamp: {
        signature: this.tokenDatestampSignature,
        touched: this.tokenDatestamp,
      },
    };
  }
}

export { generateTokenObject };
