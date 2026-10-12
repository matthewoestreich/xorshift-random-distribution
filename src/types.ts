interface GetSubmissionParametersParams {
  seedInput: HTMLInputElement;
  countInput: HTMLInputElement;
  useRandomSeedCheckbox: HTMLInputElement;
}

interface GenerateRandomNumbersInChunksParams {
  seed: bigint;
  count: bigint;
  chunkSize: number;
  outArray: number[];
}

type SubmissionParameters = {
  seed: bigint;
  count: bigint;
};
