class generateTokenObject {
  constructor(
    tokenDatestamp,
    tokenDatestampSignature,
    tokenSignature,
    tokenValue,
    shadowPromotionSlug
  ) {
    this.tokenDatestamp = tokenDatestamp;
    this.tokenDatestampSignature = tokenDatestampSignature;
    this.tokenSignature = tokenSignature;
    this.tokenValue = tokenValue;
    this.shadowPromotionSlug = shadowPromotionSlug;
  }

  tokenObject() {
    return {
      token: this.tokenValue,
      signatures: this.tokenSignature,
      shadowPromotionSlug: this.shadowPromotionSlug,
      datestamp: {
        signature: this.tokenDatestampSignature,
        touched: this.tokenDatestamp,
      },
    };
  }
}

export { generateTokenObject };
