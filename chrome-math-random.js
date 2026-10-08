/*
 * This script completely mimics how V8 implements Math.random in V8 versions >= 15.4.80.20
 * https://source.chromium.org/chromium/_/chromium/v8/v8/+/03f0a9e97f21af68f1359f011f7d44ddbc2e7130:include/v8-version.h;bpv=1;bpt=0;drc=03f0a9e97f21af68f1359f011f7d44ddbc2e7130
 *
 * If you use `Chrome 154.0.8037.98 (Official Build) (x86_64)`, which runs V8 v15.4.80.20, you
 * can set the seed that Math.random uses by calling Chrome with specific flags.
 *
 * This is how I did it on Mac
 * `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --js-flags="--random-seed=1337"`
 *
 * This means if you run the PRNG in this script with the same seed, you will get the same 
 * exact output as Chrome:
    ```
    const prng = new PRNG(1337n);
    console.log(prng.random());
    ```
 *
 */

function uint64(n) {
  return BigInt.asUintN(64, n);
}

function PRNG(seed) {
  if (typeof seed !== "bigint") {
    throw new Error(`PRNG : seed need to be BigInt! seed=${typeof seed}`);
  }
  if (seed === 0n) {
    throw new Error("PRNG : seed cannot be 0");
  }
  this.xorshift = new XorShift128Plus(
    this.murmurHash3(uint64(seed)),
    this.murmurHash3(uint64(~seed)),
  );
  this.cache = new Float64Array(64);
  this.cacheIndex = 0;
  this.refillCache();
  // To match Chrome exactly, we need to burn 8 values up front.
  // They appear to call Math.random 8 times durng startup, so we need to burn 8 values.
  this.burn(8);
}

PRNG.prototype.burn = function (count) {
  for (let i = 0; i < count; i++) {
    this.random();
  }
};

PRNG.prototype.murmurHash3 = function (h) {
  if (typeof h !== "bigint") {
    throw new Error(
      `PRNG : murmurHash3 : parameter must be BigInt got ${typeof h}`,
    );
  }
  h ^= h >> 33n;
  h = (h * 0xff51afd7ed558ccdn) & 0xffffffffffffffffn;
  h ^= h >> 33n;
  h = (h * 0xc4ceb9fe1a85ec53n) & 0xffffffffffffffffn;
  h ^= h >> 33n;
  return h;
};

PRNG.prototype.refillCache = function () {
  for (let i = 63; i >= 0; i--) {
    this.cache[i] = this.xorshift.random();
  }
  this.cacheIndex = 64;
};

PRNG.prototype.random = function () {
  if (this.cacheIndex <= 0) {
    this.refillCache();
  }
  this.cacheIndex--;
  return this.cache[this.cacheIndex];
};

function XorShift128Plus(s0, s1) {
  if (typeof s0 !== "bigint" || typeof s1 !== "bigint") {
    throw new Error(
      `XorShift128Plus : both seeds need to be BigInt! s0=${typeof s0} s1=${typeof s1}`,
    );
  }
  if (s0 === 0n && s1 === 0n) {
    throw new Error("XorShift128Plus : seeds cannot both be 0");
  }
  this.state0 = s0;
  this.state1 = s1;
}

XorShift128Plus.prototype.random = function () {
  let x = this.state0;
  x ^= uint64(x << 23n);
  x ^= uint64(x >> 17n);
  x ^= uint64(this.state1);
  x ^= uint64(this.state1 >> 26n);
  this.state0 = this.state1;
  this.state1 = uint64(x);
  const random = uint64(this.state0 + this.state1);
  return Number(random >> 11n) / Math.pow(2, 53);
};
