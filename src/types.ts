declare global {
  interface Window {
    randoms: Float64Array;
  }
}

export interface GetSubmissionParametersParams {
  seedInput: HTMLInputElement;
  countInput: HTMLInputElement;
  useRandomSeedCheckbox: HTMLInputElement;
}

export interface GenerateRandomNumbersInChunksParams {
  seed: bigint;
  count: bigint;
  chunkSize: number;
}

export type SubmissionParameters = {
  seed: bigint;
  count: bigint;
};
