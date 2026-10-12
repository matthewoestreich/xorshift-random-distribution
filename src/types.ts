interface GetSubmissionParametersParams {
  seedInput: HTMLInputElement;
  countInput: HTMLInputElement;
  useRandomSeed: HTMLInputElement;
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
