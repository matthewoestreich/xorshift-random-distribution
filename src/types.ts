export interface GetSubmissionParametersParams {
  seedInput: HTMLInputElement;
  countInput: HTMLInputElement;
  useRandomSeedCheckbox: HTMLInputElement;
}

export interface GenerateRandomNumbersInChunksParams {
  seed: bigint;
  count: bigint;
  chunkSize: number;
  outArray: number[];
}

export type SubmissionParameters = {
  seed: bigint;
  count: bigint;
};
